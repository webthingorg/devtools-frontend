// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../../front_end/core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import * as TextUtils from '../../../../../front_end/models/text_utils/text_utils.js';
import * as Network from '../../../../../front_end/panels/network/network.js';
import * as SourceFrame from '../../../../../front_end/ui/legacy/components/source_frame/source_frame.js';
import {renderElementIntoDOM} from '../../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

function renderResponseView(request: SDK.NetworkRequest.NetworkRequest):
    Network.RequestResponseView.RequestResponseView {
  const component = new Network.RequestResponseView.RequestResponseView(request);
  const div = document.createElement('div');
  renderElementIntoDOM(div);
  component.markAsRoot();
  component.show(div);
  return component;
}

describeWithEnvironment('RequestResponseView', () => {
  it('does show UTF-16 content that arrives base64 encoded correctly', async () => {
    const request = SDK.NetworkRequest.NetworkRequest.create(
        'requestId' as Protocol.Network.RequestId,
        'http://devtools-frontend.test/index.html' as Platform.DevToolsPath.UrlString,
        '' as Platform.DevToolsPath.UrlString, null, null, null);
    request.setContentDataProvider(
        () => Promise.resolve(new TextUtils.ContentData.ContentData(
            '//48ACEARABPAEMAVABZAFAARQAgAGgAdABtAGwAPgAKADwAcAA+AEkA8QB0AOsAcgBuAOIAdABpAPQAbgDgAGwAaQB6AOYAdABpAPgAbgADJjTYBt88AC8AcAA+AAoA',
            true, 'text/html', 'utf-16')));
    request.mimeType = Platform.MimeType.MimeType.HTML;
    request.setCharset('utf-16');

    const component = renderResponseView(request);
    const widget = await component.showPreview();

    assert.instanceOf(widget, SourceFrame.ResourceSourceFrame.SearchableContainer);
    const sourceFrame = (widget as SourceFrame.ResourceSourceFrame.SearchableContainer).sourceFrameForTest;
    await sourceFrame.ensureContentLoadedForTest;

    const textEditor = widget.contentElement.querySelector('devtools-text-editor');
    assertNotNullOrUndefined(textEditor);

    assert.strictEqual(textEditor.state.doc.toString(), '<!DOCTYPE html>\n<p>Iñtërnâtiônàlizætiøn☃𝌆</p>\n');
  });
});
