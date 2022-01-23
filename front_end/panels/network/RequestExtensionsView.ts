// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as DiffView from '../../ui/components/diff_view/diff_view.js';
import * as Diff from '../../third_party/diff/diff.js';
import * as DiffWrapper from '../../third_party/diff/DiffWrapper.js';

import extensionsViewStyles from './requestExtensionsView.css.js';

export class RequestExtensionsView extends UI.Widget.Widget {
  private readonly request: SDK.NetworkRequest.NetworkRequest;
  private requestDiffView?: DiffView.DiffView.DiffView;
  private responseDiffView?: DiffView.DiffView.DiffView;
  private readonly diffContainer: HTMLElement;

  constructor(request: SDK.NetworkRequest.NetworkRequest) {
    super();
    this.request = request;
    this.diffContainer = this.element.createChild('div', 'diff-container');
    this.updateDiffView();
  }

  updateDiffView(): void {
    if (this.request.extensionRequestReplacedHeaders()) {
      if (!this.requestDiffView) {
        this.requestDiffView = this.diffContainer.appendChild(new DiffView.DiffView.DiffView());
      }
      const originalHeaders = (this.request.extensionRequestOriginalHeaders() as SDK.NetworkRequest.NameValue[]);
      const replacedHeaders = (this.request.extensionRequestReplacedHeaders() as SDK.NetworkRequest.NameValue[]);
      this.requestDiffView.data = {
        diff: DiffWrapper.DiffWrapper.lineDiff(
            originalHeaders.map(RequestExtensionsView.stringifyHeader),
            replacedHeaders.map(RequestExtensionsView.stringifyHeader)),
        mimeType: 'text/plain',
      };
    }

    if (this.request.extensionRequestReplacedHeaders()) {
      if (!this.responseDiffView) {
        this.responseDiffView = this.element.appendChild(new DiffView.DiffView.DiffView());
      }
      const originalHeaders = (this.request.extensionRequestOriginalHeaders() as SDK.NetworkRequest.NameValue[]);
      const replacedHeaders = (this.request.extensionRequestReplacedHeaders() as SDK.NetworkRequest.NameValue[]);
      this.responseDiffView.data = {
        diff: DiffWrapper.DiffWrapper.lineDiff(
            originalHeaders.map(RequestExtensionsView.stringifyHeader),
            replacedHeaders.map(RequestExtensionsView.stringifyHeader)),
        mimeType: 'text/plain',
      };
    }
  }

  static stringifyHeader(header: SDK.NetworkRequest.NameValue): string {
    return header.name + ': ' + header.value;
  }

  static createDiffArray(
      originalHeaders: SDK.NetworkRequest.NameValue[],
      replacedHeaders: SDK.NetworkRequest.NameValue[]): Diff.Diff.DiffArray {
    function sortfn(a: SDK.NetworkRequest.NameValue, b: SDK.NetworkRequest.NameValue): number {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    }
    originalHeaders.sort(sortfn);
    replacedHeaders.sort(sortfn);

    const output: Diff.Diff.DiffArray = [];
    // TODO should the input arrays be sorted?

    function stringifyHeader(header: SDK.NetworkRequest.NameValue): string {
      return header.name + ': ' + header.value;
    }

    let originalIndex = 0;
    let replacedIndex = 0;
    while (originalIndex < originalHeaders.length && replacedIndex < replacedHeaders.length) {
      // handle end of array cases
      if (replacedIndex >= replacedHeaders.length) {
        const originalHeader = originalHeaders[originalIndex++];
        output.push({
          0: Diff.Diff.Operation.Insert,
          1: [stringifyHeader(originalHeader)],
        });
        continue;
      }
      if (originalIndex >= originalHeaders.length) {
        const replacedHeader = replacedHeaders[replacedIndex++];
        output.push({
          0: Diff.Diff.Operation.Insert,
          1: [stringifyHeader(replacedHeader)],
        });
        continue;
      }

      const originalHeader = originalHeaders[originalIndex];
      const replacedHeader = replacedHeaders[replacedIndex];

      if (originalHeader.name < replacedHeader.name) {
        output.push({
          0: Diff.Diff.Operation.Delete,
          1: [stringifyHeader(originalHeader)],
        });
        originalIndex++;
        continue;
      }

      if (originalHeader.name > replacedHeader.name) {
        output.push({
          0: Diff.Diff.Operation.Insert,
          1: [stringifyHeader(replacedHeader)],
        });
        replacedIndex++;
        continue;
      }

      output.push({
        0: Diff.Diff.Operation.Edit,
        1: [stringifyHeader(originalHeader), stringifyHeader(replacedHeader)],
      });
      originalIndex++;
      replacedIndex++;
    }

    return output;
  }

  wasShown(): void {
    super.wasShown();
    this.updateDiffView();
    this.registerCSSFiles([extensionsViewStyles]);
  }

  // TODO make this refresh like RequestCookiesView. Maybe I could call it from maybeAppendExtensionsView?
}
