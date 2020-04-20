# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

project(CXXDWARFSymbols CXX)
cmake_minimum_required(VERSION 3.13)

set(SYMBOL_SERVER_SOURCE_DIR ${PROJECT_SOURCE_DIR})
set(SYMBOL_SERVER_BINARY_DIR ${PROJECT_BINARY_DIR}/bin)
set(SYMBOL_SERVER_LIBRARY_DIR ${PROJECT_BINARY_DIR}/lib)

# Build dependencies.
set(LLVM_TARGETS_TO_BUILD "X86;WebAssembly" CACHE STRING "")
set(LLVM_ENABLE_PROJECTS "clang;clang-tools-extra;lldb;lld" CACHE STRING "")
set(LLVM_DEFAULT_EXTERNAL_LIT
  ${CMAKE_CURRENT_BINARY_DIR}/third_party/llvm/llvm/bin/llvm-lit CACHE STRING "")
add_subdirectory(third_party/llvm/llvm)
set_property(DIRECTORY third_party/llvm/llvm
  PROPERTY EXCLUDE_FROM_ALL TRUE)


option(SYMBOL_SERVER_BUILD_FORMATTERS
  "Build the formatters library for evaluator modules" OFF)
option(SYMBOL_SERVER_IWYU OFF)

find_program(IWYU NAMES include-what-you-use iwyu)
function(include_what_you_use TARGET)
  if(SYMBOL_SERVER_IWYU AND IWYU)
    set_target_properties(${TARGET} PROPERTIES
      CXX_INCLUDE_WHAT_YOU_USE ${IWYU}
      -Xiwyu --mapping_file=${SYMBOL_SERVER_SOURCE_DIR}/tools/iwyu.imp)
    target_compile_options(${TARGET} PRIVATE "-Werror")
  endif()
endfunction()

set(CMAKE_BUILD_WITH_INSTALL_RPATH FALSE)
set(CMAKE_SKIP_BUILD_RPATH FALSE)

add_subdirectory(src)
add_subdirectory(unittests)
add_subdirectory(tests)
