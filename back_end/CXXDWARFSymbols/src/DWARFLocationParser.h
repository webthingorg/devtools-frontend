// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef SYMBOL_SERVER_DWARFLOCATIONPARSER_H_
#define SYMBOL_SERVER_DWARFLOCATIONPARSER_H_
#include <map>

#include "lldb/Utility/DataExtractor.h"
#include "lldb/lldb-types.h"
#include "llvm/IR/DerivedTypes.h"
#include "llvm/IR/IRBuilder.h"
#include "llvm/Support/Error.h"

namespace llvm {
class Value;
class Type;
} // namespace llvm

namespace lldb_private {
class Function;
class DWARFExpression;
} // namespace lldb_private

namespace symbol_server {
struct DWARFLocationParser {
  enum class ConstSize { Unknown, i1, i16, i32, i64 };

  DWARFLocationParser(llvm::IRBuilder<> &Builder,
                      llvm::FunctionCallee GetMemoryCallback,
                      llvm::FunctionCallee GetLocalCallback,
                      lldb_private::Function *FunctionContext)
      : Builder(Builder), FunctionContext(FunctionContext), Offset(0),
        GetMemoryCallback(GetMemoryCallback),
        GetLocalCallback(GetLocalCallback) {}

  static llvm::Expected<llvm::Value *>
  parse(llvm::IRBuilder<> &Builder, llvm::FunctionCallee GetMemoryCallback,
        llvm::FunctionCallee GetLocalCallback,
        lldb_private::Function *FunctionContext,
        const lldb_private::DWARFExpression &Expression);

private:
  llvm::Error parseAddr();
  llvm::Error parseFBReg();
  llvm::Error parseWasmLocation();
  llvm::Error parseDeref();
  llvm::Error parseConst(bool Signed, ConstSize Size = ConstSize::Unknown);
  llvm::Error parseDup();
  llvm::Error parseDrop();
  llvm::Error parseOver();
  llvm::Error parsePick();
  llvm::Error parseSwap();
  llvm::Error parseRot();
  llvm::Error parseAnd();
  llvm::Error parseDiv();
  llvm::Error parseMinus();
  llvm::Error parseMod();
  llvm::Error parseMul();
  llvm::Error parseNeg();
  llvm::Error parseNot();
  llvm::Error parseOr();
  llvm::Error parsePlus();
  llvm::Error parsePlusUconst();
  llvm::Error parseShl();
  llvm::Error parseShr();
  llvm::Error parseShra();
  llvm::Error parseXor();
  llvm::Error parseSkip();
  llvm::Error parseLit(uint8_t Lit);
  llvm::Error parseReg(uint8_t Register);
  llvm::Error parseRegx();
  llvm::Error parseBreg(uint8_t Register);
  llvm::Error parseBregx();
  llvm::Error parseNop();
  llvm::Error parsePiece();
  llvm::Error parseBitPiece();
  llvm::Error parseStackValue();

  llvm::Error parseOpcode(uint8_t Opcode);
  llvm::Expected<llvm::Value *> consumeOpcodes();

  llvm::Value *loadFromLocal(llvm::Value *Local, llvm::Type *ResultType);
  llvm::Value *loadFromMemory(llvm::Value *Address, llvm::Type *ResultType);
  llvm::Value *getScratchpad(llvm::Type *ElementType);

  std::map<llvm::Type *, llvm::Value *> Scratchpads;
  llvm::SmallVector<llvm::Value *, 1> OperandStack;
  llvm::IRBuilder<> &Builder;
  lldb_private::Function *FunctionContext;
  lldb_private::DataExtractor Opcodes;
  lldb::offset_t Offset;

  llvm::FunctionCallee GetMemoryCallback, GetLocalCallback;
};

} // namespace symbol_server

#endif //  SYMBOL_SERVER_DWARFLOCATIONPARSER_H_
