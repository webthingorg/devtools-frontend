// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const zlib = require('zlib');
const {pipeline} = require('stream');
const brotli = zlib.createBrotliCompress();
pipeline(process.stdin, brotli, process.stdout, err => {
  if (err) {
    console.error('Brotli compression failed.', err);
    process.exit(1);
  }
});
