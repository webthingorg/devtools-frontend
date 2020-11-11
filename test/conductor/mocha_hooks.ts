// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {postFileTeardown, preFileSetup, resetPages, startHostedModeServer, stopHostedModeServer} from './hooks.js';

/* eslint-disable no-console */

process.on('SIGINT', postFileTeardown);

// We can run Mocha in two modes: serial and parallel. In parallel mode, Mocha
// starts multiple node processes which don't know about each other. It
// provides them one test file at a time, and when they are finished with that
// file they ask for another one. This means in parallel mode, the unit of work
// is a test file, and a full setup and teardown is done before/after each file
// even if it will eventually run another test file. This is inefficient for us
// because we have a relatively long setup time, but we can't avoid it at the
// moment. It also means that the setup and teardown code needs to be aware
// that it may be run multiple times within the same node process.

export async function mochaGlobalSetup(this: Mocha.Suite) {
  // It can take arbitrarly long on bots to boot up a server and start
  // DevTools. Since this timeout only applies for this hook, we can let it
  // take an arbitrarily long time, while still enforcing that tests run
  // reasonably quickly (2 seconds by default).
  // this.timeout(0);

  process.env.hostedModeServerPort = String(await startHostedModeServer());
  console.log(`Started hosted mode server on port ${process.env.hostedModeServerPort}`);

  if (process.env['DEBUG']) {
    console.log('Running in debug mode.');
    console.log(' - Press enter to run the test suite.');
    console.log(' - Press ctrl + c to quit.');

    await new Promise<void>(resolve => {
      const {stdin} = process;

      stdin.on('data', () => {
        stdin.pause();
        resolve();
      });
    });
  }
}

export function mochaGlobalTeardown() {
  stopHostedModeServer();
}

export const mochaHooks = {
  // In serial mode (Mocha’s default), before all tests begin, once only.
  // In parallel mode, run before all tests begin, for each file.
  async beforeAll(this: Mocha.Suite) {
    await preFileSetup(Number(process.env.hostedModeServerPort));
  },
  // In serial mode, run after all tests end, once only.
  // In parallel mode, run after all tests end, for each file.
  async afterAll() {
    await postFileTeardown();
  },
  // In both modes, run before each test.
  async beforeEach(this: Mocha.Suite) {
    // Sets the timeout higher for this hook only.
    this.timeout(3000);
    await resetPages();
  },
};
