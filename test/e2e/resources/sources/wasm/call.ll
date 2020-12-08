; Copyright 2020 The Chromium Authors. All rights reserved.
; Use of this source code is governed by a BSD-style license that can be
; found in the LICENSE file.
source_filename = "call.ll"
target triple = "wasm32-unknown-unknown-wasm"

define dso_local i32 @Func() {
  %1 = alloca i32
  store i32 0, i32* %1
  %2 = load i32, i32* %1
  ret i32 %2
}

define dso_local i32 @Main() {
  %1 = call i32() @Func()
  ret i32 %1
}
