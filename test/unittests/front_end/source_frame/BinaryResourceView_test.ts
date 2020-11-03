// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {BinaryResourceViewFactory} from '../../../../front_end/source_frame/BinaryResourceViewFactory.js';
import * as Common from '../../../../front_end/common/common.js';

import {resetSettingsStorage} from '../common/SettingsHelper.js';

describe('BinaryResourceViewFactory', () => {
  describe('interprets base64 data correctly', async () => {
    beforeEach(() => {
      const settings = resetSettingsStorage();
      // TODO(petermarshall): Avoid reaching into settings internals just to make module settings work.
      settings._moduleSettings.set(
          'textEditorBracketMatching',
          settings.createSetting('textEditorBracketMatching', true, Common.Settings.SettingStorageType.Global));
      settings._moduleSettings.set(
          'allowScrollPastEof',
          settings.createSetting('allowScrollPastEof', true, Common.Settings.SettingStorageType.Global));
      settings._moduleSettings.set(
          'textEditorIndent',
          settings.createSetting('textEditorIndent', '  ', Common.Settings.SettingStorageType.Global));
      settings._moduleSettings.set(
          'textEditorAutoDetectIndent',
          settings.createSetting('textEditorAutoDetectIndent', true, Common.Settings.SettingStorageType.Global));
      settings._moduleSettings.set(
          'showWhitespacesInEditor',
          settings.createSetting('showWhitespacesInEditor', 'original', Common.Settings.SettingStorageType.Global));
      settings._moduleSettings.set(
          'textEditorCodeFolding',
          settings.createSetting('textEditorCodeFolding', false, Common.Settings.SettingStorageType.Global));
      settings._moduleSettings.set(
          'textEditorAutocompletion',
          settings.createSetting('textEditorAutocompletion', true, Common.Settings.SettingStorageType.Global));
    });
    afterEach(resetSettingsStorage);

    let factory: BinaryResourceViewFactory;
    before(() => {
      const base64content = 'c2VuZGluZyB0aGlzIHV0Zi04IHN0cmluZyBhcyBhIGJpbmFyeSBtZXNzYWdlLi4u';
      factory = new BinaryResourceViewFactory(
          base64content, 'http://example.com', Common.ResourceType.resourceTypes.WebSocket);
    });

    it('with a Base64View', async () => {
      assert.strictEqual(
          (await factory.createBase64View()._lazyContent()).content,
          'c2VuZGluZyB0aGlzIHV0Zi04IHN0cmluZyBhcyBhIGJpbmFyeSBtZXNzYWdlLi4u');
    });

    it('with a HexView', async () => {
      const expectedHex = '00000000: 7365 6e64 696e 6720 7468 6973 2075 7466  sending this utf\n' +
          '00000001: 2d38 2073 7472 696e 6720 6173 2061 2062  -8 string as a b\n' +
          '00000002: 696e 6172 7920 6d65 7373 6167 652e 2e2e  inary message...\n';
      assert.strictEqual((await factory.createHexView()._lazyContent()).content, expectedHex);
    });

    it('with a Utf8View', async () => {
      const expectedUtf8 = 'sending this utf-8 string as a binary message...';
      assert.strictEqual((await factory.createUtf8View()._lazyContent()).content, expectedUtf8);
    });
  });
});
