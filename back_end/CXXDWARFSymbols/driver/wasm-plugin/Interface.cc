// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
#include <iostream>
#include <string>
#include <vector>

#include <emscripten.h>
#include <emscripten/bind.h>

struct Error {
  enum Code {
    kInternalError,
    kNotFound,
    kDuplicateModuleId,
    kProtocolError
  } code;
  std::string message;
};

struct RawModule {
  std::string url;
  std::vector<uint8_t> code;
};

std::vector<std::string> AddRawModule() {
  std::cout << "Foo" << std::endl;
  // std::cout << "AddRawModule(" << raw_module_id << ", " << symbols
  //          << raw_module.url << ")" << std::endl;
  return {"foo.c"};
}

EMSCRIPTEN_BINDINGS(DWARFSymbolsPlugin) {
  emscripten::register_vector<std::string>("strings");
  emscripten::function("AddRawModule", &AddRawModule);
}
