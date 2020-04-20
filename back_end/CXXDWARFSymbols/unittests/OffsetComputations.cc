// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "Modules.h"
#include "Util.h"
#include "symbol-server-test-config.h"

#include "Plugins/Language/CPlusPlus/CPlusPlusLanguage.h" // IWYU pragma: keep
#include "Plugins/ObjectFile/ELF/ObjectFileELF.h"         // IWYU pragma: keep
#include "Plugins/ObjectFile/wasm/ObjectFileWasm.h"       // IWYU pragma: keep
#include "Plugins/SymbolFile/DWARF/SymbolFileDWARF.h"     // IWYU pragma: keep
#include "Plugins/SymbolVendor/wasm/SymbolVendorWasm.h"   // IWYU pragma: keep
#include "lldb/Host/FileSystem.h"                         // IWYU pragma: keep
#include "lldb/lldb-types.h"
#include "llvm/ADT/SmallString.h"
#include "llvm/ADT/SmallVector.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/Error.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/raw_ostream.h"
#include "gmock/gmock.h"
#include "gtest/gtest.h"

#include <string>
#include <utility>

static symbol_server::DefaultPluginsContext C;

static llvm::SmallString<32> makeFile(llvm::StringRef FileName,
                                      bool MakeAbsolute = false) {
  llvm::SmallString<32> File;
  if (MakeAbsolute)
    File = SYMBOL_SERVER_TEST_INPUTS_DIRECTORY;
  llvm::sys::path::append(File, FileName);
  return File;
}

struct SymbolServerTest : public ::testing::Test {
  symbol_server::ModuleCache Cache;

  const symbol_server::WasmModule *getModule(llvm::StringRef ModuleName) {
    return Cache.getModuleFromUrl(ModuleName, makeFile(ModuleName, true));
  }
};

TEST_F(SymbolServerTest, AddScript) {
  auto *Module = getModule("hello.wasm");
  ASSERT_TRUE(Module);
  EXPECT_TRUE(Module->valid());
}

TEST_F(SymbolServerTest, SourceScripts) {
  auto *Module = getModule("hello.wasm");
  ASSERT_TRUE(Module);
  EXPECT_EQ(Module->getSourceScripts().size(), 2u);
}

TEST_F(SymbolServerTest, HelloAddScript) {
  auto *Module = getModule("hello.wasm");
  ASSERT_TRUE(Module);
  EXPECT_TRUE(Module->valid());
  auto Scripts = Module->getSourceScripts();
  llvm::SmallVector<llvm::StringRef, 2> Filenames;
  EXPECT_EQ(Scripts.size(), 2u);
  for (auto &S : Scripts)
    Filenames.push_back(S);
  EXPECT_THAT(Filenames, testing::UnorderedElementsAre("hello.c", "printf.h"));
}

TEST_F(SymbolServerTest, HelloSourceToRawLocation) {
  auto *Module = getModule("hello.wasm");
  ASSERT_TRUE(Module);
  symbol_server::SourceLocation SourceLocation(makeFile("hello.c"), 4, 3);

  lldb::addr_t CodeSectionStart = 0xf2;

  const llvm::SmallVector<const symbol_server::WasmModule *, 1> &Modules =
      Cache.findModulesContainingSourceScript(SourceLocation.File);
  EXPECT_EQ(Modules.size(), 1u);
  if (Modules.empty())
    return;

  const llvm::SmallVectorImpl<lldb::addr_t> &RawLocations =
      Modules.front()->getOffsetFromSourceLocation(SourceLocation);
  EXPECT_EQ(RawLocations.size(), 1u);
  EXPECT_THAT(RawLocations,
              testing::ElementsAre(lldb::addr_t(0x167 - CodeSectionStart)));
}

TEST_F(SymbolServerTest, HelloRawToSourceLocation) {
  auto *Module = getModule("hello.wasm");
  ASSERT_TRUE(Module);
  lldb::addr_t CodeSectionStart = 0xf2;
  auto Loc = Module->getSourceLocationFromOffset(0x167 - CodeSectionStart);
  EXPECT_EQ(Loc.size(), 1u);
  if (Loc.empty())
    return;
  EXPECT_EQ(Loc.front().File, "hello.c");
  EXPECT_EQ(Loc.front().Column, 3u);
  EXPECT_EQ(Loc.front().Line, 4u);
}

TEST_F(SymbolServerTest, InlineSourceToRawLocation) {
  auto *Module = getModule("inline.wasm");
  ASSERT_TRUE(Module);
  symbol_server::SourceLocation SourceLocation(makeFile("inline.cc"), 4, 18);

  lldb::addr_t CodeSectionStart = 0x102;

  const llvm::SmallVector<const symbol_server::WasmModule *, 1> &Modules =
      Cache.findModulesContainingSourceScript(SourceLocation.File);
  EXPECT_EQ(Modules.size(), 1u);
  if (Modules.empty())
    return;

  const llvm::SmallVectorImpl<lldb::addr_t> &RawLocations =
      Modules.front()->getOffsetFromSourceLocation(SourceLocation);
  EXPECT_EQ(RawLocations.size(), 8u);
  EXPECT_THAT(RawLocations,
              testing::ElementsAre(lldb::addr_t(0x155 - CodeSectionStart),
                                   lldb::addr_t(0x15C - CodeSectionStart),
                                   lldb::addr_t(0x163 - CodeSectionStart),
                                   lldb::addr_t(0x16A - CodeSectionStart),
                                   lldb::addr_t(0x18D - CodeSectionStart),
                                   lldb::addr_t(0x194 - CodeSectionStart),
                                   lldb::addr_t(0x19B - CodeSectionStart),
                                   lldb::addr_t(0x1A2 - CodeSectionStart)));
}

TEST_F(SymbolServerTest, InlineRawToSourceLocation) {
  auto *M = getModule("inline.wasm");
  ASSERT_TRUE(M);
  lldb::addr_t CodeSectionStart = 0x102;
  {
    auto Loc = M->getSourceLocationFromOffset(0x167 - CodeSectionStart);
    EXPECT_EQ(Loc.size(), 1u);
    if (Loc.empty())
      return;
    EXPECT_EQ(Loc.front().File, "inline.cc");
    EXPECT_EQ(Loc.front().Column, 18u);
    EXPECT_EQ(Loc.front().Line, 4u);
  }
  {
    auto Loc = M->getSourceLocationFromOffset(0x19F - CodeSectionStart);
    EXPECT_EQ(Loc.size(), 1u);
    if (Loc.empty())
      return;
    EXPECT_EQ(Loc.front().File, "inline.cc");
    EXPECT_EQ(Loc.front().Column, 18u);
    EXPECT_EQ(Loc.front().Line, 4u);
  }
  {
    auto Loc = M->getSourceLocationFromOffset(0x1BB - CodeSectionStart);
    EXPECT_EQ(Loc.size(), 1u);
    if (Loc.empty())
      return;
    EXPECT_EQ(Loc.front().File, "inline.cc");
    EXPECT_EQ(Loc.front().Column, 7u);
    EXPECT_EQ(Loc.front().Line, 10u);
  }
  {
    auto Loc = M->getSourceLocationFromOffset(0x1DC - CodeSectionStart);
    EXPECT_EQ(Loc.size(), 1u);
    if (Loc.empty())
      return;
    EXPECT_EQ(Loc.front().File, "inline.cc");
    EXPECT_EQ(Loc.front().Column, 3u);
    EXPECT_EQ(Loc.front().Line, 16u);
  }
}

TEST_F(SymbolServerTest, AddScriptMissingScript) {
  const symbol_server::WasmModule *M = getModule("@InvalidPath");
  EXPECT_FALSE(M);
}

TEST_F(SymbolServerTest, GlobalVariable) {
  auto *Module = getModule("global.wasm");
  ASSERT_TRUE(Module);
  auto Variables = Module->getVariablesInScope(0x10);
  llvm::SmallVector<llvm::StringRef, 1> Names;
  for (auto &V : Variables)
    Names.push_back(V.Name);
  EXPECT_THAT(Names, testing::UnorderedElementsAre("I"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
  auto Snippet = Module->getVariableFormatScript("I", 0x10);
  EXPECT_TRUE(!!Snippet);
  EXPECT_FALSE(Snippet->empty());
#endif
}

TEST_F(SymbolServerTest, ClassStaticVariable) {
  auto *Module = getModule("classstatic.wasm");
  ASSERT_TRUE(Module);
  auto Variables = Module->getVariablesInScope(0x10);
  llvm::SmallVector<llvm::StringRef, 1> Names;
  for (auto &V : Variables)
    Names.push_back(V.Name);
  EXPECT_THAT(Names, testing::UnorderedElementsAre("MyClass::I"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
  auto Snippet = Module->getVariableFormatScript("I", 0x10);
  EXPECT_TRUE(!!Snippet);
  EXPECT_FALSE(Snippet->empty());
#endif
}

TEST_F(SymbolServerTest, InlineLocalVariable) {
  auto *M = getModule("inline.wasm");
  ASSERT_TRUE(M);
  lldb::addr_t CodeSectionStart = 0x102;
  {
    const int Location = 0x167 - CodeSectionStart;
    auto Variables = M->getVariablesInScope(Location);
    llvm::SmallVector<llvm::StringRef, 1> Names;
    for (auto &V : Variables)
      Names.push_back(V.Name);
    EXPECT_THAT(Names, testing::UnorderedElementsAre("x", "result"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
    auto Snippet = M->getVariableFormatScript("result", Location);
    EXPECT_TRUE(!!Snippet);
    EXPECT_FALSE(Snippet->empty());
#endif
  }
  {
    const int Location = 0x19F - CodeSectionStart;
    auto Variables = M->getVariablesInScope(Location);
    llvm::SmallVector<llvm::StringRef, 1> Names;
    for (auto &V : Variables)
      Names.push_back(V.Name);
    EXPECT_THAT(Names, testing::UnorderedElementsAre("x", "result"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
    auto Snippet = M->getVariableFormatScript("result", Location);
    EXPECT_TRUE(!!Snippet);
    EXPECT_FALSE(Snippet->empty());
#endif
  }
  {
    const int Location = 0x1BB - CodeSectionStart;
    auto Variables = M->getVariablesInScope(Location);
    llvm::SmallVector<llvm::StringRef, 1> Names;
    for (auto &V : Variables)
      Names.push_back(V.Name);
    EXPECT_THAT(Names, testing::UnorderedElementsAre("x", "y", "dsq"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
    auto Snippet = M->getVariableFormatScript("dsq", Location);
    EXPECT_TRUE(!!Snippet);
    EXPECT_FALSE(Snippet->empty());
#endif
  }
  {
    const int Location = 0x1DC - CodeSectionStart;
    auto Variables = M->getVariablesInScope(Location);
    llvm::SmallVector<llvm::StringRef, 1> Names;
    for (auto &V : Variables)
      Names.push_back(V.Name);
    EXPECT_THAT(Names, testing::UnorderedElementsAre("I"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
    auto Snippet = M->getVariableFormatScript("I", Location);
    EXPECT_TRUE(!!Snippet);
    EXPECT_FALSE(Snippet->empty());
#endif
  }
}

TEST_F(SymbolServerTest, Strings) {
  auto *Module = getModule("string.wasm");
  ASSERT_TRUE(Module);
  auto Variables = Module->getVariablesInScope(0x11);
  llvm::SmallVector<llvm::StringRef, 1> Names;
  for (auto &V : Variables) {
    Names.push_back(V.Name);
    llvm::errs() << V.Type << "\n";
  }
  EXPECT_THAT(Names, testing::UnorderedElementsAre("String"));

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
  auto Snippet = Module->getVariableFormatScript("String", 0x11);
  EXPECT_TRUE(!!Snippet);
  EXPECT_FALSE(Snippet->empty());
#endif
}

TEST_F(SymbolServerTest, Arrays) {
  auto *Module = getModule("array.wasm");
  ASSERT_TRUE(Module);
  lldb::addr_t CodeSectionStart = 0x55;
  auto Variables = Module->getVariablesInScope(0xe7 - CodeSectionStart);
  llvm::SmallVector<std::pair<llvm::StringRef, llvm::StringRef>, 1> Names;
  EXPECT_EQ(Variables.size(), 1u);
  if (Variables.size() > 0) {
    EXPECT_EQ(Variables.front().Name, "A");
    EXPECT_EQ(Variables.front().Type, "int [4]");
  }

#ifdef SYMBOL_SERVER_BUILD_FORMATTERS
  auto Snippet = Module->getVariableFormatScript("A", 0xe7 - CodeSectionStart);
  EXPECT_TRUE(!!Snippet) << Snippet.takeError();
  EXPECT_FALSE(Snippet->empty());
#endif
}
