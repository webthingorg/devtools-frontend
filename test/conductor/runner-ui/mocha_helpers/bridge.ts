// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import fs = require('fs');

const mochaToRunnerPipeName = '/tmp/mocha_to_runner';

class MochaToServerBridge {
  #fifoWs = fs.createWriteStream(mochaToRunnerPipeName);

  sendToServerProcess(data: string) {
    this.#fifoWs.write(data);
  }
}

export const mochaServerBridge = new MochaToServerBridge();
