// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @implements {TextEditor.CodeMirrorMimeMode}
 */
export class DefaultCodeMirrorMimeMode {
  /**
   * @param {!Root.Runtime.Extension} extension
   * @return {!Promise}
   * @override
   */
  async install(extension) {
    // TODO(crbug.com/1029037): lazily load these files again after the
    // race-condition with CodeMirror is fixed
    // const modeFileName = extension.descriptor()['fileName'];
    // return /** @type {!Promise} */ (eval(`import('./${modeFileName}')`));
    return Promise.resolve();
  }
}

CmModes.DefaultCodeMirrorMimeMode = DefaultCodeMirrorMimeMode;
