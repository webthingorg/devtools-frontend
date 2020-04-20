// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef SYMBOL_SERVER_MODULES_H_
#define SYMBOL_SERVER_MODULES_H_

#include "Variables.h"
#include "lldb/lldb-enumerations.h"
#include "lldb/lldb-forward.h"
#include "lldb/lldb-types.h"
#include "llvm/ADT/Optional.h"
#include "llvm/ADT/SmallString.h"
#include "llvm/ADT/SmallVector.h"
#include "llvm/ADT/StringMap.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/FileSystem.h"

namespace symbol_server {

using Binary = std::string;

struct SourceLocation {
  SourceLocation(llvm::StringRef File, uint32_t Line, uint16_t Column)
      : File(File), Line(Line), Column(Column) {}

  std::string File;
  uint32_t Line;
  uint16_t Column;
};

struct Variable {
  Variable(llvm::StringRef Name, lldb::ValueType Scope, llvm::StringRef Type)
      : Name(Name), Scope(Scope), Type(Type) {}

  std::string Name;
  lldb::ValueType Scope;
  std::string Type;
};

struct ModuleSource {
  enum class SourceType { LocalFile, WebURL };

  ModuleSource(SourceType Type, llvm::StringRef Path)
      : Path(Path), Type(Type) {}

  std::string Path;
  SourceType Type;
};

class WasmModule {
  friend class ModuleCache;
  lldb::ModuleSP Module;
  std::string Id;
  llvm::Optional<llvm::sys::fs::TempFile> TempModule;
  WasmModule(llvm::StringRef Id) : Id(Id) {}

public:
  ~WasmModule();
  WasmModule(const WasmModule &) = delete;
  WasmModule &operator=(const WasmModule &) = delete;
  WasmModule(WasmModule &&) = default;
  WasmModule &operator=(WasmModule &&) = default;

  static std::shared_ptr<WasmModule>
  createFromFile(llvm::StringRef Id, llvm::sys::fs::TempFile Path);

  static std::shared_ptr<WasmModule> createFromFile(llvm::StringRef Id,
                                                    llvm::StringRef Path);

  static std::shared_ptr<WasmModule> createFromCode(llvm::StringRef Id,
                                                    llvm::StringRef ByteCode);

  bool valid() const;
  llvm::StringRef id() const { return Id; }

  llvm::SmallVector<std::string, 1> getSourceScripts() const;
  llvm::SmallVector<SourceLocation, 1>
  getSourceLocationFromOffset(lldb::addr_t Offset) const;
  llvm::SmallVector<lldb::addr_t, 1>
  getOffsetFromSourceLocation(const SourceLocation &SourceLoc) const;
  llvm::SmallVector<MemoryLocation, 1>
  getVariablesInScope(const SourceLocation &SourceLoc) const;
  llvm::SmallVector<Variable, 1> getVariablesInScope(lldb::addr_t Offset) const;
  llvm::Expected<Binary>
  getVariableFormatScript(llvm::StringRef Name, lldb::addr_t FrameOffset) const;
  llvm::Expected<Binary>
  getVariableFormatScript(llvm::StringRef Name,
                          const MemoryLocation &Loc) const;
};

class ModuleCache {
  llvm::SmallVector<std::string, 1> ModuleSearchPaths;
  llvm::StringMap<std::shared_ptr<WasmModule>> Modules;
  std::map<llvm::SmallString<32>, std::shared_ptr<WasmModule>> ModuleHashes;

  llvm::Optional<std::string> resolveLocalModuleFile(llvm::StringRef Url) const;
  std::shared_ptr<WasmModule> loadModule(llvm::StringRef Id,
                                         const ModuleSource &Source);

public:
  ModuleCache();

  const WasmModule *getModuleFromUrl(llvm::StringRef ID, llvm::StringRef Url);
  const WasmModule *getModuleFromCode(llvm::StringRef ID,
                                      llvm::StringRef ByteCode);

  void addModuleSearchPath(const llvm::Twine &);

  const WasmModule *findModule(llvm::StringRef ID) const;
  bool deleteModule(llvm::StringRef ID);
  llvm::SmallVector<const WasmModule *, 1>
  findModulesContainingSourceScript(llvm::StringRef File) const;
};
} // namespace symbol_server
#endif // SYMBOL_SERVER_MODULES_H_
