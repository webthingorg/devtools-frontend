// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as Components from '../ui/components/components.js';

const ls = Common.ls;

export type CanShowSurveyCallback = (result: Host.InspectorFrontendHostAPI.CanShowSurveyResult) => void;
export type ShowSurveyCallback = (result: Host.InspectorFrontendHostAPI.ShowSurveyResult) => void;

export interface IssueSurveyLinkData {
  trigger: string;
  canShowSurvey: (trigger: string, callback: CanShowSurveyCallback) => void;
  showSurvey: (trigger: string, callback: ShowSurveyCallback) => void;
}

const enum State {
  Checking = 'Checking',  // (begin state) -> ShowLink | DontShowLink
  ShowLink = 'ShowLink',  // -> Sending
  Sending = 'Sending',    // -> SurveyShown | Failed
  SurveyShown = 'SurveyShown',
  Failed = 'Failed',
  DontShowLink = 'DontShowLink'
}

// A link to a survey. The link is rendered aysnchronously because we need to first check if
// canShowSurvey succeeds.
export class IssueSurveyLink extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private trigger = '';
  private canShowSurvey: (trigger: string, callback: CanShowSurveyCallback) => void = () => {};
  private showSurvey: (trigger: string, callback: ShowSurveyCallback) => void = () => {};
  private state: State = State.Checking;

  // Re-setting data will cause the state to go back to 'Checking' which hides the link.
  set data(data: IssueSurveyLinkData) {
    this.trigger = data.trigger;
    this.canShowSurvey = data.canShowSurvey;
    this.showSurvey = data.showSurvey;

    this.checkSurvey();
  }

  private checkSurvey(): void {
    this.state = State.Checking;
    this.canShowSurvey(this.trigger, ({canShowSurvey}) => {
      if (!canShowSurvey) {
        this.state = State.DontShowLink;
      } else {
        this.state = State.ShowLink;
      }
      this.render();
    });
  }

  private sendSurvey(): void {
    this.state = State.Sending;
    this.render();
    this.showSurvey(this.trigger, ({surveyShown}) => {
      if (!surveyShown) {
        this.state = State.Failed;
      } else {
        this.state = State.SurveyShown;
      }
      this.render();
    });
  }

  private render(): void {
    if (this.state === State.Checking || this.state === State.DontShowLink) {
      return;
    }

    let linkText = ls`Is this issue message helpful to you?`;
    if (this.state === State.Sending) {
      linkText = ls`Opening survey …`;
    } else if (this.state === State.SurveyShown) {
      linkText = ls`Thank you for your feedback`;
    } else if (this.state === State.Failed) {
      linkText = ls`An error occurred with the survey`;
    }

    let linkState = '';
    if (this.state === State.Sending) {
      linkState = 'pending-link';
    } else if (this.state === State.Failed || this.state === State.SurveyShown) {
      linkState = 'disabled-link';
    }

    const ariaDisabled = this.state !== State.ShowLink;

    // clang-format off
    const output = LitHtml.html`
      <style>
        .link-icon {
          vertical-align: sub;
          margin-right: 0.5ch;
        }
        .link {
          padding: 4px 0 0 0;
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
          color: var(--issue-link);
          border: none;
          background: none;
        }
        .link:focus:not(:focus-visible) {
          outline: none;
        }
        .pending-link {
          opacity: 75%;
          pointer-events: none;
          cursor: default;
          text-decoration: none;
        }
        .disabled-link {
          pointer-events: none;
          cursor: default;
          text-decoration: none;
        }
      </style>
      <button class="link ${linkState}" tabindex=${ariaDisabled ? '-1' : '0'} aria-disabled=${ariaDisabled} @click=${this.sendSurvey}>
        <devtools-icon class="link-icon" .data=${{iconName: 'feedback_thin_16x16_icon', color: 'var(--issue-link)', width: '16px', height: '16px'} as Components.Icon.IconData}></devtools-icon><!--
      -->${linkText}
      </button>
    `;
    // clang-format on
    LitHtml.render(output, this.shadow, {eventContext: this});
  }
}

customElements.define('devtools-issue-survey-link', IssueSurveyLink);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-issue-survey-link': IssueSurveyLink;
  }
}
