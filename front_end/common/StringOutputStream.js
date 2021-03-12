// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @interface
 */
export class OutputStream {
  /**
   * @param {string|!ArrayBuffer} data
   * @return {!Promise.<void>}
   */
  async write(data) {
  }

  /**
   * @return {!Promise.<void>}
   */
  async close() {
  }
}

/**
 * @implements {OutputStream}
 */
export class MemoryOutputStream {
  constructor() {
    /** @type {!Array<string|!ArrayBuffer>} */
    this._data = [];
  }

  /**
   * @param {string|!ArrayBuffer} data
   * @return {!Promise.<void>}
   */
  async write(data) {
    this._data.push(data);
  }

  /**
   * @return {!Promise.<void>}
   */
  async close() {
  }
}

export class BinaryOutputStream extends MemoryOutputStream {
  /**
   * @return {!ArrayBuffer}
   */
  data() {
    if (this._data.length === 0) {
      return new ArrayBuffer(0);
    }

    const encoder = new TextEncoder();
    const binary = this._data.map(chunk => typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
    const totalSize = binary.map(c => c.byteLength).reduce((sum, len) => sum + len);
    const data = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of binary) {
      data.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    return data.buffer;
  }
}

export class StringOutputStream extends MemoryOutputStream {
  /**
   * @return {string}
   */
  data() {
    if (this._data.length === 0) {
      return '';
    }

    const decoder = new TextDecoder();
    const strings = this._data.map(chunk => typeof chunk === 'string' ? chunk : decoder.decode(chunk));
    return strings.join('');
  }
}
