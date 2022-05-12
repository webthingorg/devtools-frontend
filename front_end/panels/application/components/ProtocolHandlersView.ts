// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../../core/host/host.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Platform from '../../../core/platform/platform.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
// eslint-disable-next-line rulesdir/es_modules_import
import inspectorCommonStyles from '../../../ui/legacy/inspectorCommon.css.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import protocolHandlersViewStyles from './protocolHandlersView.css.js';

const UIStrings = {
  /**
 *@description Status message for when protocol handlers are detected in the manifest
 *@example {protocolhandler/manifest.json} PH1
 */
  protocolDetected:
      'Found valid protocol handler registration in the {PH1}. With the installed PWA, test the registered protocols.',
  /**
 *@description Status message for when protocol handlers are not detected in the manifest
 *@example {protocolhandler/manifest.json} PH1
 */
  protocolNotDetected:
      'Define protocol handlers in the {PH1} to register your app as a handler for custom protocols when your PWA is installed.',
  /**
 *@description Text wrapping a link pointing to more information on handling protocol handlers
 *@example {https://example.com/} PH1
 */
  needHelpReadOur: 'Need help? Read {PH1}.',
  /**
 *@description Link text for more information on URL protocol handler registrations for PWAs
 */
  protocolHandlerRegistrations: 'URL protocol handler registration for PWAs',
  /**
 *@description In text hyperlink to the PWA manifest
 */
  manifest: 'manifest',
};

const str_ = i18n.i18n.registerUIStrings('panels/application/components/ProtocolHandlersView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

interface ProtocolHandlers {
  protocol: string;
  url: string;
}

export interface ProtocolHandlersData {
  protocolHandlers: ProtocolHandlers[];
  manifestLink: Platform.DevToolsPath.UrlString;
}

export class ProtocolHandlersView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-protocol-handlers-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #protocolHandlers: ProtocolHandlers[] = [];
  #manifestLink: Platform.DevToolsPath.UrlString = Platform.DevToolsPath.EmptyUrlString;

  set data(data: ProtocolHandlersData) {
    this.#protocolHandlers = data.protocolHandlers;
    this.#manifestLink = data.manifestLink;
    this.#update();
  }

  // This function takes in the value of the dropdown (protocol) and textbox (query parameter)
  // at the time the test button is clicked and uses those values to launch the PWA as a test
  #invokeProtocolHandlerTest(evt: Event): void {
    evt.preventDefault();
    const formData = new FormData(evt.target as HTMLFormElement);
    const selectedProtocol = formData.get('protocolSelect');
    const userInput = formData.get('userInput');
    const protocolURL = `${selectedProtocol}://${userInput}` as Platform.DevToolsPath.UrlString;
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(protocolURL);
  }

  #update(): void {
    this.#render();
  }

  #renderStatusMessage(): LitHtml.TemplateResult {
    const manifestInTextLink = UI.XLink.XLink.create(this.#manifestLink, i18nString(UIStrings.manifest));
    if (this.#protocolHandlers.length) {
      return LitHtml.html`
      <div class="protocol-handlers-row">
        <div class='status'>
            <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
        iconName: 'ic_checkmark_16x16',
        color: 'green',
        width: '12px',
        height: '12px',
      } as IconButton.Icon.IconData}>
            </${IconButton.Icon.Icon.litTagName}>
            ${i18n.i18n.getFormatLocalizedString(str_, UIStrings.protocolDetected, {
        PH1: manifestInTextLink,
      })}
        </div>
      </div>
      `;
    }
    return LitHtml.html`
      <div class="protocol-handlers-row">
        <div class='status'>
            <${IconButton.Icon.Icon.litTagName} class="info-icon" .data=${{
      iconName: 'ic_info_black_18dp',
      color: 'var(--color-link)',
      width: '14px',
      height: '12px',
    } as IconButton.Icon.IconData}>
            </${IconButton.Icon.Icon.litTagName}>
            ${i18n.i18n.getFormatLocalizedString(str_, UIStrings.protocolNotDetected, {
      PH1: manifestInTextLink,
    })}
        </div>
      </div>
      `;
  }

  #renderTestProtocolForm(): LitHtml.TemplateResult {
    if (this.#protocolHandlers.length) {
      return LitHtml.html`
     <form id="form" class="protocol-handlers-row" @submit=${this.#invokeProtocolHandlerTest}>
        <select name="protocolSelect" class="chrome-select">
           ${this.#protocolHandlers.filter(protocolHandler => protocolHandler.protocol).map(protocolHandler => {
        return LitHtml.html`<option value=${protocolHandler.protocol}>${protocolHandler.protocol}://</option>`;
      })}
        </select>
        <input name="userInput" class="harmony-input" type="text" placeholder=""/>
        <${Buttons.Button.Button.litTagName} .type=${'submit'} .variant=${Buttons.Button.Variant.PRIMARY}>
            Test protocol
        </${Buttons.Button.Button.litTagName}>
           </form>
      `;
    }
    return LitHtml.html``;
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [
      protocolHandlersViewStyles,
      inspectorCommonStyles,
    ];
  }

  #render(): void {
    const protocolDocLink = UI.XLink.XLink.create(
        'https://web.dev/url-protocol-handler/', i18nString(UIStrings.protocolHandlerRegistrations));
    // clang-format off
    LitHtml.render(LitHtml.html`
      ${this.#renderStatusMessage()}
      <div class="protocol-handlers-row protocol-handlers-text">
          ${i18n.i18n.getFormatLocalizedString(str_, UIStrings.needHelpReadOur, {PH1: protocolDocLink})}
      </div>
      ${this.#renderTestProtocolForm()}
    `, this.#shadow, {host: this});
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-protocol-handlers-view', ProtocolHandlersView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-protocol-handlers-view': ProtocolHandlersView;
  }
}
