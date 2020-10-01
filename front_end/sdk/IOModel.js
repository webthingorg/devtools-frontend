// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';

import {RemoteObject} from './RemoteObject.js';              // eslint-disable-line no-unused-vars
import {Capability, SDKModel, Target} from './SDKModel.js';  // eslint-disable-line no-unused-vars

export class IOModel extends SDKModel {
  /**
   * @param {!Target} target
   */
  constructor(target) {
    super(target);
  }

  /**
   * @param {!Protocol.IO.StreamHandle} handle
   * @param {number=} size
   * @param {number=} offset
   * @return {!Promise<string|!ArrayBuffer|null>}
   * @throws {!Error}
   */
  async read(handle, size, offset) {
    const result = await this.target().ioAgent().invoke_read({handle, offset, size});
    if (result.getError()) {
      throw new Error(result.getError());
    }
    if (result.eof) {
      return null;
    }
    if (result.base64Encoded) {
      return Common.Base64.decode(result.data);
    }
    return result.data;
  }

  /**
   * @param {!Protocol.IO.StreamHandle} handle
   */
  async close(handle) {
    const result = await this.target().ioAgent().invoke_close({handle});
    if (result.getError()) {
      console.error('Could not close stream.');
    }
  }

  /**
   * @param {!Protocol.Runtime.RemoteObjectId|!RemoteObject} objectOrObjectId
   * @returns {!Promise<!Protocol.IO.StreamHandle>}
   * @throws {!Error}
   */
  async resolveBlob(objectOrObjectId) {
    const objectId = objectOrObjectId instanceof RemoteObject ? objectOrObjectId.objectId : objectOrObjectId;
    if (!objectId) {
      throw new Error('Remote object has undefined objectId');
    }
    const result = await this.target().ioAgent().invoke_resolveBlob({objectId});
    if (result.getError()) {
      throw new Error(result.getError());
    }
    return `blob:${result.uuid}`;
  }

  /**
   * @param {!Protocol.IO.StreamHandle} handle
   * @throws {!Error}
   */
  async readTextToString(handle) {
    /** @type {!Array<string>} */
    const strings = [];
    for (;;) {
      const data = await this.read(handle, 1024 * 1024);
      if (data instanceof ArrayBuffer) {
        throw new Error('Unexpected binary result form read');
      }
      if (data === null) {
        break;
      }
      strings.push(data);
    }
    return strings.join();
  }

  /**
   * @param {!Protocol.IO.StreamHandle} handle
   * @throws {!Error}
   */
  async readToString(handle) {
    /** @type {!Array<string|ArrayBuffer>} */
    const buffers = [];
    for (;;) {
      const data = await this.read(handle, 1024 * 1024);
      if (data === null) {
        break;
      }
      buffers.push(data);
    }
    if (!buffers.length) {
      return '';
    }
    if (buffers[0] instanceof ArrayBuffer) {
      // We can assume the whole stream was binary.
      const joined = this._join(/** @type {!Array<ArrayBuffer>} */ (buffers));
      const decoder = new TextDecoder();
      return decoder.decode(joined);
    }
    return /** @type {!Array<string>} */ (buffers).join();
  }

  /**
   * @param {!Array<ArrayBuffer>} buffers
   * @returns {!ArrayBuffer}
   */
  _join(buffers) {
    const byteLength = buffers.reduce((size, buffer) => size + buffer.byteLength, 0);
    const result = new Uint8Array(byteLength);
    const currentOffset = 0;
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), currentOffset);
    }
    return result.buffer;
  }
}


SDKModel.register(IOModel, Capability.IO, true);
