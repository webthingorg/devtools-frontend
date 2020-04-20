// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "Modules.h"

#include <memory>

#include "Util.h"
#include "lldb/Core/Module.h"
#include "lldb/Core/StreamFile.h"
#include "lldb/Core/Value.h"
#include "lldb/Core/dwarf.h"
#include "lldb/Symbol/Block.h"
#include "lldb/Symbol/CompileUnit.h"
#include "lldb/Symbol/LineTable.h"
#include "lldb/Symbol/SymbolFile.h"
#include "lldb/Symbol/Type.h"
#include "lldb/Symbol/TypeList.h"
#include "lldb/Symbol/VariableList.h"
#include "lldb/Utility/ArchSpec.h"
#include "lldb/Utility/FileSpec.h"
#include "lldb/Utility/RegularExpression.h"
#include "lldb/Utility/Stream.h"
#include "lldb/lldb-enumerations.h"
#include "lldb/lldb-forward.h"
#include "llvm/ADT/DenseSet.h"
#include "llvm/ADT/Optional.h"
#include "llvm/ADT/SmallSet.h"
#include "llvm/ADT/SmallVector.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/CommandLine.h"
#include "llvm/Support/Error.h"
#include "llvm/Support/ErrorHandling.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/MD5.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/raw_ostream.h"

using namespace lldb;

llvm::cl::list<std::string> SearchDirectories("I");

llvm::cl::opt<bool> KeepTemporaries("keep-temp-modules");

namespace lldb_private {

#define INDEX_TRAITS(T)                                                        \
  template <> size_t index_traits<const T##List>::size(const T##List &C) {     \
    return C.GetSize();                                                        \
  }                                                                            \
  template <>                                                                  \
  auto index_traits<const T##List>::at(const T##List &C, size_t N) {           \
    return C.Get##T##AtIndex(N);                                               \
  }                                                                            \
  template <> size_t index_traits<T##List>::size(T##List &C) {                 \
    return C.GetSize();                                                        \
  }                                                                            \
  template <> auto index_traits<T##List>::at(T##List &C, size_t N) {           \
    return C.Get##T##AtIndex(N);                                               \
  }

template <> size_t index_traits<Module>::size(Module &C) {
  return C.GetNumCompileUnits();
}
template <> auto index_traits<Module>::at(Module &C, size_t N) {
  return C.GetCompileUnitAtIndex(N);
}

INDEX_TRAITS(FileSpec);
INDEX_TRAITS(Variable);

} // namespace lldb_private

namespace symbol_server {

std::shared_ptr<WasmModule> WasmModule::createFromFile(llvm::StringRef Id,
                                                       llvm::StringRef Path) {
  if (!llvm::sys::fs::exists(Path)) {
    llvm::errs() << "Module file '" << Path << "' not found\n.";
    return {};
  }
  llvm::errs() << "Loading module from '" << Path << "'\n";

  std::shared_ptr<WasmModule> NewModule(new WasmModule(Id));

  NewModule->Module = std::make_shared<lldb_private::Module>(
      lldb_private::FileSpec(Path),
      lldb_private::ArchSpec("wasm32-unknown-unknown-wasm"));

  NewModule->Module->PreloadSymbols();
  return NewModule;
}

std::shared_ptr<WasmModule>
WasmModule::createFromFile(llvm::StringRef Id, llvm::sys::fs::TempFile Path) {
  auto NewModule = createFromFile(Id, Path.TmpName);
  NewModule->TempModule = std::move(Path);
  return NewModule;
}

std::shared_ptr<WasmModule>
WasmModule::createFromCode(llvm::StringRef Id, llvm::StringRef ByteCode) {
  llvm::SmallString<128> TFile;
  llvm::sys::path::system_temp_directory(true, TFile);
  llvm::sys::path::append(TFile, "%%%%%%.wasm");

  auto TF = llvm::sys::fs::TempFile::create(TFile);
  if (!TF) {
    llvm::errs() << "Failed to create temporary file for module\n";
    return {};
  }

  llvm::StringRef Filename = TF->TmpName;
  llvm::errs() << "Created temporary module " << Filename << "\n";
  {
    llvm::raw_fd_ostream O(TF->FD, false);
    O << ByteCode;
  }

  auto NewModule = createFromFile(Id, std::move(*TF));
  return NewModule;
}

WasmModule::~WasmModule() {
  if (TempModule) {
    if (!KeepTemporaries)
      consumeError(TempModule->discard());
    else
      consumeError(TempModule->keep());
  }
}

bool WasmModule::valid() const {
  return Module && Module->GetNumCompileUnits() > 0;
}

llvm::SmallVector<std::string, 1> WasmModule::getSourceScripts() const {
  llvm::SmallVector<std::string, 1> CUs;
  llvm::SmallSet<std::pair<llvm::StringRef, llvm::StringRef>, 1> AllFiles;
  for (size_t Idx = 0; Idx < Module->GetNumCompileUnits(); Idx++) {
    auto CU = Module->GetCompileUnitAtIndex(Idx);
    for (auto F : indexed(CU->GetSupportFiles())) {
      auto Dir = F.GetDirectory().GetStringRef();
      auto Filename = F.GetFilename().GetStringRef();
      if (Filename.empty())
        continue;
      if (!AllFiles.insert(std::make_pair(Dir, Filename)).second)
        continue;
      CUs.emplace_back(F.GetPath());
    }
  }
  return CUs;
}

static void getVariablesFromOffset(lldb_private::Module &Module,
                                   lldb::addr_t Offset,
                                   lldb_private::VariableList &VarList) {
  if (!Module.GetObjectFile() || !Module.GetObjectFile()->GetSectionList())
    return;
  lldb_private::SymbolContext Sc;
  SectionSP Section =
      Module.GetObjectFile()->GetSectionList()->FindSectionByType(
          lldb::eSectionTypeCode, false);
  lldb_private::Address Addr(Section, Offset);
  auto Resolved =
      Module.ResolveSymbolContextForAddress(Addr, eSymbolContextBlock, Sc);
  if ((Resolved & eSymbolContextBlock) == eSymbolContextBlock)
    if (auto BlockVariables = Sc.block->GetBlockVariableList(true))
      BlockVariables->AppendVariablesIfUnique(VarList);
}

static VariableSP findVariableAtOffset(lldb_private::Module &Module,
                                       lldb::addr_t Offset,
                                       llvm::StringRef Name) {
  lldb_private::VariableList VarList;
  getVariablesFromOffset(Module, Offset, VarList);
  for (auto Var : indexed(VarList)) {
    if (Var->GetName().GetStringRef() == Name)
      return Var;
  }
  VarList.Clear();
  Module.FindGlobalVariables(lldb_private::RegularExpression(Name), 1, VarList);
  if (!VarList.Empty())
    return VarList.GetVariableAtIndex(0);
  return {};
}

llvm::SmallVector<SourceLocation, 1>
WasmModule::getSourceLocationFromOffset(lldb::addr_t Offset) const {
  llvm::SmallVector<SourceLocation, 1> Lines;

  for (CompUnitSP CU : indexed(*Module)) {
    lldb_private::LineTable *LT = CU->GetLineTable();
    lldb_private::LineEntry LE;
    SectionSP Section =
        Module->GetObjectFile()->GetSectionList()->FindSectionByType(
            lldb::eSectionTypeCode, false);
    lldb_private::Address Addr(Section, Offset);
    if (LT->FindLineEntryByAddress(Addr, LE))
      if (LE.line > 0 && LE.column > 0)
        Lines.emplace_back(LE.file.GetPath(), LE.line, LE.column);
  }
  return Lines;
}

llvm::SmallVector<lldb::addr_t, 1>
WasmModule::getOffsetFromSourceLocation(const SourceLocation &SourceLoc) const {
  llvm::SmallVector<lldb::addr_t, 1> Locations;
  std::vector<lldb_private::Address> OutputLocal, OutputExtern;

  for (CompUnitSP CU : indexed(*Module)) {
    lldb_private::SymbolContextList List;
    CU->ResolveSymbolContext(lldb_private::FileSpec(SourceLoc.File),
                             SourceLoc.Line, true, true,
                             eSymbolContextLineEntry, List);
    for (uint32_t I = 0; I < List.GetSize(); I++) {
      lldb_private::SymbolContext Sc;
      if (List.GetContextAtIndex(I, Sc) && Sc.line_entry.IsValid()) {
        llvm::errs() << "Got location: " << Sc.line_entry.line << ":"
                     << Sc.line_entry.column << " ("
                     << Sc.line_entry.is_terminal_entry << ")"
                     << "\n";
        if (Sc.line_entry.line == SourceLoc.Line)
          Locations.push_back(Sc.line_entry.range.GetBaseAddress().GetOffset());
      }
    }
  }
  return Locations;
}

llvm::Optional<std::string>
ModuleCache::resolveLocalModuleFile(llvm::StringRef Url) const {
  if (!llvm::sys::path::is_absolute(Url)) {
    for (auto &BaseDir : ModuleSearchPaths) {
      llvm::SmallString<32> RelativeUrl(Url);
      llvm::sys::fs::make_absolute(BaseDir, RelativeUrl);
      if (llvm::sys::fs::exists(RelativeUrl))
        return {RelativeUrl.c_str()};
    }
  } else {
    if (auto Local =
            resolveLocalModuleFile(llvm::sys::path::relative_path(Url)))
      return Local;

    if (auto Local = resolveLocalModuleFile(llvm::sys::path::filename(Url)))
      return Local;
  }

  if (llvm::sys::fs::exists(Url))
    return Url.str();

  return llvm::None;
}

void ModuleCache::addModuleSearchPath(const llvm::Twine &SearchPath) {
  ModuleSearchPaths.emplace_back(SearchPath.str());
}

const WasmModule *ModuleCache::findModule(llvm::StringRef ScriptId) const {
  auto I = Modules.find(ScriptId);
  if (I != Modules.end())
    return I->second.get();
  return nullptr;
}

bool ModuleCache::deleteModule(llvm::StringRef ScriptId) {
  return Modules.erase(ScriptId) > 0;
}

static llvm::SmallString<32> moduleHash(llvm::StringRef Code) {
  llvm::MD5 Hash;
  llvm::MD5::MD5Result HashResult;
  Hash.update(Code);
  Hash.final(HashResult);
  return HashResult.digest();
}

ModuleCache::ModuleCache()
    : ModuleSearchPaths(SearchDirectories.begin(), SearchDirectories.end()) {}

const WasmModule *ModuleCache::getModuleFromUrl(llvm::StringRef Id,
                                                llvm::StringRef Url) {
  if (auto M = findModule(Id))
    return M;

  auto Hash = moduleHash(Url);
  auto I = ModuleHashes.find(Hash);
  if (I != ModuleHashes.end()) {
    LLVM_DEBUG(llvm::dbgs()
               << "Cache hit for module '" << Id << "' at " << Url << "\n");
    Modules[Id] = I->second;
    return I->second.get();
  }

  auto Source = resolveLocalModuleFile(Url);
  if (!Source) {
    LLVM_DEBUG(llvm::dbgs()
               << "Module '" << Id << "' at " << Url << " not found\n");
    return nullptr;
  }

  std::shared_ptr<WasmModule> Module =
      Modules.insert({Id, WasmModule::createFromFile(Id, *Source)})
          .first->second;
  if (Module) {
    LLVM_DEBUG(llvm::dbgs()
               << "Loaded module " << Id << " with "
               << Module->getSourceScripts().size() << " source files\n");
    ModuleHashes[Hash] = Module;
  }
  return Module.get();
}

const WasmModule *ModuleCache::getModuleFromCode(llvm::StringRef Id,
                                                 llvm::StringRef ByteCode) {
  if (auto M = findModule(Id))
    return M;

  auto Hash = moduleHash(ByteCode);
  auto I = ModuleHashes.find(Hash);
  if (I != ModuleHashes.end()) {
    Modules[Id] = I->second;
    return I->second.get();
  }

  auto Module = Modules.insert({Id, WasmModule::createFromCode(Id, ByteCode)})
                    .first->second;
  if (Module) {
    LLVM_DEBUG(llvm::dbgs()
               << "Loaded module " << Id << " with "
               << Module->getSourceScripts().size() << " source files\n");
    ModuleHashes[Hash] = Module;
  }
  return Module.get();
}

llvm::SmallVector<const WasmModule *, 1>
ModuleCache::findModulesContainingSourceScript(llvm::StringRef File) const {
  lldb_private::FileSpec ScriptSpec(File);
  llvm::SmallVector<const WasmModule *, 1> FoundModules;
  for (auto &KV : Modules) {
    auto &M = KV.second;
    for (auto CU : indexed(*M->Module)) {
      if (CU->GetSupportFiles().FindFileIndex(0, ScriptSpec, true) !=
          UINT32_MAX) {
        LLVM_DEBUG(llvm::dbgs()
                   << "Found " << CU->GetPrimaryFile().GetPath() << "\n");
        FoundModules.push_back(M.get());
        break;
      }
    }
  }
  return FoundModules;
}

llvm::SmallVector<Variable, 1>
WasmModule::getVariablesInScope(lldb::addr_t Offset) const {
  llvm::SmallVector<Variable, 1> Variables;
  lldb_private::VariableList VarList;
  getVariablesFromOffset(*Module, Offset, VarList);
  LLVM_DEBUG(llvm::dbgs() << "Found " << VarList.GetSize()
                          << " variables in scope and ");
  Module->FindGlobalVariables(lldb_private::RegularExpression(".*"), -1,
                              VarList);
  LLVM_DEBUG(llvm::dbgs() << VarList.GetSize() << " globals\n.");
  for (auto Var : indexed(VarList)) {
    Variables.emplace_back(Var->GetName().GetStringRef(), Var->GetScope(),
                           Var->GetType()->GetQualifiedName().GetStringRef());
  }
  return Variables;
}

static VariablePrinter Formatter;

llvm::Expected<Binary>
WasmModule::getVariableFormatScript(llvm::StringRef Name,
                                    lldb::addr_t FrameOffset) const {
  VariableSP Variable = findVariableAtOffset(*Module, FrameOffset, Name);
  if (!Variable)
    return llvm::createStringError(llvm::inconvertibleErrorCode(),
                                   "Variable '%s' not found at offset %zu",
                                   Name.str().c_str(), FrameOffset);

  auto Code = Formatter.generateModule(Name, Variable);
  if (!Code)
    return Code.takeError();
  auto WasmCode = Formatter.generateCode(**Code);
  return WasmCode->getBuffer().str();
}
} // namespace symbol_server
