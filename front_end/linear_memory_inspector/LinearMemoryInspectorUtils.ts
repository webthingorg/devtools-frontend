// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export function toHexString(byte: number, pad: number) {
  const hex = byte.toString(16).padStart(pad, '0');
  return hex.toUpperCase();
}

export class AddressChangedEvent extends Event {
  data: number

  constructor(index: number) {
    super('address-changed', {});
    this.data = index;
  }
}

export enum Navigation {
  Backward,
  Forward
}

export class PageNavigationEvent extends Event {
  data: Navigation

  constructor(navigation: Navigation) {
    super('page-navigation', {});
    this.data = navigation;
  }
}

export class HistoryNavigationEvent extends Event {
  data: Navigation

  constructor(navigation: Navigation) {
    super('history-navigation', {});
    this.data = navigation;
  }
}

export class RefreshEvent extends Event {
  constructor() {
    super('refresh', {});
  }
}

export class RequestMemoryEvent extends Event {
  data: {start: number, end: number, index: number}

  constructor(start: number, end: number, index: number) {
    super('request-memory', {});
    this.data = {start, end, index};
  }
}
