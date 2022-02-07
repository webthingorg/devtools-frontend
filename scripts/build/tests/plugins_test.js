// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = require('chai');
const path = require('path');

const {devtoolsPlugin, esbuildPlugin} = require('../devtools_plugin.js');

describe('devtools_plugin can compute paths with', () => {
  it('same directory import', () => {
    assert.deepEqual(
        devtoolsPlugin('./AnotherFile.js', 'front_end/core/sdk/FirstFile.js'),
        {id: path.join('front_end', 'core', 'sdk', 'AnotherFile.js'), external: false});
  });

  it('different directory import', () => {
    assert.deepEqual(
        devtoolsPlugin('../common/common.js', 'front_end/core/sdk/FirstFile.js'),
        {id: path.join('front_end', 'core', 'common', 'common.js'), external: true});
  });

  it('node built-in modules', () => {
    assert.deepEqual(devtoolsPlugin('fs', 'scripts/some-script.js'), {id: 'fs', external: true});
  });

  it('importing generated files', () => {
    assert.strictEqual(devtoolsPlugin('../../generated/Protocol.js', 'front_end/core/sdk/FirstFile.js'), null);
  });
});

describe('esbuild_plugin can compute paths with', () => {
  const srcdir = __filename;
  const outdir = path.join(__filename, 'out');
  const plugin = esbuildPlugin(outdir);
  it('same directory import', () => {
    assert.deepEqual(
        plugin({path: './AnotherFile.js', importer: path.join(srcdir, 'front_end/core/sdk/FirstFile.js')}),
        {path: path.join(srcdir, 'front_end', 'core', 'sdk', 'AnotherFile.js')});
  });

  it('different directory import', () => {
    assert.deepEqual(
        plugin({path: '../common/common.js', importer: path.join(srcdir, 'front_end/core/sdk/FirstFile.js')}),
        {path: './' + path.join('..', 'front_end', 'core', 'common', 'common.js'), external: true});
  });

  it('node built-in modules', () => {
    assert.deepEqual(
        plugin({path: 'fs', importer: path.join(srcdir, 'scripts/some-script.js')}), {path: 'fs', external: true});
  });

  it('importing generated files', () => {
    assert.strictEqual(
        plugin({path: '../../generated/Protocol.js', importer: path.join(srcdir, 'front_end/core/sdk/FirstFile.js')}),
        null);
  });
});
