// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export function set(shadow: ShadowRoot, name: string, value: string): void {
  /*
   * TypeScript only types host as an Element, but within a ShadowRoot of a Custom Element it will be an HTMLElement so we can safely cast here.
   */
  (shadow.host as HTMLElement).style.setProperty(name, value);
}
