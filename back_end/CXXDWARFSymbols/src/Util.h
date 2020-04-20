// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef SYMBOL_SERVER_UTIL_H_
#define SYMBOL_SERVER_UTIL_H_
#include "Plugins/TypeSystem/Clang/TypeSystemClang.h"
#include <cstddef>

#ifndef DEBUG_TYPE
#define DEBUG_TYPE "symbol_server"
#endif

class ObjectFileELF;
class SymbolVendorWASM;
class SymbolFileDWARF;

namespace lldb_private {
class FileSystem;
class CPlusPlusLanguage;
class ClangASTContext;
namespace wasm {
class ObjectFileWasm;
class SymbolVendorWasm;
} // namespace wasm

template <typename ContainerT> struct index_traits {
  static size_t size(ContainerT &C) { return C.size(); }
  static auto at(ContainerT &C, size_t N) { return C.at(N); }
};

template <typename ContainerT> struct indexed_iterator {
  using container_t = ContainerT;
  using iterator_t = indexed_iterator<container_t>;
  size_t Index;
  container_t *Container;

  auto operator*() { return index_traits<container_t>::at(*Container, Index); }
  auto operator->() {
    return &index_traits<container_t>::at(*Container, Index);
  }

  bool operator<(const iterator_t &O) { return Index < O.Index; }
  bool operator>(const iterator_t &O) { return Index > O.Index; }
  bool operator==(const iterator_t &O) { return Index == O.Index; }
  bool operator!=(const iterator_t &O) { return Index != O.Index; }

  iterator_t operator+=(size_t N) {
    size_t Prev = Index;
    Index += N;
    if (Index < Prev || Index > index_traits<container_t>::size(*Container))
      Index = index_traits<container_t>::size(*Container);
    return *this;
  }
  iterator_t operator-=(size_t N) {
    size_t Prev = Index;
    Index -= N;
    if (Index > Prev)
      Index = 0;
    return *this;
  }
  iterator_t operator++() { return *this += 1; }
  iterator_t operator--() { return *this -= 1; }
  iterator_t operator++(int) {
    iterator_t R = *this;
    *this += 1;
    return R;
  }
  iterator_t operator--(int) {
    iterator_t R = *this;
    *this -= 1;
    return R;
  }
  friend iterator_t operator+(size_t N, iterator_t I) { return I += N; }
  friend iterator_t operator-(size_t N, iterator_t I) { return I -= N; }
};

template <typename IteratorT> struct iterator_range {
  IteratorT _begin, _end;
  auto begin() { return _begin; }
  auto end() { return _end; }
};

template <typename ContainerT> auto indexed(ContainerT &C) {
  return iterator_range<indexed_iterator<ContainerT>>{
      {0, &C}, {index_traits<ContainerT>::size(C), &C}};
}
} // namespace lldb_private

namespace symbol_server {

template <typename T> static void initialize() { T::Initialize(); }
template <typename T> static void terminate() { T::Terminate(); }
template <typename T, typename T_, typename... MoreT> static void initialize() {
  T::Initialize();
  initialize<T_, MoreT...>();
}
template <typename T, typename T_, typename... MoreT> static void terminate() {
  terminate<T_, MoreT...>();
  T::Terminate();
}

template <typename... SystemT> struct PluginRegistryContext {
  PluginRegistryContext() { initialize<SystemT...>(); }
  ~PluginRegistryContext() { terminate<SystemT...>(); }
};

using DefaultPluginsContext = symbol_server::PluginRegistryContext<
    lldb_private::FileSystem, lldb_private::CPlusPlusLanguage, ::ObjectFileELF,
    lldb_private::TypeSystemClang, lldb_private::wasm::ObjectFileWasm,
    lldb_private::wasm::SymbolVendorWasm, ::SymbolFileDWARF>;

} // namespace symbol_server

#endif // SYMBOL_SERVER_UTIL_H_
