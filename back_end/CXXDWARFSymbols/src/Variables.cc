// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "Variables.h"

#include <stdint.h>

#include <iostream>
#include <system_error>
#include <vector>

#include "DWARFLocationParser.h"
#include "lld/Common/Driver.h"
#include "lldb/Core/Value.h"
#include "lldb/Core/dwarf.h"
#include "lldb/Symbol/CompilerType.h"
#include "lldb/Symbol/Function.h"
#include "lldb/Symbol/SymbolContextScope.h"
#include "lldb/Symbol/Type.h"
#include "lldb/Symbol/Variable.h"
#include "lldb/Utility/ConstString.h"
#include "lldb/Utility/DataExtractor.h"
#include "lldb/lldb-forward.h"
#include "lldb/lldb-types.h"
#include "symbol-server-config.h"
#include "llvm/ADT/SmallVector.h"
#include "llvm/ADT/Triple.h"
#include "llvm/Analysis/TargetTransformInfo.h"
#include "llvm/BinaryFormat/Dwarf.h"
#include "llvm/DebugInfo/DWARF/DWARFExpression.h"
#include "llvm/IR/BasicBlock.h"
#include "llvm/IR/Constants.h"
#include "llvm/IR/DerivedTypes.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/GlobalVariable.h"
#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/LegacyPassManager.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/Type.h"
#include "llvm/IRReader/IRReader.h"
#include "llvm/Linker/Linker.h"
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Support/Errc.h"
#include "llvm/Support/Error.h"
#include "llvm/Support/ErrorOr.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/MemoryBuffer.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/SourceMgr.h"
#include "llvm/Support/TargetRegistry.h"
#include "llvm/Support/TargetSelect.h"
#include "llvm/Support/raw_ostream.h"
#include "llvm/Target/TargetMachine.h"
#include "llvm/Target/TargetOptions.h"
#include "llvm/Transforms/IPO/PassManagerBuilder.h"
#include "llvm/Transforms/Utils/BasicBlockUtils.h"

#define DEBUG_TYPE "symbol_server"

using namespace llvm;
using namespace lldb;

namespace symbol_server {

static AttributeList getImportModuleAttr(LLVMContext &Context) {
  return AttributeList::get(
      Context, {{AttributeList::FunctionIndex,
                 llvm::Attribute::get(Context, "wasm-import-module", "env")}});
}

// void __getMemory(uint32_t offset, uint32_t size, void* result);
static FunctionCallee getGetMemoryCallback(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction(
      "__getMemory", getImportModuleAttr(M.getContext()), B.getVoidTy(),
      B.getInt32Ty(), B.getInt32Ty(), B.getInt8PtrTy());
}

// void __getLocal(uint32_t local,  void* result);
static FunctionCallee getGetLocalCallback(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction("__getLocal",
                               getImportModuleAttr(M.getContext()),
                               B.getVoidTy(), B.getInt32Ty(), B.getInt8PtrTy());
}

// int format_begin_array(const char* ArrayName, const char *ElementType,
//                        char *Buffer, int Size);
static FunctionCallee getArrayBeginFormatter(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction("format_begin_array", B.getInt32Ty(),
                               B.getInt8PtrTy(), B.getInt8PtrTy(),
                               B.getInt8PtrTy(), B.getInt32Ty());
}

// uint32_t get_scratch_pad_size(void* begin, void* end);
static FunctionCallee getGetScratchPadSize(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction("get_scratch_pad_size", B.getInt32Ty(),
                               B.getInt8PtrTy(), B.getInt8PtrTy());
}

// void* sbrk(intptr_t increment);
static FunctionCallee getSBrk(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction("sbrk", getImportModuleAttr(M.getContext()),
                               B.getInt8PtrTy(), B.getInt32Ty());
}

// int format_sep(char *Buffer, int Size);
static FunctionCallee getSepFormatter(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction("format_sep", B.getInt32Ty(), B.getInt8PtrTy(),
                               B.getInt32Ty());
}

// int format_end_array(char *Buffer, int Size);
static FunctionCallee getArrayEndFormatter(llvm::Module &M) {
  IRBuilder<> B(M.getContext());
  return M.getOrInsertFunction("format_end_array", B.getInt32Ty(),
                               B.getInt8PtrTy(), B.getInt32Ty());
}

static Value *getHeapBase(IRBuilder<> &Builder) {
  llvm::Module &M = *Builder.GetInsertBlock()->getModule();
  Constant *Symbol = M.getOrInsertGlobal("__heap_base", Builder.getInt32Ty());
  return Builder.CreatePointerBitCastOrAddrSpaceCast(Symbol,
                                                     Builder.getInt8PtrTy());
}

template <typename... ArgTs>
static Value *createCall(IRBuilder<> &Builder, FunctionCallee Callee,
                         ArgTs... Args) {
  Value *ArgArray[] = {Args...};
  return Builder.CreateCall(Callee, ArgArray);
}

static Expected<Value *>
readVarValue(IRBuilder<> &Builder, const MemoryLocation &Variable, Type *Ty) {
  llvm::Module &M = *Builder.GetInsertBlock()->getModule();
  switch (Variable.AddressSpace) {
  case WasmAddressSpace::Memory: {
    FunctionCallee F = getGetMemoryCallback(M);
    Value *Result = Builder.CreateAlloca(Ty);
    createCall(Builder, F, Variable.Offset,
               Builder.getInt32(M.getDataLayout().getTypeAllocSize(Ty)),
               Builder.CreateBitCast(Result, Builder.getInt8PtrTy()));
    return Result;
  }
  default:
    return createStringError(llvm::inconvertibleErrorCode(),
                             "Unimplemented Wasm Address Space '%u'",
                             Variable.AddressSpace);
  }
}

void handleError(IRBuilder<> &Builder, Value *ReturnValue) {
  Function *F = Builder.GetInsertBlock()->getParent();
  LLVMContext &Context = F->getContext();
  assert(F && "Broken IR builder");
  BasicBlock *ErrorBlock = BasicBlock::Create(Context, "error", F);
  IRBuilder<>(ErrorBlock)
      .CreateRet(
          ConstantPointerNull::get(cast<PointerType>(F->getReturnType())));

  Value *Cmp = Builder.CreateICmpSLT(ReturnValue, Builder.getInt32(0));
  assert(Builder.GetInsertPoint() != Builder.GetInsertBlock()->end());
  Instruction *IP = &*Builder.GetInsertPoint();
  llvm::SplitBlockAndInsertIfThen(Cmp, IP, false,
                                  /*BranchWeights=*/nullptr,
                                  /*DT=*/nullptr,
                                  /*LI=*/nullptr,
                                  /*ThenBlock=*/ErrorBlock);
  Builder.SetInsertPoint(IP);
}

template <typename... ArgTs>
VariablePrinter::StringSlice
callFormatter(IRBuilder<> &Builder, FunctionCallee Formatter, Value *Buffer,
              Value *Size, ArgTs... Arguments) {
  Value *Args[] = {Arguments..., Buffer, Size};
  Value *Offset = Builder.CreateCall(Formatter, Args, "Offset");
  handleError(Builder, Offset);
  Size = Builder.CreateSub(Size, Offset, "Size");
  Buffer = Builder.CreateInBoundsGEP(Buffer, Offset, "Buffer");
  return std::make_pair(Buffer, Size);
}

Expected<VariablePrinter::StringSlice>
VariablePrinter::formatPrimitive(IRBuilder<> &Builder, Value *Buffer,
                                 Value *Size, StringRef Name,
                                 const lldb_private::CompilerType &VariableType,
                                 const MemoryLocation &Variable) {
  auto &M = *Builder.GetInsertBlock()->getModule();
  auto Formatter =
      PrimitiveFormatters.find(VariableType.GetTypeName().GetStringRef());
  if (Formatter == PrimitiveFormatters.end())
    return createStringError(llvm::inconvertibleErrorCode(),
                             "No formatter for type '%s'",
                             Variable.Type.c_str());
  auto F = Formatter->second(M);
  auto VarValue = readVarValue(
      Builder, Variable,
      F.getFunctionType()->getParamType(0)->getPointerElementType());
  if (!VarValue)
    return VarValue.takeError();
  Value *VarName = Builder.CreateGlobalStringPtr(Name);

  return callFormatter(Builder, Formatter->second(M), Buffer, Size, *VarValue,
                       VarName);
}

Expected<VariablePrinter::StringSlice>
VariablePrinter::formatAggregate(IRBuilder<> &Builder, Value *Buffer,
                                 Value *Size, StringRef Name,
                                 const lldb_private::CompilerType &VariableType,
                                 const MemoryLocation &Variable) {
  auto &M = *Builder.GetInsertBlock()->getModule();

  Value *TypeName =
      Builder.CreateGlobalStringPtr(VariableType.GetTypeName().GetStringRef());
  Value *VarName = Builder.CreateGlobalStringPtr(Name);

  std::tie(Buffer, Size) = callFormatter(Builder, getArrayBeginFormatter(M),
                                         Buffer, Size, VarName, TypeName);
  for (size_t Child = 0, E = VariableType.GetNumFields(); Child < E; ++Child) {
    if (Child > 0)
      std::tie(Buffer, Size) =
          callFormatter(Builder, getSepFormatter(M), Buffer, Size);

    std::string ChildName;
    uint64_t BitOffset;
    auto ChildType = VariableType.GetFieldAtIndex(Child, ChildName, &BitOffset,
                                                  nullptr, nullptr);
    assert(BitOffset % 8 == 0 && "Expecting fields to be byte-aligned");

    MemoryLocation ChildLocation = Variable;
    ChildLocation.Offset = Builder.CreateAdd(ChildLocation.Offset,
                                             Builder.getInt32(BitOffset / 8));
    auto Result = formatVariable(Builder, Buffer, Size, ChildName, ChildType,
                                 ChildLocation);
    if (!Result)
      return Result;
    std::tie(Buffer, Size) = *Result;
  }
  return callFormatter(Builder, getArrayEndFormatter(M), Buffer, Size);
}

Expected<VariablePrinter::StringSlice> VariablePrinter::formatArray(
    IRBuilder<> &Builder, Value *Buffer, Value *Size, StringRef Name,
    const lldb_private::CompilerType &ElementType,
    const MemoryLocation &Variable, uint64_t ArraySize, bool Incomplete) {
  if (Incomplete)
    return createStringError(inconvertibleErrorCode(),
                             "Cannot print array of unknown size: '%s'\n",
                             ElementType.GetTypeName().GetCString());
  auto &M = *Builder.GetInsertBlock()->getModule();
  auto ElementSize = ElementType.GetByteSize(nullptr);
  if (!ElementSize)
    return createStringError(inconvertibleErrorCode(),
                             "Cannot determing byte size of type '%s'\n",
                             ElementType.GetTypeName().GetCString());

  llvm::errs() << "Formatting array of type "
               << ElementType.GetTypeName().GetStringRef() << " with "
               << ArraySize << " elements\n";

  Value *TypeName =
      Builder.CreateGlobalStringPtr(ElementType.GetTypeName().GetStringRef());
  Value *VarName = Builder.CreateGlobalStringPtr(Name);

  std::tie(Buffer, Size) = callFormatter(Builder, getArrayBeginFormatter(M),
                                         Buffer, Size, VarName, TypeName);

  MemoryLocation ElementLocation = Variable;
  for (size_t Element = 0; Element < ArraySize; ++Element) {
    if (Element > 0)
      std::tie(Buffer, Size) =
          callFormatter(Builder, getSepFormatter(M), Buffer, Size);
    // FIXME maybe don't unroll this thing?
    std::string ElementName =
        (Name + "[" + std::to_string(Element) + "]").str();
    auto Result = formatVariable(Builder, Buffer, Size, ElementName,
                                 ElementType, ElementLocation);
    if (!Result)
      return Result;
    std::tie(Buffer, Size) = *Result;
    ElementLocation.Offset = Builder.CreateAdd(ElementLocation.Offset,
                                               Builder.getInt32(*ElementSize));
  }

  return callFormatter(Builder, getArrayEndFormatter(M), Buffer, Size);
}

Expected<VariablePrinter::StringSlice>
VariablePrinter::formatVariable(IRBuilder<> &Builder, Value *Buffer,
                                Value *Size, StringRef Name,
                                const lldb_private::CompilerType &VariableType,
                                const MemoryLocation &Variable) {
  if (VariableType.IsScalarType() || VariableType.IsPointerType())
    return formatPrimitive(Builder, Buffer, Size, Name, VariableType, Variable);

  lldb_private::CompilerType ElementType;
  uint64_t ArraySize;
  bool Incomplete;
  if (VariableType.IsArrayType(&ElementType, &ArraySize, &Incomplete))
    return formatArray(Builder, Buffer, Size, Name, ElementType, Variable,
                       ArraySize, Incomplete);

  if (VariableType.IsAggregateType())
    return formatAggregate(Builder, Buffer, Size, Name, VariableType, Variable);

  return createStringError(inconvertibleErrorCode(),
                           "Unhandled type category for type '%s'",
                           VariableType.GetTypeName().AsCString());
}

llvm::Expected<std::unique_ptr<llvm::Module>>
VariablePrinter::generateModule(StringRef Name, VariableSP Var) {
  auto M = std::make_unique<llvm::Module>("wasm_eval", MainContext);
  M->setDataLayout(WasmTargetMachine->createDataLayout());
  IRBuilder<> Builder(MainContext);

  FunctionCallee Entry =
      M->getOrInsertFunction("wasm_format", Builder.getInt8PtrTy());

  Builder.SetInsertPoint(BasicBlock::Create(
      MainContext, "entry", llvm::cast<llvm::Function>(Entry.getCallee())));
  auto *ScratchPadBegin = getHeapBase(Builder);
  auto *ScratchPadEnd = Builder.CreateCall(getSBrk(*M), {Builder.getInt32(0)});
  auto *Size = Builder.CreateCall(getGetScratchPadSize(*M),
                                  {ScratchPadBegin, ScratchPadEnd});
  Builder.SetInsertPoint(Builder.CreateRet(ScratchPadBegin));

  auto &LocationExp = Var->LocationExpression();
  auto *Function =
      Var->GetSymbolContextScope()->CalculateSymbolContextFunction();

  auto Result = symbol_server::DWARFLocationParser::parse(
      Builder, getGetMemoryCallback(*M), getGetLocalCallback(*M), Function,
      LocationExp);
  if (!Result)
    return Result.takeError();

  LLVM_DEBUG(M->dump());

  auto Type = Var->GetType()->GetFullCompilerType();
  MemoryLocation Location;
  Location.AddressSpace = WasmAddressSpace::Memory;
  Location.Offset = Builder.CreateIntCast(*Result, Builder.getInt32Ty(), false);

  auto Status =
      formatVariable(Builder, ScratchPadBegin, Size, Name, Type, Location);
  if (!Status)
    return Status.takeError();

  return M;
}

std::unique_ptr<Module> VariablePrinter::loadRuntimeModule() {
  SMDiagnostic Err;
  SmallString<128> FormatterModuleFile(SYMBOL_SERVER_TOOL_DIR);
  sys::path::append(FormatterModuleFile, "formatters.bc");
  auto M = getLazyIRFileModule(FormatterModuleFile, Err, MainContext);
  if (!M)
    Err.print("RuntimeModule", errs());
  return M;
}

class TempFileScope {
  sys::fs::TempFile &TheFile;

public:
  TempFileScope(sys::fs::TempFile &F) : TheFile(F) {}
  ~TempFileScope() {
    auto E = TheFile.discard();
    if (E) {
      errs() << "Failed to delete temporary file " << TheFile.TmpName << ": "
             << E << "\n";
    }
  }
};

static auto getTempFile(StringRef Model) {
  SmallString<128> TFile;
  sys::path::system_temp_directory(true, TFile);
  sys::path::append(TFile, Model);
  return sys::fs::TempFile::create(TFile);
}

std::unique_ptr<MemoryBuffer> VariablePrinter::generateCode(Module &M) {

  if (auto RuntimeModule = loadRuntimeModule()) {
    Linker ModuleLinker(M);
    ModuleLinker.linkInModule(std::move(RuntimeModule));
  }
  auto ObjFile = getTempFile("wasm_formatter-%%%%%%.o");
  if (!ObjFile) {
    errs() << "Failed to create temporary object file: " << ObjFile.takeError()
           << "\n";
    return {};
  }
  TempFileScope ObjScope(*ObjFile);
  raw_fd_ostream ASMStream(ObjFile->FD, false);

  Optimizer.run(M, ModuleAnalyses);

  legacy::PassManager PM;
  PM.add(createTargetTransformInfoWrapperPass(
      WasmTargetMachine->getTargetIRAnalysis()));
  if (WasmTargetMachine->addPassesToEmitFile(
          PM, ASMStream, nullptr, CGFT_ObjectFile, true /* verify */)) {
    errs() << "The target does not support generation of this file type!\n";
    return {};
  }
  PM.run(M);
  ASMStream.flush();

  auto ModuleFile = getTempFile("wasm_formatter-%%%%%%.wasm");
  if (!ModuleFile) {
    errs() << "Failed to create temporary module file: "
           << ModuleFile.takeError() << "\n";
    return {};
  }
  TempFileScope ModuleScope(*ModuleFile);
  const char *LinkArgs[] = {"wasm-ld",
                            ObjFile->TmpName.c_str(),
                            "--export=wasm_format",
                            "--no-entry",
                            "--allow-undefined",
                            "-o",
                            ModuleFile->TmpName.c_str()};
  errs() << "Linking: ";
  for (auto *A : LinkArgs)
    errs() << A << " ";
  errs() << "\n";

  if (!lld::wasm::link(LinkArgs, false, llvm::outs(), llvm::errs())) {
    errs() << "Linking failed\n";
    return {};
  }

  auto Data = MemoryBuffer::getFile(ModuleFile->TmpName);
  if (!Data) {
    errs() << "Failed to read temporary module file: "
           << Data.getError().message() << "\n";
    return {};
  }
  errs() << (*Data)->getBufferSize() << "\n";

  return std::move(*Data);
}

#define MAKE_FORMATTER(name, type)                                             \
  {                                                                            \
    name, std::function<FunctionCallee(llvm::Module &)>(                       \
              [](llvm::Module &M) -> FunctionCallee {                          \
                return M.getOrInsertFunction(                                  \
                    "format_" name, Type::getInt32Ty(M.getContext()),          \
                    Type::get##type##PtrTy(M.getContext()),                    \
                    Type::getInt8PtrTy(M.getContext()),                        \
                    Type::getInt8PtrTy(M.getContext()),                        \
                    Type::getInt32Ty(M.getContext()));                         \
              })                                                               \
  }

VariablePrinter::VariablePrinter()
    : PrimitiveFormatters(
          {MAKE_FORMATTER("int64_t", Int64),
           MAKE_FORMATTER("int32_t", Int32),
           MAKE_FORMATTER("int", Int32),
           MAKE_FORMATTER("int8_t", Int8),
           {"const char *", [](llvm::Module &M) -> FunctionCallee {
              return M.getOrInsertFunction(
                  "format_string", Type::getInt32Ty(M.getContext()),
                  Type::getInt8PtrTy(M.getContext())->getPointerTo(),
                  Type::getInt8PtrTy(M.getContext()),
                  Type::getInt8PtrTy(M.getContext()),
                  Type::getInt32Ty(M.getContext()));
            }}}) {
  LLVMInitializeWebAssemblyTarget();
  LLVMInitializeWebAssemblyTargetInfo();
  LLVMInitializeWebAssemblyTargetMC();
  LLVMInitializeWebAssemblyAsmPrinter();

  Triple WasmTriple("wasm32-unknown-unknown-wasm");
  std::string ErrMsg;
  const auto *WasmTarget =
      TargetRegistry::lookupTarget(WasmTriple.getTriple(), ErrMsg);

  if (!WasmTarget) {
    errs() << ErrMsg << "\n";
    return;
  }

  WasmTargetMachine.reset(WasmTarget->createTargetMachine(
      WasmTriple.getTriple(), "", "", {}, /*RelocModel=*/None));
  PassBuilder PB;
  FunctionAnalyses.registerPass([&] { return PB.buildDefaultAAPipeline(); });
  PB.registerModuleAnalyses(ModuleAnalyses);
  PB.registerCGSCCAnalyses(CGSCCAnalyses);
  PB.registerFunctionAnalyses(FunctionAnalyses);
  PB.registerLoopAnalyses(LoopAnalyses);
  PB.crossRegisterProxies(LoopAnalyses, FunctionAnalyses, CGSCCAnalyses,
                          ModuleAnalyses);
  Optimizer =
      PB.buildModuleOptimizationPipeline(PassBuilder::OptimizationLevel::Oz);
}

VariablePrinter::~VariablePrinter() = default;

} // namespace symbol_server
