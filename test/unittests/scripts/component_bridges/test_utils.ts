// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ts from 'typescript';

export const randomStr = () => Math.random().toString(36).substring(7);

export const createTypeScriptSourceFile = (code: string) => {
  const fileName = `${randomStr()}.ts`;
  return ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext);
};
