// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../../../../core/platform/platform.js';
import * as ComponentHelpers from '../../../components/helpers/helpers.js';
import * as LitHtml from '../../../lit-html/lit-html.js';

// Match the style of the css var swatch
import cssVarSwatchStyles from './cssVarSwatch.css.js';

const {render, html, Directives} = LitHtml;

interface SwatchRenderData {
  animationName: string;
  isDefined: boolean;
  onLinkActivate: (animationName: string) => void;
}

export class AnimationNameSwatch extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-animation-name-swatch`;
  private readonly shadow = this.attachShadow({mode: 'open'});
  private animationName?: string;
  private onLinkActivate: (animationName: string, event: MouseEvent|KeyboardEvent) => void = () => undefined;
  private isDefined?: boolean;

  constructor() {
    super();

    this.tabIndex = -1;

    this.addEventListener('focus', () => {
      const link = this.shadow.querySelector<HTMLElement>('[role="link"]');

      if (link) {
        link.focus();
      }
    });
  }

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [cssVarSwatchStyles];
  }

  set data(data: SwatchRenderData) {
    this.animationName = data.animationName;
    this.isDefined = data.isDefined;
    this.onLinkActivate = (animationName: string, event: MouseEvent|KeyboardEvent): void => {
      if (event instanceof MouseEvent && event.button !== 0) {
        return;
      }

      if (event instanceof KeyboardEvent && !Platform.KeyboardUtilities.isEnterOrSpaceKey(event)) {
        return;
      }

      data.onLinkActivate(animationName);
      event.consume(true);
    };
    this.render();
  }

  private render(): void {
    const classes = Directives.classMap({
      'css-var-link': true,
      'undefined': !this.isDefined,
    });

    const title = this.animationName;
    const onActivate = this.isDefined ? this.onLinkActivate.bind(this, (this.animationName as string).trim()) : null;

    const animationNameLink = html`<span class=${classes} title=${title} @mousedown=${onActivate} @keydown=${
        onActivate} role="link" tabindex="-1">${this.animationName || ''}</span>`;

    render(html`<span title=${this.animationName}>${animationNameLink}</span>`, this.shadow, {host: this});
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-animation-name-swatch', AnimationNameSwatch);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-animation-name-swatch': AnimationNameSwatch;
  }
}
