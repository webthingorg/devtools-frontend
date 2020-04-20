// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "DWARFLocationParser.h"

#include "lldb/Core/dwarf.h"
#include "lldb/Expression/DWARFExpression.h"
#include "lldb/Symbol/Function.h"
#include "llvm/IR/Constants.h"
#include "llvm/Support/Error.h"

#define DEBUG_TYPE "symbol_server"

#define CHECK_STACK(Opcode, Size)                                              \
  if (OperandStack.size() != (Size))                                           \
    return createStringError(                                                  \
        inconvertibleErrorCode(),                                              \
        "Expression stack needs at least %d items for DWARF opcode %s",        \
        (Size), toString(Opcode));

using namespace llvm;
using namespace symbol_server;

static const char *toString(uint8_t Opcode) {
  switch (Opcode) {
#define HANDLE_DW_OP(Op, Name, N, Type)                                        \
  case Op:                                                                     \
    return #Name;
#include "llvm/BinaryFormat/Dwarf.def"
#undef HANDLE_DW_OP
  }
  return "UNKNOWN OPCODE";
}

static Error notImplemented() {
  return createStringError(inconvertibleErrorCode(), "Opcode not Implemented");
}

static Error notWasmCompatible() {
  return createStringError(inconvertibleErrorCode(),
                           "Opcode is not supported for WebAssembly");
}

Error DWARFLocationParser::parseAddr() {
  uint64_t Address = Opcodes.GetAddress(&Offset);
  OperandStack.push_back(Builder.getInt32(Address));
  return Error::success();
}

Error DWARFLocationParser::parseDeref() {
  CHECK_STACK(DW_OP_deref, 1);
  Value *Address = OperandStack.pop_back_val();
  OperandStack.push_back(loadFromMemory(Address, Builder.getInt32Ty()));
  return Error::success();
}

Error DWARFLocationParser::parseConst(bool Signed, ConstSize Size) {
  switch (Size) {
  case ConstSize::i1:
    OperandStack.push_back(Builder.getInt8(Opcodes.GetU8(&Offset)));
    break;
  case ConstSize::i16:
    OperandStack.push_back(Builder.getInt16(Opcodes.GetU16(&Offset)));
    break;
  case ConstSize::i32:
    OperandStack.push_back(Builder.getInt32(Opcodes.GetU32(&Offset)));
    break;
  case ConstSize::i64:
    OperandStack.push_back(Builder.getInt64(Opcodes.GetU64(&Offset)));
    break;
  case ConstSize::Unknown:
    if (Signed)
      OperandStack.push_back(Builder.getInt64(Opcodes.GetULEB128(&Offset)));
    else
      OperandStack.push_back(Builder.getInt64(Opcodes.GetSLEB128(&Offset)));
    break;
  }
  return Error::success();
}

Error DWARFLocationParser::parseDup() {
  CHECK_STACK(DW_OP_dup, 1);
  OperandStack.push_back(OperandStack.back());
  return Error::success();
}

Error DWARFLocationParser::parseDrop() {
  CHECK_STACK(DW_OP_drop, 1);
  OperandStack.pop_back();
  return Error::success();
}

Error DWARFLocationParser::parseOver() {
  CHECK_STACK(DW_OP_over, 2);
  OperandStack.push_back(OperandStack[OperandStack.size() - 2]);
  return Error::success();
}

Error DWARFLocationParser::parsePick() {
  uint8_t Index = Opcodes.GetU8(&Offset);
  CHECK_STACK(DW_OP_pick, Index);
  OperandStack.push_back(OperandStack[OperandStack.size() - 1 - Index]);
  return Error::success();
}

Error DWARFLocationParser::parseSwap() {
  CHECK_STACK(DW_OP_swap, 2);
  std::swap(OperandStack.back(), OperandStack[OperandStack.size() - 2]);
  return Error::success();
}

Error DWARFLocationParser::parseRot() {
  CHECK_STACK(DW_OP_rot, 3);
  std::swap(OperandStack.back(), OperandStack[OperandStack.size() - 3]);
  std::swap(OperandStack.back(), OperandStack[OperandStack.size() - 2]);
  return Error::success();
}

Error DWARFLocationParser::parseAnd() {
  CHECK_STACK(DW_OP_and, 2);
  Value *A = OperandStack.pop_back_val();
  Value *B = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateAnd(A, B));
  return Error::success();
}

Error DWARFLocationParser::parseDiv() {
  CHECK_STACK(DW_OP_div, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateSDiv(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseMinus() {
  CHECK_STACK(DW_OP_minus, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateSub(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseMod() {
  CHECK_STACK(DW_OP_mod, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateSRem(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseMul() {
  CHECK_STACK(DW_OP_mul, 2);
  Value *A = OperandStack.pop_back_val();
  Value *B = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateMul(A, B));
  return Error::success();
}

Error DWARFLocationParser::parseNeg() {
  CHECK_STACK(DW_OP_neg, 1);
  Value *A = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateNeg(A));
  return Error::success();
}

Error DWARFLocationParser::parseNot() {
  CHECK_STACK(DW_OP_not, 1);
  Value *A = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateNeg(A));
  return Error::success();
}

Error DWARFLocationParser::parseOr() {
  CHECK_STACK(DW_OP_or, 2);
  Value *A = OperandStack.pop_back_val();
  Value *B = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateOr(A, B));
  return Error::success();
}

Error DWARFLocationParser::parsePlus() {
  CHECK_STACK(DW_OP_plus, 2);
  Value *A = OperandStack.pop_back_val();
  Value *B = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateAdd(A, B));
  return Error::success();
}

Error DWARFLocationParser::parsePlusUconst() {
  CHECK_STACK(DW_OP_plus_uconst, 1);
  Value *A = OperandStack.pop_back_val();
  Value *B = Builder.getInt64(Opcodes.GetULEB128(&Offset));
  OperandStack.push_back(
      Builder.CreateAdd(A, Builder.CreateIntCast(B, A->getType(), false)));
  return Error::success();
}

Error DWARFLocationParser::parseShl() {
  CHECK_STACK(DW_OP_shl, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateShl(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseShr() {
  CHECK_STACK(DW_OP_shr, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateLShr(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseShra() {
  CHECK_STACK(DW_OP_shra, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateAShr(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseXor() {
  CHECK_STACK(DW_OP_xor, 2);
  Value *Top = OperandStack.pop_back_val();
  Value *Second = OperandStack.pop_back_val();
  OperandStack.push_back(Builder.CreateXor(Second, Top));
  return Error::success();
}

Error DWARFLocationParser::parseSkip() {
  int16_t SkipDistance = Opcodes.GetU16(&Offset);
  Offset += SkipDistance;
  return Error::success();
}

Error DWARFLocationParser::parseLit(uint8_t Lit) {
  OperandStack.push_back(Builder.getInt32(Lit));
  return Error::success();
}

Error DWARFLocationParser::parseReg(uint8_t Register) {
  return notWasmCompatible(); // No registers in wasm
}

Error DWARFLocationParser::parseRegx() {
  return notWasmCompatible(); // No registers in wasm
}

Error DWARFLocationParser::parseBreg(uint8_t Register) {
  return notWasmCompatible(); // No registers in wasm
}

Error DWARFLocationParser::parseBregx() {
  return notWasmCompatible(); // No registers in wasm
}

Error DWARFLocationParser::parseFBReg() {
  if (!FunctionContext)
    return createStringError(inconvertibleErrorCode(), "Empty frame base.");

  auto FrameBase =
      parse(Builder, GetMemoryCallback, GetLocalCallback, FunctionContext,
            FunctionContext->GetFrameBaseExpression());
  if (!FrameBase)
    return FrameBase.takeError();
  auto *BaseOffset = Builder.getInt32(Opcodes.GetSLEB128(&Offset));

  OperandStack.push_back(
      Builder.CreateAdd(*FrameBase, BaseOffset, "DW_OP_fbreg"));

  return llvm::Error::success();
}

Error DWARFLocationParser::parseNop() { return Error::success(); }

Error DWARFLocationParser::parsePiece() { return notWasmCompatible(); }

Error DWARFLocationParser::parseBitPiece() { return notWasmCompatible(); }

Error DWARFLocationParser::parseStackValue() { return parseNop(); }

llvm::Error DWARFLocationParser::parseWasmLocation() {
  uint64_t MemType = Opcodes.GetULEB128(&Offset);
  uint64_t Variable = Opcodes.GetULEB128(&Offset);
  enum WasmMemType { Local = 0, Global = 1, Operand = 2 };
  switch (MemType) {
  case Local:
    OperandStack.push_back(
        loadFromLocal(Builder.getInt32(Variable), Builder.getInt32Ty()));
    return llvm::Error::success();
  case Global:
  case Operand:
    return createStringError(inconvertibleErrorCode(),
                             "Unimplemented wasm location type %llu", MemType);
  default:
    return createStringError(inconvertibleErrorCode(),
                             "Unknown wasm location type %llu", MemType);
  }
}

Error DWARFLocationParser::parseOpcode(uint8_t Opcode) {
  Error InnerError = [=] {
    switch (Opcode) {
    case DW_OP_addr:
      return parseAddr();
    case DW_OP_deref:
      return parseDeref();
    case DW_OP_const1u:
      return parseConst(false, ConstSize::i1);
    case DW_OP_const1s:
      return parseConst(true, ConstSize::i1);
    case DW_OP_const2u:
      return parseConst(false, ConstSize::i16);
    case DW_OP_const2s:
      return parseConst(true, ConstSize::i16);
    case DW_OP_const4u:
      return parseConst(false, ConstSize::i32);
    case DW_OP_const4s:
      return parseConst(true, ConstSize::i32);
    case DW_OP_const8u:
      return parseConst(false, ConstSize::i64);
    case DW_OP_const8s:
      return parseConst(true, ConstSize::i64);
    case DW_OP_constu:
      return parseConst(false);
    case DW_OP_consts:
      return parseConst(true);
    case DW_OP_dup:
      return parseDup();
    case DW_OP_drop:
      return parseDrop();
    case DW_OP_over:
      return parseOver();
    case DW_OP_pick:
      return parsePick();
    case DW_OP_swap:
      return parseSwap();
    case DW_OP_rot:
      return parseRot();
    case DW_OP_and:
      return parseAnd();
    case DW_OP_div:
      return parseDiv();
    case DW_OP_minus:
      return parseMinus();
    case DW_OP_mod:
      return parseMod();
    case DW_OP_mul:
      return parseMul();
    case DW_OP_neg:
      return parseNeg();
    case DW_OP_not:
      return parseNot();
    case DW_OP_or:
      return parseOr();
    case DW_OP_plus:
      return parsePlus();
    case DW_OP_plus_uconst:
      return parsePlusUconst();
    case DW_OP_shl:
      return parseShl();
    case DW_OP_shr:
      return parseShr();
    case DW_OP_shra:
      return parseShra();
    case DW_OP_xor:
      return parseXor();
    case DW_OP_skip:
      return parseSkip();
    case DW_OP_lit0:
    case DW_OP_lit1:
    case DW_OP_lit2:
    case DW_OP_lit3:
    case DW_OP_lit4:
    case DW_OP_lit5:
    case DW_OP_lit6:
    case DW_OP_lit7:
    case DW_OP_lit8:
    case DW_OP_lit9:
    case DW_OP_lit10:
    case DW_OP_lit11:
    case DW_OP_lit12:
    case DW_OP_lit13:
    case DW_OP_lit14:
    case DW_OP_lit15:
    case DW_OP_lit16:
    case DW_OP_lit17:
    case DW_OP_lit18:
    case DW_OP_lit19:
    case DW_OP_lit20:
    case DW_OP_lit21:
    case DW_OP_lit22:
    case DW_OP_lit23:
    case DW_OP_lit24:
    case DW_OP_lit25:
    case DW_OP_lit26:
    case DW_OP_lit27:
    case DW_OP_lit28:
    case DW_OP_lit29:
    case DW_OP_lit30:
    case DW_OP_lit31:
      return parseLit(Opcode - DW_OP_lit0);
    case DW_OP_reg0:
    case DW_OP_reg4:
    case DW_OP_reg8:
    case DW_OP_reg12:
    case DW_OP_reg15:
    case DW_OP_reg16:
    case DW_OP_reg17:
    case DW_OP_reg18:
    case DW_OP_reg19:
    case DW_OP_reg20:
    case DW_OP_reg21:
    case DW_OP_reg22:
    case DW_OP_reg23:
    case DW_OP_reg24:
    case DW_OP_reg25:
    case DW_OP_reg26:
    case DW_OP_reg27:
    case DW_OP_reg28:
    case DW_OP_reg29:
    case DW_OP_reg30:
    case DW_OP_reg31:
      return parseReg(Opcode - DW_OP_reg0);
    case DW_OP_regx:
      return parseRegx();
    case DW_OP_breg0:
    case DW_OP_breg1:
    case DW_OP_breg2:
    case DW_OP_breg3:
    case DW_OP_breg4:
    case DW_OP_breg5:
    case DW_OP_breg6:
    case DW_OP_breg7:
    case DW_OP_breg8:
    case DW_OP_breg9:
    case DW_OP_breg10:
    case DW_OP_breg11:
    case DW_OP_breg12:
    case DW_OP_breg13:
    case DW_OP_breg14:
    case DW_OP_breg15:
    case DW_OP_breg16:
    case DW_OP_breg17:
    case DW_OP_breg18:
    case DW_OP_breg19:
    case DW_OP_breg20:
    case DW_OP_breg21:
    case DW_OP_breg22:
    case DW_OP_breg23:
    case DW_OP_breg24:
    case DW_OP_breg25:
    case DW_OP_breg26:
    case DW_OP_breg27:
    case DW_OP_breg28:
    case DW_OP_breg29:
    case DW_OP_breg30:
    case DW_OP_breg31:
      return parseBreg(Opcode - DW_OP_breg0);
    case DW_OP_bregx:
      return parseBregx();
    case DW_OP_fbreg:
      return parseFBReg();
    case DW_OP_nop:
      return parseNop();
    case DW_OP_piece:
      return parsePiece();
    case DW_OP_bit_piece:
      return parseBitPiece();
    case DW_OP_stack_value:
      return parseStackValue();
    case DW_OP_WASM_location:
      return parseWasmLocation();
    default:
      return notImplemented();
    }
  }();

  if (!InnerError)
    return Error::success();
  return joinErrors(createStringError(inconvertibleErrorCode(),
                                      "Failed to parse loction opcode '%s'",
                                      toString(Opcode)),
                    std::move(InnerError));
}

/* static */
Expected<Value *>
DWARFLocationParser::parse(IRBuilder<> &Builder,
                           llvm::FunctionCallee GetMemoryCallback,
                           llvm::FunctionCallee GetLocalCallback,
                           lldb_private::Function *FunctionContext,
                           const lldb_private::DWARFExpression &Expression) {
  DWARFLocationParser P(Builder, GetMemoryCallback, GetLocalCallback,
                        FunctionContext);
  Expression.GetExpressionData(P.Opcodes);

  return P.consumeOpcodes();
}

Expected<Value *> DWARFLocationParser::consumeOpcodes() {
  const lldb::offset_t EndOffset = Opcodes.GetByteSize();

  while (Opcodes.ValidOffset(Offset) && Offset < EndOffset) {
    const uint8_t Op = Opcodes.GetU8(&Offset);
    LLVM_DEBUG(dbgs() << "DW_OP: " << toString(Op) << ". Stack has "
                      << OperandStack.size() << " entries\n");
    if (auto E = parseOpcode(Op))
      return std::move(E);
  }
  return OperandStack.pop_back_val();
}

Value *DWARFLocationParser::getScratchpad(Type *ElementType) {
  auto I = Scratchpads.find(ElementType);
  if (I != Scratchpads.end())
    return I->second;
  return Scratchpads[ElementType] = Builder.CreateAlloca(ElementType);
}

Value *DWARFLocationParser::loadFromLocal(Value *Local, Type *ResultType) {
  Value *Result = getScratchpad(ResultType);
  Value *ArgArray[] = {
      Local, Builder.CreatePointerCast(Result, Builder.getInt8PtrTy())};
  Builder.CreateCall(GetLocalCallback, ArgArray);
  return Builder.CreateLoad(Result);
}

Value *DWARFLocationParser::loadFromMemory(Value *Address, Type *ResultType) {
  Value *Result = getScratchpad(ResultType);
  Value *ArgArray[] = {
      Address, Builder.getInt32(ResultType->getScalarSizeInBits() / 8),
      Builder.CreatePointerCast(Result, Builder.getInt8PtrTy())};
  Builder.CreateCall(GetMemoryCallback, ArgArray);
  return Builder.CreateLoad(Result);
}
