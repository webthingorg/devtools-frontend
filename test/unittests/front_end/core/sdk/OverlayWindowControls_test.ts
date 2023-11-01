// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';

describe('OverlayWindowControls', () => {
  it('parses styles and replaces variables for style sheet correctly', () => {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget()?.model(SDK.CSSModel.CSSModel)!;
    const windowControls = new SDK.OverlayModel.WindowControls(target);
    const x = 85;
    const y = 0;
    const width = 185;
    const height = 40;

    let originalStyleSheet = `
    .titlebar {
      position: absolute;
      left: env(titlebar-area-x);
      top: env(titlebar-area-y);
      width: env(titlebar-area-width);
      height: env(titlebar-area-height);
    }
    `;
    let expectedStyleSheet = `
    .titlebar {
      position: absolute;
      left: env(titlebar-area-x, ${x}px);
      top: env(titlebar-area-y, ${y}px);
      width: env(titlebar-area-width, calc(100% - ${width}px));
      height: env(titlebar-area-height, ${height}px);
    }
    `;
    let parsedStyleSheet = windowControls.transformStyleSheetforTesting(x, y, width, height, originalStyleSheet);
    assert.strictEqual(parsedStyleSheet, expectedStyleSheet);

    originalStyleSheet = '';
    parsedStyleSheet = windowControls.transformStyleSheetforTesting(x, y, width, height, originalStyleSheet);
    assert.isUndefined(parsedStyleSheet);

    originalStyleSheet = ': env(titlebar-area-xxx, 9px); width: env(titlebar-area-width);';
    expectedStyleSheet = `: env(titlebar-area-xxx, 9px); width: env(titlebar-area-width, calc(100% - ${width}px));`;
    parsedStyleSheet = windowControls.transformStyleSheetforTesting(x, y, width, height, originalStyleSheet);
    assert.strictEqual(parsedStyleSheet, expectedStyleSheet);
  });
});
