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

/*
struct Error {
  enum Code {
    kInternalError,
    kNotFound,
    kDuplicateModuleId,
    kProtocolError
  } code;
  std::string message;

  static Error NotFoundError(llvm::StringRef module_id) {
    return Error{Code::kNotFound,
                 ("Module with id '" + module_id + "' not found").str()};
  }
};

template <typename ResultT>
struct Result {
  Error error;
  ResultT result;

  explicit Result(ResultT&& result) : result(result) {}
  explicit Result(const Error& error) : error(error) {}
};
*/

namespace symbol_server {
DefaultPluginsContext& GetGlobalContext() {
  static DefaultPluginsContext global_context;
  return global_context;
}

class DWARFSymbolsPlugin {
 public:
  std::vector<std::string> AddRawModule(std::string raw_module_id,
                                        std::string symbols,
                                        std::string raw_module) {
    const WasmModule* module =
        cache_.GetModuleFromUrl(raw_module_id, raw_module);
    if (!module) {
      return {};
    }
    auto sources = module->GetSourceScripts();
    std::vector<std::string> sources_vector(sources.begin(), sources.end());
    return sources_vector;
  }

  DWARFSymbolsPlugin() : context_(GetGlobalContext()) {}

 private:
  symbol_server::ModuleCache cache_;
  DefaultPluginsContext& context_;
};

}  // namespace symbol_server

std::vector<std::string> TestTypes(std::string raw_module_id,
                                   std::string symbols,
                                   std::string raw_module) {
  std::cerr << "TestTypes(" << raw_module_id << ", " << symbols << ", "
            << raw_module << ")\n";
  return {"f"};
}

EMSCRIPTEN_BINDINGS(DWARFSymbolsPlugin) {
  emscripten::register_vector<std::string>("StringArray");
  emscripten::function("TestType", &TestTypes);
  emscripten::class_<symbol_server::DWARFSymbolsPlugin>("DWARFSymbolsPlugin")
      .constructor<>()
      .function("AddRawModule",
                &symbol_server::DWARFSymbolsPlugin::AddRawModule);
}
