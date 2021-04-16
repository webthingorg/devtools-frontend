// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';
import {Recording} from './Recording.js';

declare global {
  interface HTMLElementTagNameMap {
    'devtools-recoring-view': RecordingView;
  }
}

export interface RecordingViewData {
  isRecording: boolean;
  recording: Recording;
}

export class RecordingView extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private recording: Recording|null = null;
  private isRecording: boolean = false;

  set data(data: RecordingViewData) {
    this.recording = data.recording;
    this.isRecording = data.isRecording;
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  scrollToBottom(): void {
    const wrapper = this.shadowRoot?.querySelector('.wrapper');
    if (!wrapper) {
      return;
    }
    wrapper.scrollTop = wrapper.scrollHeight;
  }

  private render(): void {
    if (!this.recording) {
      return;
    }

    const {title, description, sections} = this.recording;
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        .wrapper {
          height: 100%;
          overflow: scroll;
        }

        .recording {
          max-width: 600px;
          margin: 64px auto 32px;
        }

        .title {
          font-size: 30px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--color-text-primary);
        }

        .description {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--color-text-secondary);
        }

        .section {
          border: 1px solid black;
          padding: 32px;
          margin-top: 32px;
          border-radius: 5px;
          position: relative;
        }

        .section::before {
          content: '';
          position: absolute;
          left: 132px;
          height: 100px;
          border-left: 1px solid black;
          transform: translate(0, -100%);
        }

        .section:first-child::before {
          content: none;
        }

        .header {
          display: flex;
          align-items: center;
        }

        .screenshot {
          margin-right: 32px;
          object-fit: contain;
          border: 1px solid black;
          border-radius: 5px;
          width: 200px;
          height: auto;
        }

        .page-title {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--color-text-primary);
        }

        .steps {
          margin-left: 100px;
          border-left: 1px solid black;
          padding: 16px 0;
          position: relative;
        }

        .step {
          margin: 16px 0;
          position: relative;
          min-height: 32px;
          padding-left: 32px;
          display: flex;
          align-items: center;
        }

        .icon {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: #fff;
          border-radius: 32px;
          border: 1px solid black;
        }

        .icon.loading {
          border-color: transparent;
          background: transparent;
        }

        .icon.loading div {
          position: absolute;
          border: 4px solid #000;
          border-radius: 50%;
          animation: recordingAnimation 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
          background: #fff;
        }

        .icon.loading div:nth-child(2) {
          animation-delay: -1s;
        }

        .step.recording {
          font-style: italic;
          position: absolute;
          margin-top: 0;
        }

        .steps.is-recording {
          margin-bottom: 32px;
        }

        @keyframes recordingAnimation {
          0% {
            top: 12px;
            left: 12px;
            width: 0;
            height: 0;
            border-color: rgb(0 0 0 / 100%);
          }

          100% {
            top: 0;
            left: 0;
            width: 24px;
            height: 24px;
            border-color: rgb(0 0 0 / 0%);
          }
        }

      </style>
      <div class="wrapper">
        <div class="recording">
          <div class="title">${title}</div>
          <div class="description">${description}</div>
          <div class="sections">
            ${sections.map((section, i) => LitHtml.html`
              <div class="section">
                <div class="header">
                  <img class="screenshot" width="200" height="120" src="${section.screenshot}" @load=${(): void => this.scrollToBottom()}/>
                  <div>
                    <div class="page-title">${section.title}</div>
                    <div class="page-url">${section.url}</div>
                  </div>
                </div>
                <div class="steps ${sections.length - 1 === i && this.isRecording ? 'is-recording' : ''}">
                  ${section.steps.map(step => LitHtml.html`
                    <div class="step">
                      <div class="icon"></div>
                      ${step.type}: ${step.selector}
                    </div>
                  `)}
                  ${sections.length - 1 === i && this.isRecording ? LitHtml.html`
                    <div class="step recording">
                      <div class="icon loading"><div></div><div></div></div>
                      Recording
                    </div>
                  ` : null}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `, this.shadow);
    // clang-format off
  }
}

customElements.define('devtools-recording-view', RecordingView);
