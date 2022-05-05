// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const url = new URL(document.location);
const numRequests = url.searchParams.get('num') ? parseInt(url.searchParams.get('num'), 10) : 0;
const options = url.searchParams.get('cache') ? {cache: url.searchParams.get('cache')} : null;

for (let i = 0; i < numRequests; i++) {
  fetch(`image.svg?id=${i}`, options);
}
