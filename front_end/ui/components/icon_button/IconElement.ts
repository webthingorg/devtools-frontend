// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

const DEVTOOLS_ICON_STYLES = [
  'display: inline-block',
  'white-space: nowrap',
  'background-color: var(--icon-element-color)',
  '-webkit-mask-position: center',
  '-webkit-mask-repeat: no-repeat',
  /* We are setting this to 99% to work around an issue where non-standard zoom levels would cause the icon to clip. */
  '-webkit-mask-size: 99%',
];

export class IconElement extends LitHtml.LitElement {
  static readonly litTagName = LitHtml.literal`devtools-icon-element`;

  connectedCallback(): void {
    const name = this.getAttribute('name');
    const path = this.pathFromName(name);
    const imageStyle = '-webkit-mask-image:' +
        `url(${path});`;
    this.setAttribute('style', imageStyle + DEVTOOLS_ICON_STYLES.join(';'));
  }

  adoptedCallback(): void {
    this.connectedCallback();
  }

  attributeChangedCallback(attributeName: string): void {
    if (attributeName === 'name') {
      this.connectedCallback();
    }
  }

  pathFromName(name: string|null): string {
    return new URL(`../../../Images/${name}.svg`, import.meta.url).toString();
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-icon-element', IconElement);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-icon-element': IconElement;
  }
}
