// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export const enum Category {
  Animation = 1,
  AuctionWorklet = 2,
  Canvas = 3,
  Clipboard = 4,
  Control = 5,
  Device = 6,
  DomMutation = 7,
  DragDrop = 8,
  Geolocation = 9,
  Keyboard = 10,
  Load = 11,
  Media = 12,
  Mouse = 13,
  Notification = 14,
  Parse = 15,
  PictureInPicture = 16,
  Pointer = 17,
  Script = 18,
  Timer = 19,
  Touch = 20,
  TrustedTypeViolation = 21,
  WebAudio = 22,
  Window = 23,
  Worker = 24,
  Xhr = 25,
}

export class CategorizedBreakpoint {
  readonly #category: Category;
  titleInternal: string;
  enabledInternal: boolean;

  constructor(category: Category, title: string) {
    this.#category = category;
    this.titleInternal = title;
    this.enabledInternal = false;
  }

  category(): Category {
    return this.#category;
  }

  enabled(): boolean {
    return this.enabledInternal;
  }

  setEnabled(enabled: boolean): void {
    this.enabledInternal = enabled;
  }

  title(): string {
    return this.titleInternal;
  }

  setTitle(title: string): void {
    this.titleInternal = title;
  }
}
