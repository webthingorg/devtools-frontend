// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';

/**
 * @typedef {Object} IFileEntry
 * @property {string} name
 * @property {string} content
 * @property {any} metadata
 */

/**
 * @type {?CollectionsStorage}
 */
let _storageInstance;

/**
 * Implements basic synchronous storage for Collections.
 */
export class CollectionsStorage {
  /**
   * @private
   */
  constructor() {
    this._collectionsSetting = Common.Settings.Settings.instance().createSetting('network_console_collections', []);
    this._lastActiveEnvironmentSetting =
        Common.Settings.Settings.instance().createSetting('network_console_last_environment', '');
  }

  static instance() {
    if (!_storageInstance) {
      _storageInstance = new CollectionsStorage();
    }

    return _storageInstance;
  }

  /**
   * @return {!Array<!IFileEntry>}
   */
  _getSetting() {
    return this._collectionsSetting.get();
  }

  /**
   * @param {!Array<!IFileEntry>} files
   */
  _setSetting(files) {
    this._collectionsSetting.set(files);
  }

  /**
   * @return {!Array<string>}
   */
  findAllFiles() {
    const files = this._getSetting();
    return files.map(file => file.name);
  }

  /**
   * Creates a file entry.
   * @param {string} path
   * @param {string} content
   * @param {any} metadata
   * @param {boolean=} replaceIfExists
   */
  createFile(path, content, metadata, replaceIfExists = false) {
    const files = this._getSetting();
    const entry = files.find(f => f.name === path);
    if (entry) {
      if (!replaceIfExists) {
        throw new RangeError('File already exists and was not set to overwrite.');
      }
      entry.content = content;
      entry.metadata = metadata;
    } else {
      files.push({name: path, content, metadata});
    }
    this._setSetting(files);
  }

  /**
   *
   * @param {string} path
   */
  deleteFile(path) {
    const files = this._getSetting();
    const index = files.findIndex(f => f.name === path);
    if (index > -1) {
      files.splice(index, 1);
      this._setSetting(files);
    }
  }

  /**
   *
   * @param {string} path
   * @param {boolean=} throwIfNotFound
   * @return {!IFileEntry|null}
   */
  readFile(path, throwIfNotFound = true) {
    const files = this._getSetting();
    const entry = files.find(f => f.name === path);
    if (!entry) {
      if (throwIfNotFound) {
        throw new RangeError('File not found: ' + path);
      }

      return null;
    }
    return entry;
  }

  /**
   * Deletes all storage.
   */
  clear() {
    this._setSetting([]);
  }

  /**
   * Sets the last-activated environment ID
   * @param {string=} id
   */
  setLastActivatedEnvironment(id = '') {
    this._lastActiveEnvironmentSetting.set(id);
  }

  /**
   * @return {string}
   */
  lastActivatedEnvironment() {
    return this._lastActiveEnvironmentSetting.get();
  }
}
