// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {default as ServerTiming} from '/front_end/sdk/ServerTiming.js';

describe('ServerTiming', () => {
  it('can be instantiated correctly', () => {
    const serverTiming = new ServerTiming('example metric', 1, 'example description');
    assert.equal(serverTiming.metric, 'example metric', 'metric was not set correctly');
    assert.equal(serverTiming.value, 1, 'value was not set correctly');
    assert.equal(serverTiming.description, 'example description', 'description was not set correctly');
  });

  it('createFromHeaderValue works correctly for the latest header syntax', () => {
    // A real-world-like example with some edge cases.
    const actual = ServerTiming.createFromHeaderValue('lb; desc = "Load bala\\ncer" ; dur= 42,sql-1 ;desc="MySQL lookup server";dur=100,sql-2;dur ="900.1";desc="MySQL shard server #1",fs;\tdur=600;desc="FileSystem",\tcache;dur=300;desc="",other;dur=200;desc="Database write",other;dur=110;desc="Database read",cpu;dur=1230;desc="Total CPU"');
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
        dur: 900.1,
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

    // Name only.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric'), [{ name: 'metric' }]);
    // Special chars in name.
    assert.deepEqual(ServerTiming.createFromHeaderValue("aB3!#$%&'*+-.^_`|~"), [{ name: "aB3!#$%&'*+-.^_`|~" }]);

    // Name and duration.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur=123.4'), [{ name: 'metric', dur: 123.4 }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur="123.4"'), [{ name: 'metric', dur: 123.4 }]);

    // Name and description.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=description'), [
      { name: 'metric', desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="description"'), [
      { name: 'metric', desc: 'description' }
    ]);

    // Name, duration, and description.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur=123.4;desc=description'), [
      { name: 'metric', dur: 123.4, desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=description;dur=123.4'), [
      { name: 'metric', desc: 'description', dur: 123.4 }
    ]);

    // Spaces.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric ; '), [{ name: 'metric' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric , '), [{ name: 'metric' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric ; dur = 123.4 ; desc = description'), [
      { name: 'metric', dur: 123.4, desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric ; desc = description ; dur = 123.4'), [
      { name: 'metric', desc: 'description', dur: 123.4 }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc = "description"'), [
      { name: 'metric', desc: 'description' }
    ]);

    // Tabs.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric\t;\t'), [{ name: 'metric' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric\t,\t'), [{ name: 'metric' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric\t;\tdur\t=\t123.4\t;\tdesc\t=\tdescription'), [
      { name: 'metric', dur: 123.4, desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric\t;\tdesc\t=\tdescription\t;\tdur\t=\t123.4'), [
      { name: 'metric', desc: 'description', dur: 123.4 }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc\t=\t"description"'), [
      { name: 'metric', desc: 'description' }
    ]);

    // Multiple entries.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric1;dur=12.3;desc=description1,metric2;dur=45.6;desc=description2,metric3;dur=78.9;desc=description3'),
      [
        { name: 'metric1', dur: 12.3, desc: 'description1' },
        { name: 'metric2', dur: 45.6, desc: 'description2' },
        { name: 'metric3', dur: 78.9, desc: 'description3' },
      ]
    );
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric1,metric2 ,metric3, metric4 , metric5'), [
      { name: 'metric1' },
      { name: 'metric2' },
      { name: 'metric3' },
      { name: 'metric4' },
      { name: 'metric5' }
    ]);

    // quoted-strings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="description"'), [
      { name: 'metric', desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\t description \t"'), [
      { name: 'metric', desc: '\t description \t' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="descr\\"iption"'), [
      { name: 'metric', desc: 'descr"iption' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\"'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=""'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\"'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\"\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\""'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\"'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=""\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="""'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\\\"'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\"\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\\\""'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\"\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\"\\"'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\""\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=\\"""'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\\\"'), [{ name: 'metric', desc: '\\' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\"\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="\\""'), [{ name: 'metric', desc: '"' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=""\\\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=""\\"'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="""\\'), [{ name: 'metric', desc: '' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=""""'), [{ name: 'metric', desc: '' }]);

    // Param name case sensitivity.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;DuR=123.4;DeSc=description'), [
      { name: 'metric', dur: 123.4, desc: 'description' }
    ]);

    // Duplicate entry names.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur=12.3;desc=description1,metric;dur=45.6;desc=description2'),
      [
        { name: 'metric', dur: 12.3, desc: 'description1' },
        { name: 'metric', dur: 45.6, desc: 'description2' }
      ]
    );

    // Non-numeric durations.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur=foo'), [{ name: 'metric', dur: 0 }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur="foo"'), [{ name: 'metric', dur: 0 }]);

    // Incomplete params.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur;dur=123.4;desc=description'), [
      { name: 'metric', dur: 0, desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur=;dur=123.4;desc=description'), [
      { name: 'metric', dur: 0, desc: 'description' }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc;desc=description;dur=123.4'), [
      { name: 'metric', desc: '', dur: 123.4 }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=;desc=description;dur=123.4'), [
      { name: 'metric', desc: '', dur: 123.4 }
    ]);

    // Extraneous characters after param value as token.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc=d1 d2;dur=123.4'), [
      { name: 'metric', desc: 'd1', dur: 123.4 }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric1;desc=d1 d2,metric2'), [
      { name: 'metric1', desc: 'd1' },
      { name: 'metric2' }
    ]);

    // Extraneous characters after param value as quoted-string.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;desc="d1" d2;dur=123.4'), [
      { name: 'metric', desc: 'd1', dur: 123.4 }
    ]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric1;desc="d1" d2,metric2'), [
      { name: 'metric1', desc: 'd1' },
      { name: 'metric2' }
    ]);

    // Extraneous characters after entry name token.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric==   ""foo;dur=123.4'), [{ name: 'metric' }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric1==   ""foo,metric2'), [{ name: 'metric1' }]);

    // Extraneous characters after param name token.
    // Note: also see the tests below that checks for warnings.
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;dur foo=12'), [{ name: 'metric', dur: 0 }]);
    assert.deepEqual(ServerTiming.createFromHeaderValue('metric;foo dur=12'), [{ name: 'metric' }]);

    // Bad input: return zero entries.
    assert.deepEqual(ServerTiming.createFromHeaderValue(' '), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue('='), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue(';'), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue(','), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue('=;'), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue(';='), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue('=,'), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue(',='), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue(';,'), []);
    assert.deepEqual(ServerTiming.createFromHeaderValue(',;'), []);

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
