// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../component_helpers/component_helpers.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as Components from '../ui/components/components.js';

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

  private getIconComponent(): LitHtml.TemplateResult {
    const {src, color, width = '100%', height = '100%'} = this.imageData;
    // clang-format off
    const output = LitHtml.html`
      <devtools-icon .data=${{iconPath: src, color, width, height} as Components.Icon.IconData}></devtools-icon>
    `;
    return output;
    // clang-format on
  }

  private getImageComponent(): LitHtml.TemplateResult {
    const {src, width = '100%', height = '100%'} = this.imageData;
    // clang-format off
    const output = LitHtml.html`
      <img src=${src} alt=${this.imageTitle} width=${width} height=${height}/>
    `;
    return output;
    // clang-format on
  }

  private render(): void {
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
