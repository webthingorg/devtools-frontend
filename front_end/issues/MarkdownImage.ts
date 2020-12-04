// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';

import {getMarkdownImage, IconData} from './markdownImages.js';

const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;

export interface MarkdownImageData {
  key: string;
  title: string;
}

/**
 * Component to render images from parsed markdown.
 * Parsed images from markdown are not directly rendered, instead they have to be added to the <key, ImageData | IconData> map
 * above. This makes sure that all icons/images are accounted for in markdown.
 */
export class MarkdownImage extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private imageData: IconData = {key: '', isIcon: false};

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      ...getStyleSheets('ui/inspectorCommon.css'),
    ];
  }

  set data(data: MarkdownImageData) {
    const {key} = data;
    const markdownImage = getMarkdownImage(key);
    if (markdownImage) {
      this.imageData = markdownImage;
      this.render();
    }
  }

  private getIconComponent() {
    const {key, style = {}} = this.imageData;
    const icon = UI.Icon.Icon.create(key);
    icon.classList.add('custom-image');
    const styleProperties = Object.keys(style).map(key => `${key}: ${style[key]};`);
    const output = LitHtml.html`
      <style>
        .custom-image {
          ${styleProperties.join()}
        }
      </style>
      ${icon}
    `;
    return output;
  }

  private render() {
    const {isIcon} = this.imageData;
    const iconComponent = isIcon ? this.getIconComponent() : LitHtml.html``;
    const output = LitHtml.html`
      ${iconComponent}
    `;
    // clang-format off
    LitHtml.render(output, this.shadow);
    // clang-format on
  }
}

customElements.define('devtools-markdown-image', MarkdownImage);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-markdown-image': MarkdownImage;
  }
}
