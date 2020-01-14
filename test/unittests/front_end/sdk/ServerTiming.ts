// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {default as ServerTiming} from '/front_end/sdk/ServerTiming.js';

describe.only('ServerTiming', () => {
  it('can be instantiated correctly', () => {
    const serverTiming = new ServerTiming('example metric', 1, 'example description');
    assert.equal(serverTiming.metric, 'example metric', 'metric was not set correctly');
    assert.equal(serverTiming.value, 1, 'value was not set correctly');
    assert.equal(serverTiming.description, 'example description', 'description was not set correctly');
  });

  it('createFromHeaderValue works correctly for the latest header syntax', () => {
    const actual = ServerTiming.createFromHeaderValue('lb; desc = "Load bala\\ncer" ; dur= 42,sql-1 ;desc="MySQL lookup server";dur=100,sql-2;dur =900;desc="MySQL shard server #1",fs;\tdur=600;desc="FileSystem",\tcache;dur=300;desc="",other;dur=200;desc="Database write",other;dur=110;desc="Database read",cpu;dur=1230;desc="Total CPU"');
    const expected = [
      {
        name: 'lb',
        desc: 'Load balancer',
        dur: 42,
      },
      {
        name: 'sql-1',
        desc: 'MySQL lookup server',
        dur: 100,
      },
      {
        name: 'sql-2',
        dur: 900,
        desc: 'MySQL shard server #1',
      },
      {
        name: 'fs',
        dur: 600,
        desc: 'FileSystem',
      },
      {
        name: 'cache',
        dur: 300,
        desc: '',
      },
      {
        name: 'other',
        dur: 200,
        desc: 'Database write',
      },
      {
        name: 'other',
        dur: 110,
        desc: 'Database read',
      },
      {
        name: 'cpu',
        dur: 1230,
        desc: 'Total CPU',
      },
    ];
    assert.deepEqual(actual, expected);
  });

  it('createFromHeaderValue shows warnings', () => {
    // TODO: These tests require mocking `Common.console.warn`.
    // For now, we override `ServerTiming.showWarning` to throw an
    // exception instead of logging it.
    ServerTiming.showWarning = (message) => {
      throw new Error(message);
    };

    assert.throws(() => {
      ServerTiming.createFromHeaderValue('lb=42; "Load balancer"');
    }, /Deprecated syntax found/, 'legacy header syntax should trigger a warning');
    assert.throws(() => {
      ServerTiming.createFromHeaderValue('sql;desc="MySQL";dur=100;dur=200');
    }, /Duplicate parameter/, 'duplicate parameters should trigger a warning');
    assert.throws(() => {
      ServerTiming.createFromHeaderValue('sql;desc;dur=100');
    }, /No value found for parameter/, 'parameters without a value should trigger a warning');
    assert.throws(() => {
      ServerTiming.createFromHeaderValue('sql;desc="MySQL";dur=abc');
    }, /Unable to parse/, 'duration values that cannot be converted to floats should trigger a warning');
    assert.throws(() => {
      ServerTiming.createFromHeaderValue('sql;desc="MySQL";dur=100;invalid=lol');
    }, /Unrecognized parameter/, 'invalid parameters should trigger a warning');
  });
});
