// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = require('chai');
const {codeForFile} = require('../generate_css_js_files.js');

describe('generating CSS JS files', () => {
  afterEach(() => {
    delete process.env.WATCH_PORT;
  });

  it('minifies code when not in debug mode', async () => {
    const css = `div {
      height: 20px;
    }`;
    const contents = await codeForFile(
        {fileName: 'app.css', isDebug: false, input: css, isLegacy: false, buildTimestamp: Date.now()});
    assert.isTrue(contents.includes('div{height:20px}'));
  });

  it('does not include hot reloading code when not in debug mode', async () => {
    const css = `
    @container (width<1024px) {
      .test {
        color: #fff;
      }
    }`;
    const contents = await codeForFile(
        {srcDir: '/tmp', fileName: 'app.css', isDebug: false, input: css, isLegacy: false, buildTimestamp: Date.now()});
    assert.isFalse(contents.includes('const ws = new WebSocket("ws://localhost:8080");'));
  });

  it('supports container queries', async () => {
    const css = `
    @container (width<1024px) {
      .test {
        color: #fff;
      }
    }`;
    const contents = await codeForFile(
        {fileName: 'app.css', isDebug: false, input: css, isLegacy: false, buildTimestamp: Date.now()});
    assert.isTrue(contents.includes('@container (width<1024px){.test{color:#fff}}'));
  });

  it('does not minify when debug mode is on', async () => {
    const css = `
    @container (width<1024px) {
      .test {
        color: #fff;
      }
    }`;
    const contents = await codeForFile(
        {srcDir: '/tmp', fileName: 'app.css', isDebug: true, input: css, isLegacy: false, buildTimestamp: Date.now()});
    assert.isTrue(contents.includes(css));
  });

  it('does not include hot reloading code when debug mode is on and the WATCH_PORT environment variable is not a number',
     async () => {
       process.env.WATCH_PORT = '';
       const css = `
    @container (width<1024px) {
      .test {
        color: #fff;
      }
    }`;
       const contents = await codeForFile({
         srcDir: '/tmp',
         fileName: 'app.css',
         isDebug: true,
         input: css,
         isLegacy: false,
         buildTimestamp: Date.now()
       });
       assert.isFalse(contents.includes('const ws = new WebSocket("ws://localhost:8080");'));
     });

  it('includes hot reloading code when debug mode is on and the WATCH_PORT environment variable is set to a number',
     async () => {
       process.env.WATCH_PORT = '8081';
       const css = `
    @container (width<1024px) {
      .test {
        color: #fff;
      }
    }`;
       const contents = await codeForFile({
         srcDir: '/tmp',
         fileName: 'app.css',
         isDebug: true,
         input: css,
         isLegacy: false,
         buildTimestamp: Date.now()
       });
       assert.isTrue(contents.includes('const ws = new WebSocket("ws://localhost:8081");'));
     });
});
