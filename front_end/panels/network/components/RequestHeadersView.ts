// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Host from '../../../core/host/host.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Platform from '../../../core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as Protocol from '../../../generated/protocol.js';
import * as IssuesManager from '../../../models/issues_manager/issues_manager.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import requestHeadersViewStyles from './RequestHeadersView.css.js';

const RAW_HEADER_CUTOFF = 3000;
const {render, html} = LitHtml;

const UIStrings = {
  /**
  *@description Text in Headers View of the Network panel
  */
  chooseThisOptionIfTheResourceAnd:
      'Choose this option if the resource and the document are served from the same site.',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  fromDiskCache: '(from disk cache)',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  fromMemoryCache: '(from memory cache)',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  fromPrefetchCache: '(from prefetch cache)',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  fromServiceWorker: '(from `service worker`)',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  fromSignedexchange: '(from signed-exchange)',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  fromWebBundle: '(from Web Bundle)',
  /**
  *@description Section header for a list of the main aspects of a http request
  */
  general: 'General',
  /**
  *@description Text that is usually a hyperlink to more documentation
  */
  learnMore: 'Learn more',
  /**
  *@description Text for a link to the issues panel
  */
  learnMoreInTheIssuesTab: 'Learn more in the issues tab',
  /**
  *@description Label for a checkbox to switch between raw and parsed headers
  */
  raw: 'Raw',
  /**
  *@description Text in Headers View of the Network panel
  */
  onlyChooseThisOptionIfAn:
      'Only choose this option if an arbitrary website including this resource does not impose a security risk.',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  referrerPolicy: 'Referrer Policy',
  /**
  *@description Text in Network Log View Columns of the Network panel
  */
  remoteAddress: 'Remote Address',
  /**
  *@description Text in Request Headers View of the Network panel
  */
  requestHeaders: 'Request Headers',
  /**
  *@description The HTTP method of a request
  */
  requestMethod: 'Request Method',
  /**
  *@description The URL of a request
  */
  requestUrl: 'Request URL',
  /**
  *@description A context menu item in the Network Log View Columns of the Network panel
  */
  responseHeaders: 'Response Headers',
  /**
  *@description Text to show more content
  */
  showMore: 'Show more',
  /**
  *@description HTTP response code
  */
  statusCode: 'Status Code',
  /**
  *@description Text in Headers View of the Network panel
  */
  thisDocumentWasBlockedFrom:
      'This document was blocked from loading in an `iframe` with a `sandbox` attribute because this document specified a cross-origin opener policy.',
  /**
  *@description Text in Headers View of the Network panel
  */
  toEmbedThisFrameInYourDocument:
      'To embed this frame in your document, the response needs to enable the cross-origin embedder policy by specifying the following response header:',
  /**
  *@description Text in Headers View of the Network panel
  */
  toUseThisResourceFromADifferent:
      'To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:',
  /**
  *@description Text in Headers View of the Network panel
  */
  toUseThisResourceFromADifferentOrigin:
      'To use this resource from a different origin, the server may relax the cross-origin resource policy response header:',
  /**
  *@description Text in Headers View of the Network panel
  */
  toUseThisResourceFromADifferentSite:
      'To use this resource from a different site, the server may relax the cross-origin resource policy response header:',
};
const str_ = i18n.i18n.registerUIStrings('panels/network/components/RequestHeadersView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

export class RequestHeadersView extends UI.Widget.VBox {
  readonly #headersView = new RequestHeadersComponent();
  readonly #request: SDK.NetworkRequest.NetworkRequest;

  constructor(request: SDK.NetworkRequest.NetworkRequest) {
    super();
    this.#request = request;
    this.contentElement.appendChild(this.#headersView);
  }

  wasShown(): void {
    this.#request.addEventListener(SDK.NetworkRequest.Events.RemoteAddressChanged, this.#refreshHeadersView, this);
    this.#request.addEventListener(SDK.NetworkRequest.Events.FinishedLoading, this.#refreshHeadersView, this);
    this.#refreshHeadersView();
  }

  willHide(): void {
    this.#request.removeEventListener(SDK.NetworkRequest.Events.RemoteAddressChanged, this.#refreshHeadersView, this);
    this.#request.removeEventListener(SDK.NetworkRequest.Events.FinishedLoading, this.#refreshHeadersView, this);
  }

  #refreshHeadersView(): void {
    this.#headersView.data = {
      request: this.#request,
    };
  }
}

export interface RequestHeadersComponentData {
  request: SDK.NetworkRequest.NetworkRequest;
}

export class RequestHeadersComponent extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-request-headers`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #request?: Readonly<SDK.NetworkRequest.NetworkRequest>;
  #showResponseHeadersText = false;
  #showRequestHeadersText = false;
  #showResponseHeadersTextFull = false;
  #showRequestHeadersTextFull = false;

  set data(data: RequestHeadersComponentData) {
    this.#request = data.request;
    this.#render();
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [requestHeadersViewStyles];
  }

  #render(): void {
    assertNotNullOrUndefined(this.#request);

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      ${this.#renderGeneralSection()}
      ${this.#renderResponseHeaders()}
      ${this.#renderRequestHeaders()}
    `, this.#shadow, {host: this});
    // clang-format on
  }

  #renderResponseHeaders(): LitHtml.TemplateResult {
    assertNotNullOrUndefined(this.#request);

    const headersWithIssues = [];
    if (this.#request.wasBlocked()) {
      const headerWithIssues =
          BlockedReasonDetails.get((this.#request.blockedReason() as Protocol.Network.BlockedReason));
      if (headerWithIssues) {
        headersWithIssues.push(headerWithIssues);
      }
    }

    function mergeHeadersWithIssues(
        headers: SDK.NetworkRequest.NameValue[],
        headersWithIssues: BlockedReasonDetailDescriptor[]): BlockedReasonDetailDescriptor[] {
      let i = 0, j = 0;
      const result: BlockedReasonDetailDescriptor[] = [];
      while (i < headers.length || j < headersWithIssues.length) {
        if (i < headers.length && (j >= headersWithIssues.length || headers[i].name < headersWithIssues[j].name)) {
          result.push({...headers[i++], headerNotSet: false});
        } else if (
            j < headersWithIssues.length && (i >= headers.length || headers[i].name > headersWithIssues[j].name)) {
          result.push({...headersWithIssues[j++], headerNotSet: true});
        } else if (
            i < headers.length && j < headersWithIssues.length && headers[i].name === headersWithIssues[j].name) {
          result.push({...headersWithIssues[j++], ...headers[i++], headerNotSet: false});
        }
      }
      return result;
    }

    const mergedHeaders = mergeHeadersWithIssues(this.#request.sortedResponseHeaders.slice(), headersWithIssues);

    const toggleShowRaw = (): void => {
      this.#showResponseHeadersText = !this.#showResponseHeadersText;
      this.#render();
    };

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return html`
      <${Category.litTagName}
        @togglerawevent=${toggleShowRaw}
        .data=${{
          name: 'responseHeaders',
          title: i18nString(UIStrings.responseHeaders),
          headerCount: this.#request.sortedResponseHeaders.length,
          checked: this.#request.responseHeadersText ? this.#showResponseHeadersText : undefined,
        } as CategoryData}
        aria-label=${i18nString(UIStrings.responseHeaders)}
      >
        ${this.#showResponseHeadersText ?
            this.#renderRawHeaders(this.#request.responseHeadersText, true) : html`
          ${mergedHeaders.map(header => this.#renderHeader(header))}
        `}
      </${Category.litTagName}>
    `;
  }

  #renderRequestHeaders(): LitHtml.TemplateResult {
    assertNotNullOrUndefined(this.#request);

    const headers = this.#request.requestHeaders().slice();
    headers.sort(function(a, b) {
      return Platform.StringUtilities.compare(a.name.toLowerCase(), b.name.toLowerCase());
    });
    const requestHeadersText = this.#request.requestHeadersText();

    const toggleShowRaw = (): void => {
      this.#showRequestHeadersText = !this.#showRequestHeadersText;
      this.#render();
    };

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return html`
      <${Category.litTagName}
        @togglerawevent=${toggleShowRaw}
        .data=${{
          name: 'requestHeaders',
          title: i18nString(UIStrings.requestHeaders),
          headerCount: this.#request.requestHeaders().length,
          checked: requestHeadersText? this.#showRequestHeadersText : undefined,
        } as CategoryData}
        aria-label=${i18nString(UIStrings.requestHeaders)}
      >
        ${(this.#showRequestHeadersText && requestHeadersText) ?
            this.#renderRawHeaders(requestHeadersText, false) : html`
          ${headers.map(header => this.#renderHeader({...header, headerNotSet: false}))}
        `}
      </${Category.litTagName}>
    `;
  }

  #renderHeader(header: BlockedReasonDetailDescriptor): LitHtml.TemplateResult {
    let link: LitHtml.LitTemplate = LitHtml.nothing;
    if (this.#request && IssuesManager.RelatedIssue.hasIssueOfCategory(this.#request, IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy)) {
      const followLink = (): void => {
        Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.LearnMoreLinkCOEP);
        if (this.#request) {
          void IssuesManager.RelatedIssue.reveal(
              this.#request, IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy);
        }
      };
      link = html`
        <div class="devtools-link" @click=${followLink}>
          <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
            iconName: 'issue-exclamation-icon',
            color: 'var(--issue-color-yellow)',
            width: '16px',
            height: '16px',
            } as IconButton.Icon.IconData}>
          </${IconButton.Icon.Icon.litTagName}>
          ${i18nString(UIStrings.learnMoreInTheIssuesTab)}
        </div>
      `;
    } else if (header.details?.link) {
      link = html`
        <x-link href=${header.details.link.url} class="link">
          <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
            iconName: 'link_icon',
            color: 'var(--color-link)',
            width: '16px',
            height: '16px',
          } as IconButton.Icon.IconData}>
          </${IconButton.Icon.Icon.litTagName}
          >${i18nString(UIStrings.learnMore)}
        </x-link>
      `;
    }

    return html`
      <div class="row">
        <div class="header-name">${header.headerNotSet ? html`<div class="header-badge header-badge-text">not-set</div>` : ''}${header.name}:</div>
        <div class="header-value ${header.headerValueIncorrect ? 'header-warning' : ''}">${header.value?.toString()||''}</div>
      </div>
      ${header.details ? html`
        <div class="header-details">
          <div class="call-to-action">
            <div class="call-to-action-body">
              <div class="explanation">${header.details.explanation()}</div>
              ${header.details.examples.map(example => html`
                <div class="example">
                  <code>${example.codeSnippet}</code>
                  ${example.comment ? html`
                    <span class="comment">${example.comment()}</span>
                  ` : ''}
                </div>
              `)}
              ${link}
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  #renderRawHeaders(rawHeadersText: string, forResponseHeaders: boolean): LitHtml.TemplateResult {
    const trimmed = rawHeadersText.trim();
    const showFull = forResponseHeaders ? this.#showResponseHeadersTextFull : this.#showRequestHeadersTextFull;
    const isShortened = !showFull && trimmed.length > RAW_HEADER_CUTOFF;

    const showMore = ():void => {
      if (forResponseHeaders) {
        this.#showResponseHeadersTextFull = true;
      } else {
        this.#showRequestHeadersTextFull = true;
      }
      this.#render();
    };

    const onContextMenuOpen = (event: Event): void => {
      const showFull = forResponseHeaders ? this.#showResponseHeadersTextFull : this.#showRequestHeadersTextFull;
      if (!showFull) {
        const contextMenu = new UI.ContextMenu.ContextMenu(event);
        const section = contextMenu.newSection();
        section.appendItem(i18nString(UIStrings.showMore), showMore);
        void contextMenu.show();
      }
    };

    const addContextMenuListener = (el: Element):void => {
      if (isShortened) {
        el.addEventListener('contextmenu', onContextMenuOpen);
      }
    };

    return html`
      <div class="row raw-headers-row" on-render=${ComponentHelpers.Directives.nodeRenderedCallback(addContextMenuListener)}>
        <div class="raw-headers">${isShortened ? trimmed.substring(0, RAW_HEADER_CUTOFF) : trimmed}</div>
        ${isShortened ? html`
          <${Buttons.Button.Button.litTagName}
            .size=${Buttons.Button.Size.SMALL}
            .variant=${Buttons.Button.Variant.SECONDARY}
            @click=${showMore}
          >${i18nString(UIStrings.showMore)}</${Buttons.Button.Button.litTagName}>
        ` : LitHtml.nothing}
      </div>
    `;
  }

  #renderGeneralSection(): LitHtml.TemplateResult {
    assertNotNullOrUndefined(this.#request);

    let coloredCircleClassName = 'red-circle';
    if (this.#request.statusCode < 300 || this.#request.statusCode === 304) {
      coloredCircleClassName = 'green-circle';
    } else if (this.#request.statusCode < 400) {
      coloredCircleClassName = 'yellow-circle';
    }

    let statusText = this.#request.statusCode + ' ' + this.#request.statusText;
    let statusTextHasComment = false;
    if (this.#request.cachedInMemory()) {
      statusText += ' ' + i18nString(UIStrings.fromMemoryCache);
      statusTextHasComment = true;
    } else if (this.#request.fetchedViaServiceWorker) {
      statusText += ' ' + i18nString(UIStrings.fromServiceWorker);
      statusTextHasComment = true;
    } else if (this.#request.redirectSourceSignedExchangeInfoHasNoErrors()) {
      statusText += ' ' + i18nString(UIStrings.fromSignedexchange);
      statusTextHasComment = true;
    } else if (this.#request.webBundleInnerRequestInfo()) {
      statusText += ' ' + i18nString(UIStrings.fromWebBundle);
      statusTextHasComment = true;
    } else if (this.#request.fromPrefetchCache()) {
      statusText += ' ' + i18nString(UIStrings.fromPrefetchCache);
      statusTextHasComment = true;
    } else if (this.#request.cached()) {
      statusText += ' ' + i18nString(UIStrings.fromDiskCache);
      statusTextHasComment = true;
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return html`
      <${Category.litTagName}
        .data=${{name: 'general', title: i18nString(UIStrings.general)} as CategoryData}
        aria-label=${i18nString(UIStrings.general)}
      >
        <div class="row">
          <div class="header-name">${i18nString(UIStrings.requestUrl)}:</div>
          <div class="header-value">${this.#request.url()}</div>
        </div>
        ${this.#request.statusCode? html`
          <div class="row">
            <div class="header-name">${i18nString(UIStrings.requestMethod)}:</div>
            <div class="header-value">${this.#request.requestMethod}</div>
          </div>
          <div class="row">
            <div class="header-name">${i18nString(UIStrings.statusCode)}:</div>
            <div class="header-value ${coloredCircleClassName} ${statusTextHasComment ? 'status-with-comment' : ''}">${statusText}</div>
          </div>
        ` : ''}
        ${this.#request.remoteAddress()? html`
          <div class="row">
            <div class="header-name">${i18nString(UIStrings.remoteAddress)}:</div>
            <div class="header-value">${this.#request.remoteAddress()}</div>
          </div>
        ` : ''}
        ${this.#request.referrerPolicy()? html`
          <div class="row">
            <div class="header-name">${i18nString(UIStrings.referrerPolicy)}:</div>
            <div class="header-value">${this.#request.referrerPolicy()}</div>
          </div>
        ` : ''}
      </${Category.litTagName}>
    `;
    // clang-format on
  }
}

export class ToggleRawHeadersEvent extends Event {
  static readonly eventName = 'togglerawevent';

  constructor() {
    super(ToggleRawHeadersEvent.eventName, {});
  }
}

export interface CategoryData {
  name: string;
  title: Common.UIString.LocalizedString;
  headerCount?: number;
  checked?: boolean;
}

export class Category extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-request-headers-category`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #expandedSetting?: Common.Settings.Setting<boolean>;
  #title: Common.UIString.LocalizedString = Common.UIString.LocalizedEmptyString;
  #headerCount?: number = undefined;
  #checked: boolean|undefined = undefined;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [requestHeadersViewStyles];
  }

  set data(data: CategoryData) {
    this.#title = data.title;
    this.#expandedSetting =
        Common.Settings.Settings.instance().createSetting('request-info-' + data.name + '-category-expanded', true);
    this.#headerCount = data.headerCount;
    this.#checked = data.checked;
    this.#render();
  }

  #onCheckboxToggle(): void {
    this.dispatchEvent(new ToggleRawHeadersEvent());
  }

  #render(): void {
    const isOpen = this.#expandedSetting ? this.#expandedSetting.get() : true;
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <details ?open=${isOpen} @toggle=${this.#onToggle}>
        <summary class="header" @keydown=${this.#onSummaryKeyDown}>
          ${this.#title}${this.#headerCount ?
            html`<span class="header-count"> (${this.#headerCount})</span>` :
            LitHtml.nothing
          }
          ${this.#checked !== undefined ? html`
            <span class="raw-checkbox-container">
              <label>
                <input type="checkbox" .checked=${this.#checked} @change=${this.#onCheckboxToggle} />
                ${i18nString(UIStrings.raw)}
              </label>
            </span>
          ` : LitHtml.nothing}
        </summary>
        <slot></slot>
      </details>
    `, this.#shadow, {host: this});
    // clang-format on
  }

  #onSummaryKeyDown(event: KeyboardEvent): void {
    if (!event.target) {
      return;
    }
    const summaryElement = event.target as HTMLElement;
    const detailsElement = summaryElement.parentElement as HTMLDetailsElement;
    if (!detailsElement) {
      throw new Error('<details> element is not found for a <summary> element');
    }
    switch (event.key) {
      case 'ArrowLeft':
        detailsElement.open = false;
        break;
      case 'ArrowRight':
        detailsElement.open = true;
        break;
    }
  }

  #onToggle(event: Event): void {
    this.#expandedSetting?.set((event.target as HTMLDetailsElement).open);
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-request-headers', RequestHeadersComponent);
ComponentHelpers.CustomElements.defineComponent('devtools-request-headers-category', Category);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-request-headers': RequestHeadersComponent;
    'devtools-request-headers-category': Category;
  }
}

interface BlockedReasonDetailDescriptor {
  name: string;
  value: Object|null;
  headerValueIncorrect?: boolean|null;
  details?: {
    explanation: () => string,
    examples: Array<{
      codeSnippet: string,
      comment?: (() => string),
    }>,
    link: {
      url: string,
    }|null,
  };
  headerNotSet: boolean|null;
}

const BlockedReasonDetails = new Map<Protocol.Network.BlockedReason, BlockedReasonDetailDescriptor>([
  [
    Protocol.Network.BlockedReason.CoepFrameResourceNeedsCoepHeader,
    {
      name: 'cross-origin-embedder-policy',
      value: null,
      headerValueIncorrect: null,
      details: {
        explanation: i18nLazyString(UIStrings.toEmbedThisFrameInYourDocument),
        examples: [{codeSnippet: 'Cross-Origin-Embedder-Policy: require-corp', comment: undefined}],
        link: {url: 'https://web.dev/coop-coep/'},
      },
      headerNotSet: null,
    },
  ],
  [
    Protocol.Network.BlockedReason.CorpNotSameOriginAfterDefaultedToSameOriginByCoep,
    {
      name: 'cross-origin-resource-policy',
      value: null,
      headerValueIncorrect: null,
      details: {
        explanation: i18nLazyString(UIStrings.toUseThisResourceFromADifferent),
        examples: [
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: same-site',
            comment: i18nLazyString(UIStrings.chooseThisOptionIfTheResourceAnd),
          },
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: cross-origin',
            comment: i18nLazyString(UIStrings.onlyChooseThisOptionIfAn),
          },
        ],
        link: {url: 'https://web.dev/coop-coep/'},
      },
      headerNotSet: null,
    },
  ],
  [
    Protocol.Network.BlockedReason.CoopSandboxedIframeCannotNavigateToCoopPage,
    {
      name: 'cross-origin-opener-policy',
      value: null,
      headerValueIncorrect: false,
      details: {
        explanation: i18nLazyString(UIStrings.thisDocumentWasBlockedFrom),
        examples: [],
        link: {url: 'https://web.dev/coop-coep/'},
      },
      headerNotSet: null,
    },
  ],
  [
    Protocol.Network.BlockedReason.CorpNotSameSite,
    {
      name: 'cross-origin-resource-policy',
      value: null,
      headerValueIncorrect: true,
      details: {
        explanation: i18nLazyString(UIStrings.toUseThisResourceFromADifferentSite),
        examples: [
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: cross-origin',
            comment: i18nLazyString(UIStrings.onlyChooseThisOptionIfAn),
          },
        ],
        link: null,
      },
      headerNotSet: null,
    },
  ],
  [
    Protocol.Network.BlockedReason.CorpNotSameOrigin,
    {
      name: 'cross-origin-resource-policy',
      value: null,
      headerValueIncorrect: true,
      details: {
        explanation: i18nLazyString(UIStrings.toUseThisResourceFromADifferentOrigin),
        examples: [
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: same-site',
            comment: i18nLazyString(UIStrings.chooseThisOptionIfTheResourceAnd),
          },
          {
            codeSnippet: 'Cross-Origin-Resource-Policy: cross-origin',
            comment: i18nLazyString(UIStrings.onlyChooseThisOptionIfAn),
          },
        ],
        link: null,
      },
      headerNotSet: null,
    },
  ],
]);
