// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Host from '../../../core/host/host.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Platform from '../../../core/platform/platform.js';
import * as Root from '../../../core/root/root.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as Protocol from '../../../generated/protocol.js';
import * as IssuesManager from '../../../models/issues_manager/issues_manager.js';
import * as Persistence from '../../../models/persistence/persistence.js';
import * as Workspace from '../../../models/workspace/workspace.js';
import * as NetworkForward from '../../../panels/network/forward/forward.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as Input from '../../../ui/components/input/input.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as Sources from '../../sources/sources.js';
import {type HeaderSectionRowData, HeaderSectionRow, type HeaderDescriptor} from './HeaderSectionRow.js';

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
  *@description Label for a link from the network panel's headers view to the file in which
  * header overrides are defined in the sources panel.
  */
  headerOverrides: 'Header overrides',
  /**
  *@description Text that is usually a hyperlink to more documentation
  */
  learnMore: 'Learn more',
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
  *@description Message to explain lack of raw headers for a particular network request
  */
  provisionalHeadersAreShownDisableCache: 'Provisional headers are shown. Disable cache to see full headers.',
  /**
  *@description Tooltip to explain lack of raw headers for a particular network request
  */
  onlyProvisionalHeadersAre:
      'Only provisional headers are available because this request was not sent over the network and instead was served from a local cache, which doesn’t store the original request headers. Disable cache to see full request headers.',
  /**
  *@description Message to explain lack of raw headers for a particular network request
  */
  provisionalHeadersAreShown: 'Provisional headers are shown.',
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
    this.#request.addEventListener(SDK.NetworkRequest.Events.RequestHeadersChanged, this.#refreshHeadersView, this);
    this.#request.addEventListener(SDK.NetworkRequest.Events.ResponseHeadersChanged, this.#refreshHeadersView, this);
    this.#refreshHeadersView();
  }

  willHide(): void {
    this.#request.removeEventListener(SDK.NetworkRequest.Events.RemoteAddressChanged, this.#refreshHeadersView, this);
    this.#request.removeEventListener(SDK.NetworkRequest.Events.FinishedLoading, this.#refreshHeadersView, this);
    this.#request.removeEventListener(SDK.NetworkRequest.Events.RequestHeadersChanged, this.#refreshHeadersView, this);
    this.#request.removeEventListener(SDK.NetworkRequest.Events.ResponseHeadersChanged, this.#refreshHeadersView, this);
  }

  #refreshHeadersView(): void {
    this.#headersView.data = {
      request: this.#request,
    };
  }

  revealHeader(section: NetworkForward.UIRequestLocation.UIHeaderSection, header?: string): void {
    this.#headersView.data = {
      request: this.#request,
      toReveal: {section, header: header},
    };
  }
}

export interface RequestHeadersComponentData {
  request: SDK.NetworkRequest.NetworkRequest;
  toReveal?: {section: NetworkForward.UIRequestLocation.UIHeaderSection, header?: string};
}

export class RequestHeadersComponent extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-request-headers`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #request?: Readonly<SDK.NetworkRequest.NetworkRequest>;
  #showResponseHeadersText = false;
  #showRequestHeadersText = false;
  #showResponseHeadersTextFull = false;
  #showRequestHeadersTextFull = false;
  #toReveal?: {section: NetworkForward.UIRequestLocation.UIHeaderSection, header?: string} = undefined;
  readonly #workspace = Workspace.Workspace.WorkspaceImpl.instance();

  set data(data: RequestHeadersComponentData) {
    this.#request = data.request;
    this.#toReveal = data.toReveal;
    this.#render();
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [requestHeadersViewStyles];
    this.#workspace.addEventListener(
        Workspace.Workspace.Events.UISourceCodeAdded, this.#uiSourceCodeAddedOrRemoved, this);
    this.#workspace.addEventListener(
        Workspace.Workspace.Events.UISourceCodeRemoved, this.#uiSourceCodeAddedOrRemoved, this);
  }

  disconnectedCallback(): void {
    this.#workspace.removeEventListener(
        Workspace.Workspace.Events.UISourceCodeAdded, this.#uiSourceCodeAddedOrRemoved, this);
    this.#workspace.removeEventListener(
        Workspace.Workspace.Events.UISourceCodeRemoved, this.#uiSourceCodeAddedOrRemoved, this);
  }

  #uiSourceCodeAddedOrRemoved(event: Common.EventTarget.EventTargetEvent<Workspace.UISourceCode.UISourceCode>): void {
    if (this.#getHeaderOverridesFileUrl() === event.data.url()) {
      this.#render();
    }
  }

  #render(): void {
    if (!this.#request) {
      return;
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      ${this.#renderGeneralSection()}
      ${this.#renderResponseHeaders()}
      ${this.#renderRequestHeaders()}
    `, this.#shadow, {host: this});
    // clang-format on
  }

  #renderResponseHeaders(): LitHtml.LitTemplate {
    if (!this.#request) {
      return LitHtml.nothing;
    }

    const headersWithIssues = [];
    if (this.#request.wasBlocked()) {
      const headerWithIssues =
          BlockedReasonDetails.get((this.#request.blockedReason() as Protocol.Network.BlockedReason));
      if (headerWithIssues) {
        if (IssuesManager.RelatedIssue.hasIssueOfCategory(
                this.#request, IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy)) {
          const followLink = (): void => {
            Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.LearnMoreLinkCOEP);
            if (this.#request) {
              void IssuesManager.RelatedIssue.reveal(
                  this.#request, IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy);
            }
          };
          if (headerWithIssues.blockedDetails) {
            headerWithIssues.blockedDetails.reveal = followLink;
          }
        }
        headersWithIssues.push(headerWithIssues);
      }
    }

    function mergeHeadersWithIssues(
        headers: SDK.NetworkRequest.NameValue[], headersWithIssues: HeaderDescriptor[]): HeaderDescriptor[] {
      let i = 0, j = 0;
      const result: HeaderDescriptor[] = [];
      while (i < headers.length && j < headersWithIssues.length) {
        if (headers[i].name < headersWithIssues[j].name) {
          result.push({...headers[i++], headerNotSet: false});
        } else if (headers[i].name > headersWithIssues[j].name) {
          result.push({...headersWithIssues[j++], headerNotSet: true});
        } else {
          result.push({...headersWithIssues[j++], ...headers[i++], headerNotSet: false});
        }
      }
      while (i < headers.length) {
        result.push({...headers[i++], headerNotSet: false});
      }
      while (j < headersWithIssues.length) {
        result.push({...headersWithIssues[j++], headerNotSet: true});
      }
      return result;
    }

    const mergedHeaders = mergeHeadersWithIssues(this.#request.sortedResponseHeaders.slice(), headersWithIssues);

    const blockedResponseCookies = this.#request.blockedResponseCookies();
    const blockedCookieLineToReasons = new Map<string, Protocol.Network.SetCookieBlockedReason[]>(
        blockedResponseCookies?.map(c => [c.cookieLine, c.blockedReasons]));
    for (const header of mergedHeaders) {
      if (header.name.toLowerCase() === 'set-cookie' && header.value) {
        const matchingBlockedReasons = blockedCookieLineToReasons.get(header.value.toString());
        if (matchingBlockedReasons) {
          header.setCookieBlockedReasons = matchingBlockedReasons;
        }
      }
    }

    if (this.#toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.Response) {
      mergedHeaders.filter(header => header.name.toUpperCase() === this.#toReveal?.header?.toUpperCase())
          .forEach(header => {
            header.highlight = true;
          });
    }

    const toggleShowRaw = (): void => {
      this.#showResponseHeadersText = !this.#showResponseHeadersText;
      this.#render();
    };

    if (!mergedHeaders.length) {
      return LitHtml.nothing;
    }

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
          additionalContent: this.#renderHeaderOverridesLink(),
          forceOpen: this.#toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.Response,
        } as CategoryData}
        aria-label=${i18nString(UIStrings.responseHeaders)}
      >
        ${this.#showResponseHeadersText ?
            this.#renderRawHeaders(this.#request.responseHeadersText, true) : html`
          ${mergedHeaders.map(header => html`
            <${HeaderSectionRow.litTagName} .data=${{
              header: header,
            } as HeaderSectionRowData}></${HeaderSectionRow.litTagName}>
          `)}
        `}
      </${Category.litTagName}>
    `;
    // clang-format on
  }

  #renderHeaderOverridesLink(): LitHtml.LitTemplate {
    const overrideable = Root.Runtime.experiments.isEnabled(Root.Runtime.ExperimentName.HEADER_OVERRIDES);
    if (!overrideable || !this.#workspace.uiSourceCodeForURL(this.#getHeaderOverridesFileUrl())) {
      return LitHtml.nothing;
    }

    const overridesSetting: Common.Settings.Setting<boolean> =
        Common.Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled');
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    const fileIcon = overridesSetting.get() ? html`
      <${IconButton.Icon.Icon.litTagName} class="inline-icon purple-dot" .data=${{
          iconName: 'file-sync_icon',
          width: '11px',
          height: '13px',
        } as IconButton.Icon.IconData}>
      </${IconButton.Icon.Icon.litTagName}>` : html`
      <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
          iconName: 'file_icon',
          color: 'var(--color-text-primary)',
          width: '12px',
          height: '12px',
        } as IconButton.Icon.IconData}>
      </${IconButton.Icon.Icon.litTagName}>`;
    // clang-format on

    const revealHeadersFile = (event: Event): void => {
      event.preventDefault();
      const uiSourceCode = this.#workspace.uiSourceCodeForURL(this.#getHeaderOverridesFileUrl());
      if (uiSourceCode) {
        Sources.SourcesPanel.SourcesPanel.instance().showUISourceCode(uiSourceCode);
      }
    };

    return html`
      <x-link @click=${revealHeadersFile} class="link devtools-link">
        ${fileIcon}${i18nString(UIStrings.headerOverrides)}
      </x-link>
    `;
  }

  #getHeaderOverridesFileUrl(): Platform.DevToolsPath.UrlString {
    if (!this.#request) {
      return Platform.DevToolsPath.EmptyUrlString;
    }
    const fileUrl = Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().fileUrlFromNetworkUrl(
        this.#request.url(), /* ignoreInactive */ true);
    return fileUrl.substring(0, fileUrl.lastIndexOf('/')) + '/' +
        Persistence.NetworkPersistenceManager.HEADERS_FILENAME as Platform.DevToolsPath.UrlString;
  }

  #renderRequestHeaders(): LitHtml.LitTemplate {
    if (!this.#request) {
      return LitHtml.nothing;
    }

    const headers: HeaderDescriptor[] =
        this.#request.requestHeaders().slice().map(header => ({...header, headerNotSet: false}));
    headers.sort(function(a, b) {
      return Platform.StringUtilities.compare(a.name.toLowerCase(), b.name.toLowerCase());
    });

    if (this.#toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.Request) {
      headers.filter(header => header.name.toUpperCase() === this.#toReveal?.header?.toUpperCase()).forEach(header => {
        header.highlight = true;
      });
    }

    const requestHeadersText = this.#request.requestHeadersText();
    if (!headers.length && requestHeadersText !== undefined) {
      return LitHtml.nothing;
    }

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
          forceOpen: this.#toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.Request,
        } as CategoryData}
        aria-label=${i18nString(UIStrings.requestHeaders)}
      >
        ${(this.#showRequestHeadersText && requestHeadersText) ?
            this.#renderRawHeaders(requestHeadersText, false) : html`
          ${this.#maybeRenderProvisionalHeadersWarning()}
          ${headers.map(header => html`
            <${HeaderSectionRow.litTagName} .data=${{
              header: header,
            } as HeaderSectionRowData}></${HeaderSectionRow.litTagName}>
          `)}
        `}
      </${Category.litTagName}>
    `;
    // clang-format on
  }

  #maybeRenderProvisionalHeadersWarning(): LitHtml.LitTemplate {
    if (!this.#request || this.#request.requestHeadersText() !== undefined) {
      return LitHtml.nothing;
    }

    let cautionText;
    let cautionTitle = '';
    if (this.#request.cachedInMemory() || this.#request.cached()) {
      cautionText = i18nString(UIStrings.provisionalHeadersAreShownDisableCache);
      cautionTitle = i18nString(UIStrings.onlyProvisionalHeadersAre);
    } else {
      cautionText = i18nString(UIStrings.provisionalHeadersAreShown);
    }
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return html`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation" title=${cautionTitle}>
            <${IconButton.Icon.Icon.litTagName} class="inline-icon" .data=${{
                iconName: 'clear-warning_icon',
                width: '12px',
                height: '12px',
              } as IconButton.Icon.IconData}>
            </${IconButton.Icon.Icon.litTagName}>
            ${cautionText} <x-link href="https://developer.chrome.com/docs/devtools/network/reference/#provisional-headers" class="link">${i18nString(UIStrings.learnMore)}</x-link>
          </div>
        </div>
      </div>
    `;
    // clang-format on
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

  #renderGeneralSection(): LitHtml.LitTemplate {
    if (!this.#request) {
      return LitHtml.nothing;
    }

    const statusClasses = [];
    if (this.#request.statusCode < 300 || this.#request.statusCode === 304) {
      statusClasses.push('green-circle');
    } else if (this.#request.statusCode < 400) {
      statusClasses.push('yellow-circle');
    } else {
      statusClasses.push('red-circle');
    }

    let statusText = this.#request.statusCode + ' ' + this.#request.statusText;
    if (this.#request.cachedInMemory()) {
      statusText += ' ' + i18nString(UIStrings.fromMemoryCache);
      statusClasses.push('status-with-comment');
    } else if (this.#request.fetchedViaServiceWorker) {
      statusText += ' ' + i18nString(UIStrings.fromServiceWorker);
      statusClasses.push('status-with-comment');
    } else if (this.#request.redirectSourceSignedExchangeInfoHasNoErrors()) {
      statusText += ' ' + i18nString(UIStrings.fromSignedexchange);
      statusClasses.push('status-with-comment');
    } else if (this.#request.webBundleInnerRequestInfo()) {
      statusText += ' ' + i18nString(UIStrings.fromWebBundle);
      statusClasses.push('status-with-comment');
    } else if (this.#request.fromPrefetchCache()) {
      statusText += ' ' + i18nString(UIStrings.fromPrefetchCache);
      statusClasses.push('status-with-comment');
    } else if (this.#request.cached()) {
      statusText += ' ' + i18nString(UIStrings.fromDiskCache);
      statusClasses.push('status-with-comment');
    }

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return html`
      <${Category.litTagName}
        .data=${{
          name: 'general',
          title: i18nString(UIStrings.general),
          forceOpen: this.#toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.General,
        } as CategoryData}
        aria-label=${i18nString(UIStrings.general)}
      >
        ${this.#renderGeneralRow(i18nString(UIStrings.requestUrl), this.#request.url())}
        ${this.#request.statusCode? this.#renderGeneralRow(i18nString(UIStrings.requestMethod), this.#request.requestMethod) : LitHtml.nothing}
        ${this.#request.statusCode? this.#renderGeneralRow(i18nString(UIStrings.statusCode), statusText, statusClasses) : LitHtml.nothing}
        ${this.#request.remoteAddress()? this.#renderGeneralRow(i18nString(UIStrings.remoteAddress), this.#request.remoteAddress()) : LitHtml.nothing}
        ${this.#request.referrerPolicy()? this.#renderGeneralRow(i18nString(UIStrings.referrerPolicy), String(this.#request.referrerPolicy())) : LitHtml.nothing}
      </${Category.litTagName}>
    `;
    // clang-format on
  }

  #renderGeneralRow(name: Common.UIString.LocalizedString, value: string, classNames?: string[]): LitHtml.LitTemplate {
    const isHighlighted = this.#toReveal?.section === NetworkForward.UIRequestLocation.UIHeaderSection.General &&
        name.toUpperCase() === this.#toReveal?.header?.toUpperCase();
    return html`
      <div class="row ${isHighlighted ? 'header-highlight' : ''}">
        <div class="header-name">${name}:</div>
        <div
          class="header-value ${classNames?.join(' ')}"
          @copy=${(): void => Host.userMetrics.actionTaken(Host.UserMetrics.Action.NetworkPanelCopyValue)}
        >${value}</div>
      </div>
    `;
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
  additionalContent?: LitHtml.LitTemplate;
  forceOpen?: boolean;
}

export class Category extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-request-headers-category`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #expandedSetting?: Common.Settings.Setting<boolean>;
  #title: Common.UIString.LocalizedString = Common.UIString.LocalizedEmptyString;
  #headerCount?: number = undefined;
  #checked: boolean|undefined = undefined;
  #additionalContent: LitHtml.LitTemplate|undefined = undefined;
  #forceOpen: boolean|undefined = undefined;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [requestHeadersViewStyles, Input.checkboxStyles];
  }

  set data(data: CategoryData) {
    this.#title = data.title;
    this.#expandedSetting =
        Common.Settings.Settings.instance().createSetting('request-info-' + data.name + '-category-expanded', true);
    this.#headerCount = data.headerCount;
    this.#checked = data.checked;
    this.#additionalContent = data.additionalContent;
    this.#forceOpen = data.forceOpen;
    this.#render();
  }

  #onCheckboxToggle(): void {
    this.dispatchEvent(new ToggleRawHeadersEvent());
  }

  #render(): void {
    const isOpen = (this.#expandedSetting ? this.#expandedSetting.get() : true) || this.#forceOpen;
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    render(html`
      <details ?open=${isOpen} @toggle=${this.#onToggle}>
        <summary class="header" @keydown=${this.#onSummaryKeyDown}>
          <div class="header-grid-container">
            <div>
              ${this.#title}${this.#headerCount !== undefined ?
                html`<span class="header-count"> (${this.#headerCount})</span>` :
                LitHtml.nothing
              }
            </div>
            <div class="hide-when-closed">
              ${this.#checked !== undefined ? html`
                <label><input type="checkbox" .checked=${this.#checked} @change=${this.#onCheckboxToggle} />${i18nString(UIStrings.raw)}</label>
              ` : LitHtml.nothing}
            </div>
            <div class="hide-when-closed">${this.#additionalContent}</div>
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

const BlockedReasonDetails = new Map<Protocol.Network.BlockedReason, HeaderDescriptor>([
  [
    Protocol.Network.BlockedReason.CoepFrameResourceNeedsCoepHeader,
    {
      name: 'cross-origin-embedder-policy',
      value: null,
      headerValueIncorrect: null,
      blockedDetails: {
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
      blockedDetails: {
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
      blockedDetails: {
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
      blockedDetails: {
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
      blockedDetails: {
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
