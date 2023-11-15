// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import type * as Platform from '../../core/platform/platform.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';

import {ImagePreviewPopover} from './ImagePreviewPopover.js';

export class UrlRenderer {
  static renderUrl(cssRule: SDK.CSSRule.CSSRule|null, node: SDK.DOMModel.DOMNode|null, text: string): Node {
    // Strip "url(" and ")" along with whitespace.
    let url = text.substring(4, text.length - 1).trim() as Platform.DevToolsPath.UrlString;
    const isQuoted = /^'.*'$/s.test(url) || /^".*"$/s.test(url);
    if (isQuoted) {
      url = Common.ParsedURL.ParsedURL.substring(url, 1, url.length - 1);
    }
    const container = document.createDocumentFragment();
    UI.UIUtils.createTextChild(container, 'url(');
    let hrefUrl: Platform.DevToolsPath.UrlString|null = null;
    if (cssRule && cssRule.resourceURL()) {
      hrefUrl = Common.ParsedURL.ParsedURL.completeURL(cssRule.resourceURL(), url);
    } else if (node) {
      hrefUrl = node.resolveURL(url);
    }
    const link = ImagePreviewPopover.setImageUrl(
        Components.Linkifier.Linkifier.linkifyURL(hrefUrl || url, {
          text: url,
          preventClick: false,
          // crbug.com/1027168
          // We rely on CSS text-overflow: ellipsis to hide long URLs in the Style panel,
          // so that we don't have to keep two versions (original vs. trimmed) of URL
          // at the same time, which complicates both StylesSidebarPane and StylePropertyTreeElement.
          bypassURLTrimming: true,
          showColumnNumber: false,
          inlineFrameIndex: 0,
        }),
        hrefUrl || url);
    container.appendChild(link);
    UI.UIUtils.createTextChild(container, ')');
    return container;
  }
}
