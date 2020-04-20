// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef SYMBOL_SERVER_VARIABLES_H_
#define SYMBOL_SERVER_VARIABLES_H_

#include "lldb/Symbol/Variable.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Analysis/CGSCCPassManager.h"
#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/PassManager.h"
#include "llvm/IR/Value.h"
#include "llvm/Support/Error.h"
#include "llvm/Support/ErrorOr.h"
#include "llvm/Transforms/Scalar/LoopPassManager.h"
#include <functional>
#include <memory>

namespace llvm {
class TargetMachine;
}

namespace lldb_private {
class CompilerType;
} // namespace lldb_private

namespace symbol_server {
enum class WasmAddressSpace { Memory, Local, Global };

struct MemoryLocation {
  std::string Type;
  WasmAddressSpace AddressSpace;
  llvm::Value *Offset;
};

class VariablePrinter {
public:
  using StringSlice = std::pair<llvm::Value *, llvm::Value *>;
  VariablePrinter();
  ~VariablePrinter();
  VariablePrinter(const VariablePrinter &) = delete;
  VariablePrinter(VariablePrinter &&) = delete;

  llvm::Expected<std::unique_ptr<llvm::Module>>
  generateModule(llvm::StringRef VariableName, lldb::VariableSP Variable);
  std::unique_ptr<llvm::MemoryBuffer> generateCode(llvm::Module &M);

private:
  std::unique_ptr<llvm::Module> loadRuntimeModule();

  llvm::Expected<StringSlice>
  formatVariable(llvm::IRBuilder<> &Builder, llvm::Value *Buffer,
                 llvm::Value *Size, llvm::StringRef Name,
                 const lldb_private::CompilerType &VariableType,
                 const MemoryLocation &Variable);
  llvm::Expected<StringSlice>
  formatPrimitive(llvm::IRBuilder<> &Builder, llvm::Value *Buffer,
                  llvm::Value *Size, llvm::StringRef Name,
                  const lldb_private::CompilerType &VariableType,
                  const MemoryLocation &Variable);
  llvm::Expected<StringSlice>
  formatAggregate(llvm::IRBuilder<> &Builder, llvm::Value *Buffer,
                  llvm::Value *Size, llvm::StringRef Name,
                  const lldb_private::CompilerType &VariableType,
                  const MemoryLocation &Variable);
  llvm::Expected<StringSlice> formatArray(
      llvm::IRBuilder<> &Builder, llvm::Value *Buffer, llvm::Value *Size,
      llvm::StringRef Name, const lldb_private::CompilerType &ElementType,
      const MemoryLocation &Variable, uint64_t ArraySize, bool Incomplete);

  llvm::LLVMContext MainContext;
  std::map<llvm::StringRef, std::function<llvm::FunctionCallee(llvm::Module &)>>
      PrimitiveFormatters;
  std::unique_ptr<llvm::TargetMachine> WasmTargetMachine;

  llvm::ModulePassManager Optimizer;
  llvm::LoopAnalysisManager LoopAnalyses;
  llvm::FunctionAnalysisManager FunctionAnalyses;
  llvm::CGSCCAnalysisManager CGSCCAnalyses;
  llvm::ModuleAnalysisManager ModuleAnalyses;
};
} // namespace symbol_server

#endif // SYMBOL_SERVER_VARIABLES_H_
