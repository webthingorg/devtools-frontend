// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as UILegacy from '../../../ui/legacy/legacy.js';
import * as ComponentHelpers from '../../components/helpers/helpers.js';
import * as LitHtml from '../../lit-html/lit-html.js';
import * as IconButton from '../icon_button/icon_button.js';

import panelFeedbackStyles from './panelFeedback.css.js';

const UIStrings = {
  /**
  *@description Sentence to convey the feature is being actively worked on and we are looking for feedback
  *@example {https://goo.gle/css-overview-feedback} PH1
  */
  previewText: 'Our team are actively working on this feature and we are looking for your {PH1}!',
  /**
  *@description Link text of the inline anchor to navigate to a feedback page
  */
  previewTextFeedbackLink: 'feedback',
  /**
  *@description Title of the section to the quick start video and documentation on experimental panels.
  */
  previewFeature: 'Preview feature',
  /**
  *@description Title of the section to the quick start video and documentation on experimental panels.
  */
  videoAndDocumentation: 'Video and documentation',
};

const str_ = i18n.i18n.registerUIStrings('ui/components/panel_feedback/PanelFeedback.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const previewFeatureUrl = new URL('../../../Images/ic_preview_feature.svg', import.meta.url).toString();
const videoThumbnailUrl = new URL('../../../Images/preview_feature_video_thumbnail.svg', import.meta.url).toString();

export interface PanelFeedbackData {
  feedbackUrl: string;
}
export class PanelFeedback extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-panel-feedback`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.render.bind(this);
  /**
   * We have to circumvent Lit here because of how
   * i18n.getFormatLocalizedString works - you have to pass in a formed HTML
   * element. To ensure we only create that once, we create it in the constructor
   * and then only ever update its href when the caller passes in the URL that we
   * want to link to.
  */
  #inlineFeedbackLink: HTMLElement =
      UILegacy.XLink.XLink.create('', i18nString(UIStrings.previewTextFeedbackLink), 'inline-feedback-link');

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [panelFeedbackStyles];
  }

  set data(data: PanelFeedbackData) {
    this.#inlineFeedbackLink.setAttribute('href', data.feedbackUrl);
    ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  private render(): void {
    if (!ComponentHelpers.ScheduledRender.isScheduledRender(this)) {
      throw new Error('PanelFeedback render was not scheduled');
    }

    // clang-format off
    LitHtml.render(LitHtml.html`
      <div class="preview">
        <h2 class="flex">
          <${IconButton.Icon.Icon.litTagName} .data=${{
            iconPath: previewFeatureUrl,
            width: '24px',
            height: '24px',
            color: 'var(--color-primary)',
          } as IconButton.Icon.IconData}></${IconButton.Icon.Icon.litTagName}> ${i18nString(UIStrings.previewFeature)}
        </h2>
        <p>
          ${i18n.i18n.getFormatLocalizedString(str_, UIStrings.previewText, {PH1: this.#inlineFeedbackLink})}
        </p>
        <div class="video">
          <div class="thumbnail">
            <img src=${videoThumbnailUrl} />
          </div>
          <div class="video-description">
            <h3>${i18nString(UIStrings.videoAndDocumentation)}</h3>
            <slot name="quick-start-link"></slot>
          </div>
        </div>
      </div>
      `, this.#shadow, {host: this});
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-panel-feedback', PanelFeedback);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-panel-feedback': PanelFeedback;
  }
}
