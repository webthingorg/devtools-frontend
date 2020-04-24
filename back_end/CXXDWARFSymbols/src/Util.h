// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef SYMBOL_SERVER_UTIL_H_
#define SYMBOL_SERVER_UTIL_H_
#include <cstddef>
#include "Plugins/TypeSystem/Clang/TypeSystemClang.h"

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
}  // namespace wasm

template <typename ContainerT>
struct index_traits {                                          // NOLINT
  static size_t size(ContainerT& C) { return C.size(); }       // NOLINT
  static auto at(ContainerT& C, size_t N) { return C.at(N); }  // NOLINT
};

template <typename ContainerT>
struct indexed_iterator {                            // NOLINT
  using container_t = ContainerT;                    // NOLINT
  using iterator_t = indexed_iterator<container_t>;  // NOLINT
  size_t index;
  container_t* container;

  auto operator*() { return index_traits<container_t>::at(*container, index); }
  auto operator->() {
    return &index_traits<container_t>::at(*container, index);
  }

  bool operator<(const iterator_t& o) { return index < o.index; }
  bool operator>(const iterator_t& o) { return index > o.index; }
  bool operator==(const iterator_t& o) { return index == o.index; }
  bool operator!=(const iterator_t& o) { return index != o.index; }

  iterator_t operator+=(size_t n) {
    size_t prev = index;
    index += n;
    if (index < prev || index > index_traits<container_t>::size(*container)) {
      index = index_traits<container_t>::size(*container);
    }
    return *this;
  }
  iterator_t operator-=(size_t n) {
    size_t prev = index;
    index -= n;
    if (index > prev) index = 0;
    return *this;
  }
  iterator_t operator++() { return *this += 1; }
  iterator_t operator--() { return *this -= 1; }
  iterator_t operator++(int) {
    iterator_t r = *this;
    *this += 1;
    return r;
  }
  iterator_t operator--(int) {
    iterator_t r = *this;
    *this -= 1;
    return r;
  }
  friend iterator_t operator+(size_t n, iterator_t i) { return i += n; }
  friend iterator_t operator-(size_t n, iterator_t i) { return i -= n; }
};

template <typename ContainerT>
auto Indexed(ContainerT& c) {
  return llvm::iterator_range<indexed_iterator<ContainerT>>{
      {0, &c}, {index_traits<ContainerT>::size(c), &c}};
}
}  // namespace lldb_private

namespace symbol_server {

template <typename T>
static void initialize() {  // NOLINT
  T::Initialize();
}
template <typename T>
static void terminate() {  // NOLINT
  T::Terminate();
}
template <typename T, typename FirstT, typename... MoreT>
static void initialize() {  // NOLINT
  T::Initialize();
  initialize<FirstT, MoreT...>();
}
template <typename T, typename FirstT, typename... MoreT>
static void terminate() {  // NOLINT
  terminate<FirstT, MoreT...>();
  T::Terminate();
}

template <typename... SystemT>
struct PluginRegistryContext {
  PluginRegistryContext() { initialize<SystemT...>(); }
  ~PluginRegistryContext() { terminate<SystemT...>(); }
};

using DefaultPluginsContext =
    symbol_server::PluginRegistryContext<lldb_private::FileSystem,
                                         lldb_private::CPlusPlusLanguage,
                                         ::ObjectFileELF,
                                         lldb_private::TypeSystemClang,
                                         lldb_private::wasm::ObjectFileWasm,
                                         lldb_private::wasm::SymbolVendorWasm,
                                         ::SymbolFileDWARF>;

}  // namespace symbol_server

#endif  // SYMBOL_SERVER_UTIL_H_
