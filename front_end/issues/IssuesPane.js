// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Network from '../network/network.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

class AffectedResourcesView extends UI.TreeOutline.TreeElement {
  /**
   * @param {!AggregatedIssueView} parent
   * @param {!{singular:string, plural:string}} resourceName - Singular and plural of the affected resource name.
   */
  constructor(parent, resourceName) {
    super();
    this.toggleOnClick = true;
    /** @type {!AggregatedIssueView} */
    this._parent = parent;
    this._resourceName = resourceName;
    /** @type {!Element} */
    this._affectedResourcesCountElement = this.createAffectedResourcesCounter();
    /** @type {!Element} */
    this._affectedResources = this.createAffectedResources();
    this._affectedResourcesCount = 0;
  }

  /**
   * @returns {!Element}
   */
  createAffectedResourcesCounter() {
    const counterLabel = createElementWithClass('div', 'affected-resource-label');
    this.listItemElement.appendChild(counterLabel);
    return counterLabel;
  }

  /**
   * @returns {!Element}
   */
  createAffectedResources() {
    const body = new UI.TreeOutline.TreeElement();
    const affectedResources = createElementWithClass('table', 'affected-resource-list');
    const header = createElementWithClass('tr');

    const name = createElementWithClass('td', 'affected-resource-header');
    name.textContent = 'Name';
    header.appendChild(name);

    const info = createElementWithClass('td', 'affected-resource-header affected-resource-header-info');
    // Prepend a space to align them better with cookie domains starting with a "."
    info.textContent = '\u2009Context';
    header.appendChild(info);

    affectedResources.appendChild(header);
    body.listItemElement.appendChild(affectedResources);
    this.appendChild(body);

    this._parent.appendAffectedResource(this);
    return affectedResources;
  }

  /**
   *
   * @param {number} count
   */
  getResourceName(count) {
    if (count === 1) {
      return this._resourceName.singular;
    }
    return this._resourceName.plural;
  }

  /**
   * @param {number} count
   */
  updateAffectedResourceCount(count) {
    this._affectedResourcesCount = count;
    this._affectedResourcesCountElement.textContent = `${count} ${this.getResourceName(count)}`;
    this.hidden = this._affectedResourcesCount === 0;
    this._parent.updateAffectedResourceVisibility();
  }

  /**
   * @returns {boolean}
   */
  isEmpty() {
    return this._affectedResourcesCount === 0;
  }

  clear() {
    this._affectedResources.textContent = '';
  }
}

class AffectedCookiesView extends AffectedResourcesView {
  /**
   * @param {!AggregatedIssueView} parent
   * @param {!SDK.Issue.AggregatedIssue} issue
   */
  constructor(parent, issue) {
    super(parent, {singular: ls`cookie`, plural: ls`cookies`});
    /** @type {!SDK.Issue.AggregatedIssue} */
    this._issue = issue;
  }

  /**
   * TODO(chromium:1063765): Strengthen types.
   * @param {!Iterable<*>} cookies
   */
  _appendAffectedCookies(cookies) {
    let count = 0;
    for (const cookie of cookies) {
      count++;
      this.appendAffectedCookie(/** @type{!{name:string,path:string,domain:string,siteForCookies:string}} */ (cookie));
    }
    this.updateAffectedResourceCount(count);
  }

  /**
   *
   * @param {!{name:string,path:string,domain:string,siteForCookies:string}} cookie
   */
  appendAffectedCookie(cookie) {
    const element = createElementWithClass('tr', 'affected-resource-cookie');
    const name = createElementWithClass('td', '');
    name.appendChild(UI.UIUtils.createTextButton(cookie.name, () => {
      Network.NetworkPanel.NetworkPanel.revealAndFilter([
        {
          filterType: 'cookie-domain',
          filterValue: cookie.domain,
        },
        {
          filterType: 'cookie-name',
          filterValue: cookie.name,
        },
        {
          filterType: 'cookie-path',
          filterValue: cookie.path,
        }
      ]);
    }, 'link-style devtools-link'));
    const info = createElementWithClass('td', 'affected-resource-cookie-info');

    // Prepend a space for all domains not starting with a "." to align them better.
    info.textContent = (cookie.domain[0] !== '.' ? '\u2008' : '') + cookie.domain + cookie.path;

    element.appendChild(name);
    element.appendChild(info);
    this._affectedResources.appendChild(element);
  }

  update() {
    this.clear();
    this._appendAffectedCookies(this._issue.cookies());
  }
}

class AffectedRequestsView extends AffectedResourcesView {
  /**
   * @param {!AggregatedIssueView} parent
   * @param {!SDK.Issue.AggregatedIssue} issue
   */
  constructor(parent, issue) {
    super(parent, {singular: ls`request`, plural: ls`requests`});
    /** @type {!SDK.Issue.AggregatedIssue} */
    this._issue = issue;
  }

  /**
   * @param {!Iterable<!SDK.NetworkRequest.NetworkRequest>} requests
   */
  _appendAffectedRequests(requests) {
    let count = 0;
    for (const request of requests) {
      count++;
      this.appendAffectedRequest(request);
    }
    this.updateAffectedResourceCount(count);
  }

  /**
   *
   * @param {!SDK.NetworkRequest.NetworkRequest} request
   */
  appendAffectedRequest(request) {
    const nameText = request.name().trimMiddle(100);
    const nameElement = createElementWithClass('td', '');
    nameElement.appendChild(UI.UIUtils.createTextButton(nameText, () => {
      Network.NetworkPanel.NetworkPanel.selectAndShowRequest(request, Network.NetworkItemView.Tabs.Headers);
    }, 'link-style devtools-link'));
    const element = createElementWithClass('tr', 'affected-resource-request');
    element.appendChild(nameElement);
    this._affectedResources.appendChild(element);
  }

  update() {
    this.clear();
    this._appendAffectedRequests(this._issue.requests());
  }
}


class AggregatedIssueView extends UI.TreeOutline.TreeElement {
  /**
   *
   * @param {!IssuesPaneImpl} parent
   * @param {!SDK.Issue.AggregatedIssue} issue
   * @param {!AggregatedIssueDescription} description
   */
  constructor(parent, issue, description) {
    super();
    this._parent = parent;
    this._issue = issue;
    /** @type {!AggregatedIssueDescription} */
    this._description = description;

    this.toggleOnClick = true;
    this.listItemElement.classList.add('issue');
    this.childrenListElement.classList.add('body');
  }

  /**
   * @override
   */
  onattach() {
    this._appendHeader();
    this._createBody();
    this._affectedResources = this._createAffectedResources();
    this._affectedCookiesView = new AffectedCookiesView(this, this._issue);
    this._affectedCookiesView.update();
    this._affectedRequestsView = new AffectedRequestsView(this, this._issue);
    this._affectedRequestsView.update();
    this._createReadMoreLink();

    this.updateAffectedResourceVisibility();
  }

  /**
   * @param {!UI.TreeOutline.TreeElement} resource
   */
  appendAffectedResource(resource) {
    this._affectedResources.appendChild(resource);
  }

  _appendHeader() {
    const header = createElementWithClass('div', 'header');
    const icon = UI.Icon.Icon.create('largeicon-breaking-change', 'icon');
    header.appendChild(icon);

    const title = createElementWithClass('div', 'title');
    title.textContent = this._description.title;
    header.appendChild(title);

    this.listItemElement.appendChild(header);
  }

  updateAffectedResourceVisibility() {
    const noCookies = !this._affectedCookiesView || this._affectedCookiesView.isEmpty();
    const noRequests = !this._affectedRequestsView || this._affectedRequestsView.isEmpty();
    const noResources = noCookies && noRequests;
    this._affectedResources.hidden = noResources;
  }

  /**
   *
   * @returns {!UI.TreeOutline.TreeElement}
   */
  _createAffectedResources() {
    const wrapper = new UI.TreeOutline.TreeElement();
    wrapper.setCollapsible(false);
    wrapper.setExpandable(true);
    wrapper.expand();
    wrapper.selectable = false;
    wrapper.listItemElement.classList.add('affected-resources-label');
    wrapper.listItemElement.textContent = ls`Affected Resources`;
    wrapper.childrenListElement.classList.add('affected-resources');
    this.appendChild(wrapper);
    return wrapper;
  }

  _createBody() {
    const kindAndCode = new UI.TreeOutline.TreeElement();
    kindAndCode.setCollapsible(false);
    kindAndCode.selectable = false;
    kindAndCode.listItemElement.classList.add('kind-code-line');
    const kind = createElementWithClass('span', 'issue-kind');
    kind.textContent = issueKindToString(this._description.issueKind);
    kindAndCode.listItemElement.appendChild(kind);
    kindAndCode.listItemElement.appendChild(createElementWithClass('span', 'separator'));
    const code = createElementWithClass('span', 'issue-code');
    code.textContent = this._issue.code();
    kindAndCode.listItemElement.appendChild(code);

    this.appendChild(kindAndCode);

    const messageElement = new UI.TreeOutline.TreeElement();
    messageElement.setCollapsible(false);
    messageElement.selectable = false;
    const message = this._description.message();
    messageElement.listItemElement.appendChild(message);
    this.appendChild(messageElement);
  }

  _createReadMoreLink() {
    const link = UI.XLink.XLink.create(this._description.link, ls`Learn more: ${this._description.linkTitle}`, 'link');
    const linkIcon = UI.Icon.Icon.create('largeicon-link', 'link-icon');
    link.prepend(linkIcon);
    const linkWrapper = new UI.TreeOutline.TreeElement();
    linkWrapper.setCollapsible(false);
    linkWrapper.listItemElement.classList.add('link-wrapper');
    linkWrapper.listItemElement.appendChild(link);
    this.appendChild(linkWrapper);
  }

  update() {
    this._affectedCookiesView.update();
    this._affectedRequestsView.update();
    this.updateAffectedResourceVisibility();
  }


  /**
   * @param {(boolean|undefined)=} expand - Expands the issue if `true`, collapses if `false`, toggles collapse if undefined
   */
  toggle(expand) {
    if (expand || (expand === undefined && !this.expanded)) {
      this.expand();
    } else {
      this.collapse();
    }
  }
}

export class IssuesPaneImpl extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues/issuesPane.css');
    this._issueViews = new Map();

    this._issuesToolbarContainer = this.contentElement.createChild('div', 'issues-toolbar-container');
    new UI.Toolbar.Toolbar('issues-toolbar-left', this._issuesToolbarContainer);
    const rightToolbar = new UI.Toolbar.Toolbar('issues-toolbar-right', this._issuesToolbarContainer);
    rightToolbar.appendSeparator();
    const toolbarWarnings = new UI.Toolbar.ToolbarItem(createElement('div'));
    const breakingChangeIcon = UI.Icon.Icon.create('largeicon-breaking-change');
    toolbarWarnings.element.appendChild(breakingChangeIcon);
    this._toolbarIssuesCount = toolbarWarnings.element.createChild('span', 'warnings-count-label');
    rightToolbar.appendToolbarItem(toolbarWarnings);

    this._issuesTree = new UI.TreeOutline.TreeOutlineInShadow();
    this._issuesTree.registerRequiredCSS('issues/issuesTree.css');
    this._issuesTree.setShowSelectionOnKeyboardFocus(true);
    this._issuesTree.contentElement.classList.add('issues');
    this.contentElement.appendChild(this._issuesTree.element);

    const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
    this._model = null;
    if (mainTarget) {
      this._model = mainTarget.model(SDK.IssuesModel.IssuesModel);
      if (this._model) {
        this._model.addEventListener(SDK.IssuesModel.Events.AggregatedIssueUpdated, this._aggregatedIssueUpdated, this);
        this._model.addEventListener(SDK.IssuesModel.Events.FullUpdateRequired, this._fullUpdate, this);
        this._model.ensureEnabled();
      }
    }

    if (this._model) {
      for (const issue of this._model.aggregatedIssues()) {
        this._updateAggregatedIssueView(issue);
      }
    }
    this._updateCounts();

    /** @type {?UI.Infobar.Infobar} */
    this._reloadInfobar = null;
    /** @type {?Element} */
    this._infoBarDiv = null;
    this._showReloadInfobarIfNeeded();
  }

  /**
   * @param {!{data: !SDK.Issue.AggregatedIssue}} event
   */
  _aggregatedIssueUpdated(event) {
    const aggregatedIssue = /** @type {!SDK.Issue.AggregatedIssue} */ (event.data);
    this._updateAggregatedIssueView(aggregatedIssue);
  }

  /**
   * @param {!SDK.Issue.AggregatedIssue} aggregatedIssue
   */
  _updateAggregatedIssueView(aggregatedIssue) {
    const description = issueDescriptions.get(aggregatedIssue.code());
    if (!description) {
      console.warn('Could not find description for issue code:', aggregatedIssue.code());
      return;
    }
    if (!this._issueViews.has(aggregatedIssue.code())) {
      const view = new AggregatedIssueView(this, aggregatedIssue, description);
      this._issueViews.set(aggregatedIssue.code(), view);
      this._issuesTree.appendChild(view);
    }
    this._issueViews.get(aggregatedIssue.code()).update();
    this._updateCounts();
  }

  _fullUpdate() {
    this._hideReloadInfoBar();
    for (const view of this._issueViews.values()) {
      view.detach();
    }
    this._issueViews.clear();
    for (const aggregatedIssue of this._model.aggregatedIssues()) {
      this._updateAggregatedIssueView(aggregatedIssue);
    }
    this._updateCounts();
  }

  _updateCounts() {
    this._toolbarIssuesCount.textContent = this._model.numberOfAggregatedIssues();
  }

  /**
   * @param {string} code
   */
  revealByCode(code) {
    const issueView = this._issueViews.get(code);
    if (issueView) {
      issueView.reveal();
    }
  }

  _showReloadInfobarIfNeeded() {
    if (!this._model || !this._model.reloadForAccurateInformationRequired()) {
      return;
    }

    function reload() {
      const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
      if (mainTarget) {
        const resourceModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
        if (resourceModel) {
          resourceModel.reloadPage();
        }
      }
    }

    const infobar = new UI.Infobar.Infobar(
        UI.Infobar.Type.Warning,
        ls`Some issues might be missing or incomplete, reload the inspected page to get full information`,
        [{text: ls`Reload page`, highlight: false, delegate: reload, dismiss: true}]);

    this._reloadInfobar = infobar;
    this._attachReloadInfoBar(infobar);
  }

  /** @param {!UI.Infobar.Infobar} infobar */
  _attachReloadInfoBar(infobar) {
    if (!this._infoBarDiv) {
      this._infoBarDiv = createElementWithClass('div', 'flex-none');
      this.contentElement.insertBefore(this._infoBarDiv, this._issuesToolbarContainer.nextSibling);
    }
    this._infoBarDiv.appendChild(infobar.element);
    infobar.setParentView(this);
    this.doResize();
  }

  _hideReloadInfoBar() {
    if (this._reloadInfobar) {
      this._reloadInfobar.dispose();
      this._reloadInfobar = null;
    }
  }
}

/**
  * @param {string} text
  * @return {!Element}
  */
function textOnlyMessage(text) {
  const message = createElementWithClass('div', 'message');
  message.textContent = text;
  return message;
}

/** @enum {symbol} */
const IssueKind = {
  BreakingChange: Symbol('BreakingChange'),
};

/**
 * @param {!IssueKind} kind
 * @return {string}
 */
function issueKindToString(kind) {
  switch (kind) {
    case IssueKind.BreakingChange:
      return ls`Breaking change`;
  }
  return '';
}

/**
 * @return {!Element}
 */
function CorpNotSameOriginAfterDefaultedToSameOriginByCoepMessage() {
  const message = createElementWithClass('div', 'message');
  message.textContent = ls
  `The resource is not a same-origin resource, and the response headers for the resource did not specify any cross-origin resource policy.
     The cross-origin resource policy was defaulted to same-origin, because the resource was used in a context that enables the cross-origin embedder policy.
     To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:`;
  const example1 = createElementWithClass('div', 'example');
  example1.createChild('code').textContent = 'Cross-Origin-Resource-Policy: same-site';
  example1.createChild('span', 'comment').textContent =
      ls`Choose this option if the resource and the document are served from the same site.`;
  message.appendChild(example1);
  const example2 = createElementWithClass('div', 'example');
  example2.createChild('code').textContent = 'Cross-Origin-Resource-Policy: cross-origin';
  example2.createChild('span', 'comment').textContent =
      ls`Only choose this option if an arbitrary website including this resource does not impose a security risk.`;
  message.appendChild(example2);
  return message;
}

/**
 * @return {!Element}
 */
function CoepFrameResourceNeedsCoepHeaderMessage() {
  const message = createElementWithClass('div', 'message');
  message.textContent = ls
  `An iframe was emdbedded on a site which enables the cross-origin embedder policy, but the response headers for the document of the iframe did not specify a cross-origin embedder policy, which causes the iframe to get blocked.
  To allow embedding of the iframe, the response needs to enable the cross-origin embedder policy for the iframe by specifying the following response header:`;
  const example1 = createElementWithClass('div', 'example');
  example1.createChild('code').textContent = 'Cross-Origin-Embedder-Policy: require-corp';
  message.appendChild(example1);
  return message;
}

/**
 * @return {!Element}
 */
function CorpNotSameSiteMessage() {
  const message = createElementWithClass('div', 'message');
  message.textContent = ls
  `The resource was loaded in a context that is not same-site and that enables the cross-origin embedder policy. The resource specified a cross-origin resource policy that allows only same-site usage, and was hence blocked.
  To allow usage of the resource from a different site, the server may relax the cross-origin resource policy response header:`;
  const example = createElementWithClass('div', 'example');
  example.createChild('code').textContent = 'Cross-Origin-Resource-Policy: cross-origin';
  example.createChild('span', 'comment').textContent =
      ls`Only choose this option if an arbitrary website including this resource does not impose a security risk.`;
  message.appendChild(example);
  return message;
}

/**
 * @return {!Element}
 */
function CorpNotSameOriginMessage() {
  const message = createElementWithClass('div', 'message');
  message.textContent = ls
  `The resource was loaded in a context that is not same-origin and that enables the cross-origin embedder policy. The resource specified a cross-origin resource policy that allows only same-origin usage, and was hence blocked.
  To use this resource from a different origin, the server may relax the cross-origin resource policy response header:`;
  const example1 = createElementWithClass('div', 'example');
  example1.createChild('code').textContent = 'Cross-Origin-Resource-Policy: same-site';
  example1.createChild('span', 'comment').textContent =
      ls`Choose this option if the resource and the document are served from the same site.`;
  message.appendChild(example1);
  const example2 = createElementWithClass('div', 'example');
  example2.createChild('code').textContent = 'Cross-Origin-Resource-Policy: cross-origin';
  example2.createChild('span', 'comment').textContent =
      ls`Only choose this option if an arbitrary website including this resource does not impose a security risk.`;
  message.appendChild(example2);
  return message;
}

/**
 * @typedef {{
  *            title:string,
  *            message: (function():!Element),
  *            issueKind: !IssueKind,
  *            link: string,
  *            linkTitle: string
  *          }}
  */
let AggregatedIssueDescription;  // eslint-disable-line no-unused-vars

/** @type {!Map<string, !AggregatedIssueDescription>} */
const issueDescriptions = new Map([
  ['SameSiteCookies::SameSiteNoneWithoutSecure',
      {title: ls`A Cookie has been set with SameSite=None but without Secure`, message:
        () => textOnlyMessage(ls
    `In a future version of Chrome, third-party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man-in-the-middle scenario.`),
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/samesite-cookies-explained/`,
    linkTitle: ls`SameSite cookies explained`,
  }],
  ['SameSiteCookies::SameSiteNoneMissingForThirdParty', {
    title: ls`A Cookie in a third-party context has been set without SameSite=None`,
    message: () => textOnlyMessage(ls
    `In a future version of Chrome, third-party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man-in-the-middle scenario.`),
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/samesite-cookies-explained/`,
    linkTitle: ls`SameSite cookies explained`,
  }],
  ['SameSiteCookieIssue', {
    title: ls`A Cookie in a third-party context has been set without SameSite=None`,
    message: () => textOnlyMessage(ls
    `In a future version of Chrome, third-party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man-in-the-middle scenario.`),
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/samesite-cookies-explained/`,
    linkTitle: ls`SameSite cookies explained`,
  }],
  ['CrossOriginEmbedderPolicy::CorpNotSameOriginAfterDefaultedToSameOriginByCoep', {
    title: ls`A resource was blocked because it is missing a cross-origin resource policy`,
    message: CorpNotSameOriginAfterDefaultedToSameOriginByCoepMessage,
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/coop-coep/`,
    linkTitle: ls`Enable powerful features with COOP and COEP`,
  }],
  ['CrossOriginEmbedderPolicy::CoepFrameResourceNeedsCoepHeader',  {
    title: ls`An iframe was blocked because it did not specify a cross-origin embedder policy`,
    message: CoepFrameResourceNeedsCoepHeaderMessage,
     issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/coop-coep/`,
    linkTitle: ls`Enable powerful features with COOP and COEP`,
  }],
  ['CrossOriginEmbedderPolicy::CoopSandboxedIframeCannotNavigateToCoopPage',  {
    title: ls`An iframe navigation to a document with a cross-origin opener policy was blocked`,
    message: () => textOnlyMessage(ls
    `A document was blocked from loading in an iframe with a sandbox attribute because the document specified a cross-origin opener policy.`),
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/coop-coep/`,
    linkTitle: ls`Enable powerful features with COOP and COEP`,
  }],
  ['CrossOriginEmbedderPolicy::CorpNotSameSite',  {
    title: ls`A resource was blocked because its cross-origin resource policy only allows same-site usage`,
    message: CorpNotSameSiteMessage,
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/coop-coep/`,
    linkTitle: ls`Enable powerful features with COOP and COEP`,
  }],
  ['CrossOriginEmbedderPolicy::CorpNotSameOrigin',  {
    title: ls`A resource was blocked because its cross-origin resource policy only allows same-origin usage`,
    message: CorpNotSameOriginMessage,
    issueKind: IssueKind.BreakingChange,
    link: ls`https://web.dev/coop-coep/`,
    linkTitle: ls`Enable powerful features with COOP and COEP`,
  }],
]);
