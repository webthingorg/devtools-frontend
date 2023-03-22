// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

function showInfobar(view: UI.InspectorView.InspectorView, url: Platform.DevToolsPath.UrlString) {
  const inforbarResultPromise = view.displaySourceMapWarning(url);
  const infobar = view.contentElement.firstElementChild?.firstElementChild?.shadowRoot?.lastElementChild;
  Platform.assertNotNullOrUndefined(infobar);
  assert.strictEqual(infobar.className, 'infobar infobar-error');
  assert.deepInclude(infobar.querySelector('.infobar-info-text')?.textContent, url);

  return {infobar, inforbarResultPromise};
}

describeWithEnvironment('InspectorView', () => {
  it('displays a warning for incompatible sourcemaps', async () => {
    const view = UI.InspectorView.InspectorView.instance();
    const {infobar, inforbarResultPromise} =
        showInfobar(view, 'http://example.com/source.map' as Platform.DevToolsPath.UrlString);

    infobar.querySelector<HTMLDivElement>('.close-button')?.click();
    assert.isFalse(await inforbarResultPromise);
  });

  it('can dismiss incompatible sourcemap warning', async () => {
    const view = UI.InspectorView.InspectorView.instance();
    const {infobar, inforbarResultPromise} =
        showInfobar(view, 'http://example.com/source2.map' as Platform.DevToolsPath.UrlString);

    const dismissButton = infobar.querySelectorAll<HTMLButtonElement>('.text-button')[0];
    assert.deepStrictEqual(dismissButton?.textContent, 'Dismiss');
    dismissButton?.click();
    assert.isFalse(await inforbarResultPromise);
  });

  it('can ignore incompatible sourcemap warning', async () => {
    const view = UI.InspectorView.InspectorView.instance();
    const {infobar, inforbarResultPromise} =
        showInfobar(view, 'http://example.com/source3.map' as Platform.DevToolsPath.UrlString);

    const ignoreButton = infobar.querySelectorAll<HTMLButtonElement>('.text-button')[1];
    assert.deepStrictEqual(ignoreButton?.textContent, 'Attach anyways');
    ignoreButton?.click();
    assert.isTrue(await inforbarResultPromise);
  });
});
