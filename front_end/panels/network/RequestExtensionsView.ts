// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as DiffView from '../../ui/components/diff_view/diff_view.js';
import * as DiffWrapper from '../../third_party/diff/DiffWrapper.js';
import extensionsViewStyles from './requestExtensionsView.css.js';

export class RequestExtensionsView extends UI.Widget.Widget {
  private readonly request: SDK.NetworkRequest.NetworkRequest;
  private requestDiffView?: DiffView.DiffView.DiffView;
  private responseDiffView?: DiffView.DiffView.DiffView;
  private readonly requestContainer: HTMLElement;
  private readonly responseContainer: HTMLElement;

  constructor(request: SDK.NetworkRequest.NetworkRequest) {
    super();
    this.request = request;

    const title = this.element.createChild('h3');
    title.textContent = 'Modifications made by Chrome Extensions';

    const requestTitle = this.element.createChild('h4');
    requestTitle.textContent = 'Request Headers';
    this.requestContainer = this.element.createChild('div', 'diff-container');

    const responseTitle = this.element.createChild('h4');
    responseTitle.textContent = 'Response Headers';
    this.responseContainer = this.element.createChild('div', 'diff-container');

    this.updateDiffView();
  }

  updateDiffView(): void {
    if (this.request.extensionRequestReplacedHeaders()) {
      if (!this.requestDiffView) {
        this.requestContainer.removeChildren();
        this.requestDiffView = this.requestContainer.appendChild(new DiffView.DiffView.DiffView());
      }
      const originalHeaders = (this.request.extensionRequestOriginalHeaders() as SDK.NetworkRequest.NameValue[]);
      const replacedHeaders = (this.request.extensionRequestReplacedHeaders() as SDK.NetworkRequest.NameValue[]);
      this.requestDiffView.data = {
        diff: DiffWrapper.DiffWrapper.lineDiff(
            originalHeaders.map(RequestExtensionsView.stringifyHeader),
            replacedHeaders.map(RequestExtensionsView.stringifyHeader)),
        mimeType: 'text/plain',
      };
    } else {
      this.requestContainer.removeChildren();
      this.requestDiffView = undefined;
      const emptyDescription = this.requestContainer.createChild('p');
      emptyDescription.textContent = 'The request headers were not modified by any extensions.';
    }

    if (this.request.extensionResponseReplacedHeaders()) {
      if (!this.responseDiffView) {
        this.responseContainer.removeChildren();
        this.responseDiffView = this.responseContainer.appendChild(new DiffView.DiffView.DiffView());
      }
      const originalHeaders = (this.request.extensionResponseOriginalHeaders() as SDK.NetworkRequest.NameValue[]);
      const replacedHeaders = (this.request.extensionResponseReplacedHeaders() as SDK.NetworkRequest.NameValue[]);
      this.responseDiffView.data = {
        diff: DiffWrapper.DiffWrapper.lineDiff(
            originalHeaders.map(RequestExtensionsView.stringifyHeader),
            replacedHeaders.map(RequestExtensionsView.stringifyHeader)),
        mimeType: 'text/plain',
      };
    } else {
      this.responseContainer.removeChildren();
      this.responseDiffView = undefined;
      const emptyDescription = this.responseContainer.createChild('p');
      emptyDescription.textContent = 'The response headers were not modified by any extensions.';
    }
  }

  static stringifyHeader(header: SDK.NetworkRequest.NameValue): string {
    return header.name + ': ' + header.value;
  }

  wasShown(): void {
    super.wasShown();
    this.updateDiffView();
    this.registerCSSFiles([extensionsViewStyles]);
  }
}
