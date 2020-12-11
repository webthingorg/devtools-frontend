// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';

import {getMarkdownImage, ImageData} from './MarkdownImagesMap.js';

const getStyleSheets = ComponentHelpers.GetStylesheet.getStyleSheets;

export interface MarkdownImageData {
  key: string;
  title: string;
}

/**
 * Component to render images from parsed markdown.
 * Parsed images from markdown are not directly rendered, instead they have to be added to the MarkdownImagesMap.ts.
 * This makes sure that all icons/images are accounted for in markdown.
 */
export class MarkdownImage extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private imageData: ImageData = {src: '', isIcon: false};
  private imageTitle: string = '';

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      ...getStyleSheets('ui/inspectorCommon.css'),
    ];
  }

  set data(data: MarkdownImageData) {
    const {key, title} = data;
    const markdownImage = getMarkdownImage(key);
    this.imageData = markdownImage;
    this.imageTitle = title;
    this.render();
  }

  private getIconComponent() {
    const {src, style = {}} = this.imageData;
    const icon = UI.Icon.Icon.create(src);
    icon.classList.add('custom-image');
    const styleProperties = Object.keys(style).map(key => `${key}: ${style[key]};`);
    // clang-format off
    const output = LitHtml.html`
      <style>
        .custom-image {
          ${styleProperties.join()}
        }
      </style>
      ${icon}
    `;
    return output;
    // clang-format on
  }

  private getImageComponent() {
    const {src, style = {}} = this.imageData;
    const styleProperties = Object.keys(style).map(key => `${key}: ${style[key]};`);
    // clang-format off
    const output = LitHtml.html`
      <style>
        .custom-image {
          ${styleProperties.join()}
        }
      </style>
      <img class="custom-image" src=${src} alt=${this.imageTitle} />
    `;
    return output;
    // clang-format on
  }

  private render() {
    const {isIcon} = this.imageData;
    // clang-format off
    const imageComponent = isIcon ? this.getIconComponent() : this.getImageComponent();
    const output = LitHtml.html`
      ${imageComponent}
    `;
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
