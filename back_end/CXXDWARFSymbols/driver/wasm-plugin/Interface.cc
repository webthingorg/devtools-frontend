// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
#include <iostream>
#include <string>
#include <vector>

#include <emscripten.h>
#include <emscripten/bind.h>
#include "Modules.h"
#include "Util.h"

#include "Plugins/Language/CPlusPlus/CPlusPlusLanguage.h"  // IWYU pragma: keep
#include "Plugins/ObjectFile/ELF/ObjectFileELF.h"          // IWYU pragma: keep
#include "Plugins/ObjectFile/wasm/ObjectFileWasm.h"        // IWYU pragma: keep
#include "Plugins/SymbolFile/DWARF/SymbolFileDWARF.h"      // IWYU pragma: keep
#include "Plugins/SymbolVendor/wasm/SymbolVendorWasm.h"    // IWYU pragma: keep
#include "lldb/Host/FileSystem.h"                          // IWYU pragma: keep
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/CommandLine.h"
#include "llvm/Support/raw_ostream.h"

namespace symbol_server {
DefaultPluginsContext& GetGlobalContext() {
  static DefaultPluginsContext global_context;
  return global_context;
}

namespace api {
// Error details
class Error {
 public:
  enum class Code { kSuccess, kInternalError, kNotFound };

 private:
  Code code_;            // An error code
  std::string message_;  // The error message

 public:
  Error() : code_(Code::kSuccess) {}
  Error(const Code& code, const std::string& message)
      : code_(code), message_(message) {}
  Code GetCode() const { return code_; }
  void SetCode(Code value) { code_ = std::move(value); }
  std::string GetMessage() const { return message_; }
  void SetMessage(std::string value) { message_ = std::move(value); }
};

class RawModule {
  std::string url_;  // The origin url for the raw module, if it exists
  std::vector<uint8_t>
      code_;  // The source or bytecode defining the JS script or wasm module

 public:
  std::string GetUrl() const { return url_; }
  void SetUrl(std::string value) { url_ = std::move(value); }
  std::vector<uint8_t> GetCode() const { return code_; }
  void SetCode(std::vector<uint8_t> value) { code_ = std::move(value); }
};

// Offsets in raw modules
class RawLocation {
  std::string raw_module_id_;  // Module identifier
  int32_t code_offset_;        // Offset of the location in the raw module

 public:
  std::string GetRawModuleId() const { return raw_module_id_; }
  void SetRawModuleId(std::string value) { raw_module_id_ = std::move(value); }
  int32_t GetCodeOffset() const { return code_offset_; }
  void SetCodeOffset(int32_t value) { code_offset_ = std::move(value); }
};

// Locations in source files
class SourceLocation {
  std::string raw_module_id_;  // Module Id
  std::string source_file_;    // Url of the source file
  int32_t line_number_;        // Line number of the location in the source file
  int32_t column_number_;  // Column number of the location in the source file

 public:
  std::string GetRawModuleId() const { return raw_module_id_; }
  void SetRawModuleId(std::string value) { raw_module_id_ = std::move(value); }
  std::string GetSourceFile() const { return source_file_; }
  void SetSourceFile(std::string value) { source_file_ = std::move(value); }
  int32_t GetLineNumber() const { return line_number_; }
  void SetLineNumber(int32_t value) { line_number_ = std::move(value); }
  int32_t GetColumnNumber() const { return column_number_; }
  void SetColumnNumber(int32_t value) { column_number_ = std::move(value); }
};

// A source language variable
class Variable {
 public:
  enum class Scope { kLocal, kParameter, kGlobal };

 private:
  Scope scope_;       // Scope of the variable
  std::string name_;  // Name of the variable
  std::string type_;  // Type of the variable

 public:
  Scope GetScope() const { return scope_; }
  void SetScope(Scope value) { scope_ = std::move(value); }
  std::string GetName() const { return name_; }
  void SetName(std::string value) { name_ = std::move(value); }
  std::string GetType() const { return type_; }
  void SetType(std::string value) { type_ = std::move(value); }
};

template <typename ResultT>
class Response {
  ResultT value_;
  Error error_;

 public:
  /*implicit */ Response(ResultT value) : value_(std::move(value)) {}  // NOLINT
  /*implicit */ Response(Error error) : error_(std::move(error)) {}    // NOLINT
  ResultT GetValue() const { return value_; }
  void SetValue(ResultT value) { value_ = std::move(value); }
  Error GetError() const { return error_; }
  void SetError(Error error) { error_ = std::move(error); }
};

using AddRawModuleResponse = Response<std::vector<std::string>>;
using SourceLocationToRawLocationResponse = Response<std::vector<RawLocation>>;
using RawLocationToSourceLocationResponse =
    Response<std::vector<SourceLocation>>;
using ListVariablesInScopeResponse = Response<std::vector<Variable>>;
using EvaluateVariableResponse = Response<RawModule>;
}  // namespace api

namespace {
api::Error MakeNotFoundError(llvm::StringRef module_id) {
  return api::Error(api::Error::Code::kNotFound,
                    ("Module with id '" + module_id + "' not found").str());
}

api::Error MakeInternalError(const llvm::Twine& message) {
  return api::Error(api::Error::Code::kInternalError, message.str());
}
api::Error MakeInternalError(llvm::Error internal_error) {
  api::Error error;
  llvm::handleAllErrors(std::move(internal_error),
                        [&error](const llvm::StringError& e) {
                          error = MakeInternalError(e.getMessage());
                        });
  return error;
}

api::Error MakeNoFormattersError() {
  return MakeInternalError("Formatter library not available");
}

api::Variable::Scope ToApiScope(lldb::ValueType scope) {
  switch (scope) {
    case lldb::eValueTypeVariableGlobal:
      return api::Variable::Scope::kGlobal;
    case lldb::eValueTypeVariableArgument:
      return api::Variable::Scope::kParameter;
    case lldb::eValueTypeVariableLocal:
    case lldb::eValueTypeVariableStatic:
      return api::Variable::Scope::kLocal;
    default:
      llvm::errs() << "Got variable scope " << scope << "\n";
      llvm_unreachable("Unhandled variable scope");
  }
}
}  // namespace

class DWARFSymbolsPlugin {
 public:
  api::AddRawModuleResponse AddRawModule(
      std::string raw_module_id,  // A raw module identifier
      std::string symbols,        // A URL to file containing symbols in a
                                  // plugin-specific format.
      api::RawModule raw_module   // The new raw module
  ) {
    const WasmModule* module =
        cache_.GetModuleFromUrl(raw_module_id, raw_module.GetUrl());
    if (!module) {
      return MakeNotFoundError(raw_module_id);
    }

    auto sources = module->GetSourceScripts();
    std::vector<std::string> sources_vector(sources.begin(), sources.end());
    return sources_vector;
  }

  // Find locations in raw modules from a location in a source file
  api::SourceLocationToRawLocationResponse SourceLocationToRawLocation(
      api::SourceLocation
          source_location  // The source location to be looked up
  ) {
    const WasmModule* module =
        cache_.FindModule(source_location.GetRawModuleId());
    if (!module) {
      return MakeNotFoundError(source_location.GetRawModuleId());
    }

    std::vector<api::RawLocation> response;
    for (auto offset : module->GetOffsetFromSourceLocation(
             {source_location.GetSourceFile(),
              static_cast<uint32_t>(source_location.GetLineNumber() + 1),
              static_cast<uint16_t>(source_location.GetLineNumber() + 1)})) {
      response.emplace_back();
      api::RawLocation& raw_loc = response.back();
      raw_loc.SetRawModuleId(source_location.GetRawModuleId());
      raw_loc.SetCodeOffset(offset);
    }
    return response;
  }

  // Find locations in source files from a location in a raw module
  api::RawLocationToSourceLocationResponse RawLocationToSourceLocation(
      api::RawLocation raw_location  // The raw location to be looked up
  ) {
    const WasmModule* mod = cache_.FindModule(raw_location.GetRawModuleId());
    if (!mod) {
      return MakeNotFoundError(raw_location.GetRawModuleId());
    }

    std::vector<api::SourceLocation> response;
    for (auto& source_loc :
         mod->GetSourceLocationFromOffset(raw_location.GetCodeOffset())) {
      response.emplace_back();
      api::SourceLocation& result = response.back();
      result.SetSourceFile(source_loc.file);
      result.SetRawModuleId(raw_location.GetRawModuleId());
      result.SetLineNumber(source_loc.line - 1);
      result.SetColumnNumber(source_loc.column - 1);
    }
    return response;
  }

  // List all variables in lexical scope at a location in a raw module
  api::ListVariablesInScopeResponse ListVariablesInScope(
      api::RawLocation
          raw_location  // The raw location whose scope will be searched
  ) {
    const WasmModule* mod = cache_.FindModule(raw_location.GetRawModuleId());
    if (!mod) {
      return MakeNotFoundError(raw_location.GetRawModuleId());
    }

    std::vector<api::Variable> response;
    for (auto& variable :
         mod->GetVariablesInScope(raw_location.GetCodeOffset())) {
      response.emplace_back();
      api::Variable& result = response.back();
      result.SetScope(ToApiScope(variable.scope));
      result.SetName(variable.name);
      result.SetType(variable.type);
    }
    return response;
  }

  // Evaluate the content of a variable in a given lexical scope
  api::EvaluateVariableResponse EvaluateVariable(
      std::string name,          // Name of the variable to look up
      api::RawLocation location  // The lexical scope to evaluate the variable
  ) {
#ifndef SYMBOL_SERVER_BUILD_FORMATTERS
    return MakeNoFormattersError();
#else
    const WasmModule* mod = cache_.FindModule(location.getrawmoduleid());
    if (!mod) {
      return MakeNotFoundError(location.getrawmoduleid());
    }

    auto format_script = mod->GetVariableFormatScript(
        name, location.getcodeoffset(), mc->Printer());
    if (!format_script) {
      return InternalError(format_script.takeError());
    }

    response.set_allocated_value(new protocol::RawModule());
    *response.mutable_value()->mutable_code() = *format_script;
    return response;
#endif
  }

  DWARFSymbolsPlugin() : context_(GetGlobalContext()) {}

 private:
  symbol_server::ModuleCache cache_;
  DefaultPluginsContext& context_;
};  // namespace symbol_server
}  // namespace symbol_server

EMSCRIPTEN_BINDINGS(DWARFSymbolsPlugin) {
  emscripten::enum_<symbol_server::api::Error::Code>("ErrorCode")
      .value("SUCCESS", symbol_server::api::Error::Code::kSuccess)
      .value("INTERNAl_ERROR", symbol_server::api::Error::Code::kInternalError)
      .value("NOT_FOUND", symbol_server::api::Error::Code::kNotFound);
  emscripten::class_<symbol_server::api::Error>("Error")
      .property("code", &symbol_server::api::Error::GetCode,
                &symbol_server::api::Error::SetCode)
      .property("message", &symbol_server::api::Error::GetMessage,
                &symbol_server::api::Error::SetMessage);

  emscripten::class_<symbol_server::api::RawModule>("RawModule")
      .constructor<>()
      .property("url", &symbol_server::api::RawModule::GetUrl,
                &symbol_server::api::RawModule::SetUrl)
      .property("code", &symbol_server::api::RawModule::GetCode,
                &symbol_server::api::RawModule::SetCode);

  emscripten::class_<symbol_server::api::RawLocation>("RawLocation")
      .constructor<>()
      .property("raw_module_id",
                &symbol_server::api::RawLocation::GetRawModuleId,
                &symbol_server::api::RawLocation::SetRawModuleId)
      .property("code_offset", &symbol_server::api::RawLocation::GetCodeOffset,
                &symbol_server::api::RawLocation::SetCodeOffset);

  emscripten::class_<symbol_server::api::SourceLocation>("SourceLocation")
      .constructor<>()
      .property("raw_module_id",
                &symbol_server::api::SourceLocation::GetRawModuleId,
                &symbol_server::api::SourceLocation::SetRawModuleId)
      .property("source_file",
                &symbol_server::api::SourceLocation::GetSourceFile,
                &symbol_server::api::SourceLocation::SetSourceFile)
      .property("line_number",
                &symbol_server::api::SourceLocation::GetLineNumber,
                &symbol_server::api::SourceLocation::SetLineNumber)
      .property("column_number",
                &symbol_server::api::SourceLocation::GetColumnNumber,
                &symbol_server::api::SourceLocation::SetColumnNumber);

  emscripten::enum_<symbol_server::api::Variable::Scope>("Scope")
      .value("LOCAL", symbol_server::api::Variable::Scope::kLocal)
      .value("PARAMETER", symbol_server::api::Variable::Scope::kParameter)
      .value("GLOBAL", symbol_server::api::Variable::Scope::kGlobal);

  emscripten::class_<symbol_server::api::Variable>("Variable")
      .constructor<>()
      .property("scope", &symbol_server::api::Variable::GetScope,
                &symbol_server::api::Variable::SetScope)
      .property("name", &symbol_server::api::Variable::GetName,
                &symbol_server::api::Variable::SetName)
      .property("type", &symbol_server::api::Variable::GetType,
                &symbol_server::api::Variable::SetType);

  emscripten::register_vector<std::string>("StringArray");
  emscripten::register_vector<symbol_server::api::Variable>("VariableArray");
  emscripten::register_vector<symbol_server::api::SourceLocation>(
      "SourceLocationArray");
  emscripten::register_vector<symbol_server::api::RawLocation>(
      "RawLocationArray");

  emscripten::class_<symbol_server::api::AddRawModuleResponse>(
      "AddRawModuleResponse")
      .property("error", &symbol_server::api::AddRawModuleResponse::GetError,
                &symbol_server::api::AddRawModuleResponse::SetError)
      .property("value", &symbol_server::api::AddRawModuleResponse::GetValue,
                &symbol_server::api::AddRawModuleResponse::SetValue);
  emscripten::class_<symbol_server::api::SourceLocationToRawLocationResponse>(
      "SourceLocationToRawLocationResponse")
      .property(
          "error",
          &symbol_server::api::SourceLocationToRawLocationResponse::GetError,
          &symbol_server::api::SourceLocationToRawLocationResponse::SetError)
      .property(
          "value",
          &symbol_server::api::SourceLocationToRawLocationResponse::GetValue,
          &symbol_server::api::SourceLocationToRawLocationResponse::SetValue);
  emscripten::class_<symbol_server::api::RawLocationToSourceLocationResponse>(
      "RawLocationToSourceLocationResponse")
      .property(
          "error",
          &symbol_server::api::RawLocationToSourceLocationResponse::GetError,
          &symbol_server::api::RawLocationToSourceLocationResponse::SetError)
      .property(
          "value",
          &symbol_server::api::RawLocationToSourceLocationResponse::GetValue,
          &symbol_server::api::RawLocationToSourceLocationResponse::SetValue);
  emscripten::class_<symbol_server::api::ListVariablesInScopeResponse>(
      "ListVariablesInScopeResponse")
      .property("error",
                &symbol_server::api::ListVariablesInScopeResponse::GetError,
                &symbol_server::api::ListVariablesInScopeResponse::SetError)
      .property("value",
                &symbol_server::api::ListVariablesInScopeResponse::GetValue,
                &symbol_server::api::ListVariablesInScopeResponse::SetValue);
  emscripten::class_<symbol_server::api::EvaluateVariableResponse>(
      "EvaluateVariableResponse")
      .property("error",
                &symbol_server::api::EvaluateVariableResponse::GetError,
                &symbol_server::api::EvaluateVariableResponse::SetError)
      .property("value",
                &symbol_server::api::EvaluateVariableResponse::GetValue,
                &symbol_server::api::EvaluateVariableResponse::SetValue);

  emscripten::class_<symbol_server::DWARFSymbolsPlugin>("DWARFSymbolsPlugin")
      .constructor<>()
      .function("AddRawModule",
                &symbol_server::DWARFSymbolsPlugin::AddRawModule)
      .function("SourceLocationToRawLocation",
                &symbol_server::DWARFSymbolsPlugin::SourceLocationToRawLocation)
      .function("RawLocationToSourceLocation",
                &symbol_server::DWARFSymbolsPlugin::RawLocationToSourceLocation)
      .function("ListVariablesInScope",
                &symbol_server::DWARFSymbolsPlugin::ListVariablesInScope)
      .function("EvaluateVariable",
                &symbol_server::DWARFSymbolsPlugin::EvaluateVariable);
}
