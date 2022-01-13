// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');

module.exports.writeIfChanged = (generatedFileLocation, newContents) => {
  if (fs.existsSync(generatedFileLocation)) {
    if (fs.readFileSync(generatedFileLocation, {encoding: 'utf8', flag: 'r'}) === newContents) {
      return;
    }
  }

  fs.writeFileSync(generatedFileLocation, newContents, {encoding: 'utf-8'});
};
