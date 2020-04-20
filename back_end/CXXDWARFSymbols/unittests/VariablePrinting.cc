// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "gtest/gtest.h"

#include <cstdint>
#include <cstring>
#include <limits>
#include <string>

#include "runtime/formatters.cc"

thread_local static intptr_t OffsetBase = 0;

extern "C" {
void __getMemory(uint32_t offset, uint32_t size, void *result) {
  auto Address = reinterpret_cast<char *>(OffsetBase + offset);
  memcpy(result, Address, size);
}
void __debug(uint32_t, uint32_t) {}
}

template <typename T> T *fixPointerValues(T *Value) {
  OffsetBase = 0xFFFFFFFF00000000 & reinterpret_cast<intptr_t>(Value);
  return reinterpret_cast<T *>(0xFFFFFFFF & reinterpret_cast<intptr_t>(Value));
}

template <typename T> T fixPointerValues(T Value) { return Value; }

template <size_t Size, typename T> static std::string emit(T Value) {
  char Result[Size];

  Value = fixPointerValues(Value);

  Printer P(Result, Size);
  P << ::Value<T>(&Value);

  if (!P.valid() || P.length() == Size)
    return "";
  return {Result, Result + P.length()};
}

template <uint32_t Size, typename T, typename CallableT>
static std::string format(T Value, const char *Variable, CallableT &&C) {
  char Result[Size];
  char *Cur = Result;
  Value = fixPointerValues(Value);
  auto R = C(&Value, Variable, Cur, Size);
  if (R <= 0)
    return "";
  return std::string(Result, R);
}

template <typename T>
class SymbolServerRuntimeIntegers : public ::testing::Test {};
using SymbolServerIntegerTypes = ::testing::Types<int64_t, int32_t, int8_t>;
TYPED_TEST_CASE(SymbolServerRuntimeIntegers, SymbolServerIntegerTypes);

TYPED_TEST(SymbolServerRuntimeIntegers, EmitInteger) {
  TypeParam Value = 7;
  ASSERT_EQ((emit<8, TypeParam>(Value)), "7");

  Value = 10;
  ASSERT_EQ((emit<8, TypeParam>(Value)), "10");

  Value = -10;
  ASSERT_EQ((emit<8, TypeParam>(Value)), "-10");

  Value = 100;
  ASSERT_EQ((emit<2, TypeParam>(Value)), "");

  Value = 0;
  ASSERT_EQ((emit<8, TypeParam>(Value)), "0");

  Value = std::numeric_limits<TypeParam>::max();
  ASSERT_EQ((emit<64, TypeParam>(Value)),
            std::to_string(std::numeric_limits<TypeParam>::max()));

  Value = std::numeric_limits<TypeParam>::min();
  ASSERT_EQ((emit<64, TypeParam>(Value)),
            std::to_string(std::numeric_limits<TypeParam>::min()));
}

TEST(SymbolServerRuntime, TypeName) {
  ConstStringSlice T = getTypename<int>();
  std::string TN = {T.begin(), T.end()};
  ASSERT_EQ(TN, "int32_t");
}

TEST(SymbolServerRuntime, FormattingNullTerminated) {
  char Result[64];
  char *Cur = Result;
  int Value = 7;
  auto R = format_int(&Value, "Value", Cur, 64);
  ASSERT_GT(R, 0);
  ASSERT_LT(R, 64);
  ASSERT_EQ(Result[R], '\0');
}

TEST(SymbolServerRuntime, FormatInt64) {
  int64_t Value = 7;
  ASSERT_EQ(format<64>(Value, "Value", format_int64_t),
            "{\"type\":\"int64_t\",\"name\":\"Value\",\"value\":\"7\"}");
}

TEST(SymbolServerRuntime, FormatInt32) {
  int32_t Value = 7;
  ASSERT_EQ(format<64>(Value, "Value", format_int32_t),
            "{\"type\":\"int32_t\",\"name\":\"Value\",\"value\":\"7\"}");
}

TEST(SymbolServerRuntime, FormatInt8) {
  int8_t Value = 7;
  ASSERT_EQ(format<64>(Value, "Value", format_int8_t),
            "{\"type\":\"int8_t\",\"name\":\"Value\",\"value\":\"7\"}");
}

TEST(SymbolServerRuntime, EmitString) {
  const char *Value = "abc";
  ASSERT_EQ(emit<4>(Value), "abc");
  Value = "";
  ASSERT_EQ(emit<4>(Value), "");
  Value = "abcdefg";
  ASSERT_EQ(emit<4>(Value), "");
  std::string HeapValue =
      "abc"; // hackishly attempt to get a value with a high address
  ASSERT_EQ(emit<4>(HeapValue.c_str()), "abc");
}

TEST(SymbolServerRuntime, FormatString) {
  const char *Value = "abc";
  ASSERT_EQ(format<64>(Value, "Value", format_string),
            "{\"type\":\"const char *\",\"name\":\"Value\",\"value\":\"abc\"}");
}

TEST(SymbolServerRuntime, FormatArray) {
  char Result[512];
  char *Cur = Result;
  int Size = sizeof(Result);
  int N = format_begin_array("A", "int32_t [4]", Cur, Size);
  ASSERT_GT(N, 0);
  ASSERT_LT(N, Size);
  Size -= N;
  Cur += N;
  for (int Element = 0; Element < 4; ++Element) {
    if (Element > 0) {
      N = format_sep(Cur, Size);
      ASSERT_GT(N, 0);
      ASSERT_LT(N, Size);
      Size -= N;
      Cur += N;
    }
    std::string Name = "[" + std::to_string(Element) + "]";
    N = format_int(&Element, Name.c_str(), Cur, Size);
    ASSERT_GT(N, 0);
    ASSERT_LT(N, Size);
    Size -= N;
    Cur += N;
  }
  N = format_end_array(Cur, Size);
  ASSERT_GT(N, 0);
  ASSERT_LT(N, Size);
  std::string Expect =
      "{\"type\":\"int32_t "
      "[4]\",\"name\":\"A\",\"value\":[{\"type\":\"int32_t\",\"name\":\"[0]\","
      "\"value\":\"0\"},{\"type\":\"int32_t\",\"name\":\"[1]\",\"value\":\"1\"}"
      ",{"
      "\"type\":\"int32_t\",\"name\":\"[2]\",\"value\":\"2\"},{\"type\":"
      "\"int32_t\","
      "\"name\":\"[3]\",\"value\":\"3\"}]}";
  ASSERT_EQ(std::string(Result), Expect);
}
