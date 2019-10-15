// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

module.exports = async function({ frontEnd }) {
  await frontEnd.screenshot({ path: `${Date.now()}.png` });
}
