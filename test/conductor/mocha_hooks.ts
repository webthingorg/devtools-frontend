// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {globalSetup, globalTeardown, resetPages} from './hooks.js';

/* eslint-disable no-console */

before(async function() {
  this.timeout(5000);
  await globalSetup();

  if (process.env['DEBUG']) {
    this.timeout(0);

    console.log('Running in debug mode.');
    console.log(' - Press any key to run the test suite.');
    console.log(' - Press ctrl + c to quit.');

    await new Promise(resolve => {
      const {stdin} = process;

      stdin.on('data', () => {
        stdin.pause();
        resolve();
      });
    });
  }
});

after(async () => {
  await globalTeardown();
});

beforeEach(async function() {
  this.timeout(3000);
  await resetPages();
});
