// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Network from '../network/network.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

/**
 *
 * @param {string} path
 * @return {string}
 */
const extractShortPath = path => {
  // 1st regex matches everything after last '/'
  // if path ends with '/', 2nd regex returns everything between the last two '/'
  return (/[^/]+$/.exec(path) || /[^/]+\/$/.exec(path) || [''])[0];
};

class AffectedResourcesView {
  /**
   * @param {!AggregatedIssueView} parent
   * @param {!{singular:string, plural:string}} resourceName - Singular and plural of the affected resource name.
   */
  constructor(parent, resourceName) {
    /** @type {!AggregatedIssueView} */
    this._parent = parent;
    this._resourceName = resourceName;
    this._wrapper = createElementWithClass('div', 'affected-resource');
    /** @type {!Element} */
    this._affectedResourcesCountElement = this.createAffectedResourcesCounter(this._wrapper);
    /** @type {!Element} */
    this._affectedResources = this.createAffectedResources(this._wrapper);
    this._affectedResourcesCount = 0;
  }

  /**
   * @param {!Element} wrapper
   * @returns {!Element}
   */
  createAffectedResourcesCounter(wrapper) {
    const counterWrapper = createElementWithClass('div', 'affected-resource-label-wrapper');
    counterWrapper.addEventListener('click', () => {
      wrapper.classList.toggle('expanded');
    });
    const counterLabel = createElementWithClass('div', 'affected-resource-label');
    counterWrapper.appendChild(counterLabel);
    wrapper.appendChild(counterWrapper);
    return counterLabel;
  }

  /**
   * @param {!Element} wrapper
   * @returns {!Element}
   */
  createAffectedResources(wrapper) {
    const body = createElementWithClass('div', 'affected-resource-list-wrapper');
    const affectedResources = createElementWithClass('table', 'affected-resource-list');
    body.appendChild(affectedResources);
    wrapper.appendChild(body);

    this._parent.appendAffectedResource(wrapper);
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
    this._wrapper.style.display = this._affectedResourcesCount === 0 ? 'none' : '';
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
   * @param {!Iterable<!Protocol.Audits.AffectedCookie>} cookies
   */
  _appendAffectedCookies(cookies) {
    const header = createElementWithClass('tr');

    const name = createElementWithClass('td', 'affected-resource-header');
    name.textContent = 'Name';
    header.appendChild(name);

    const info = createElementWithClass('td', 'affected-resource-header affected-resource-header-info');
    // Prepend a space to align them better with cookie domains starting with a "."
    info.textContent = '\u2009Context';
    header.appendChild(info);

    this._affectedResources.appendChild(header);

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
    const element = createElementWithClass('tr', 'affected-resource-list-link');
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
    const info = createElementWithClass('td', 'affected-resource-list-item');

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
    const element = createElementWithClass('tr', 'affected-resource-list-link');
    element.appendChild(nameElement);
    this._affectedResources.appendChild(element);
  }

  update() {
    this.clear();
    this._appendAffectedRequests(this._issue.requests());
  }
}

class AffectedMixedContentView extends AffectedResourcesView {
  /**
   * @param {!AggregatedIssueView} parent
   * @param {!SDK.Issue.AggregatedIssue} issue
   */
  constructor(parent, issue) {
    super(parent, {singular: ls`resource`, plural: ls`resources`});
    /** @type {!SDK.Issue.AggregatedIssue} */
    this._issue = issue;
  }

  /**
   * TODO(chromium:1063765): Strengthen types.
   * @param {!Iterable<*>} mixedContents
   */
  _appendAffectedMixedContents(mixedContents) {
    const header = createElementWithClass('tr');

    const name = createElementWithClass('td', 'affected-resource-header');
    name.textContent = 'Name';
    header.appendChild(name);

    const type = createElementWithClass('td', 'affected-resource-header affected-resource-header-info');
    type.textContent = 'Type';
    header.appendChild(type);

    const info = createElementWithClass('td', 'affected-resource-header affected-resource-header-info');
    info.textContent = 'Status';
    header.appendChild(info);

    const initiator = createElementWithClass('td', 'affected-resource-header affected-resource-header-info');
    initiator.textContent = 'Initiator';
    header.appendChild(initiator);

    this._affectedResources.appendChild(header);


    let count = 0;
    for (const mixedContent of mixedContents) {
      count++;
      this.appendAffectedMixedContent(
          /** @type{!{type:string,status:string,url:string,initiator:string}} */ (mixedContent));
    }
    this.updateAffectedResourceCount(count);
  }

  /**
   *
   * @param {!{type:string,status:string,url:string,initiator:string}} mixedContent
   */
  appendAffectedMixedContent(mixedContent) {
    const element = createElementWithClass('tr', 'affected-resource-list-link');
    const filename = extractShortPath(mixedContent.insecureURL);
    const name = createElementWithClass('td', '');
    name.appendChild(UI.UIUtils.createTextButton(filename, () => {
      Network.NetworkPanel.NetworkPanel.revealAndFilter(filename);
    }, 'link-style devtools-link'));
    UI.Tooltip.Tooltip.install(name, mixedContent.insecureURL);
    element.appendChild(name);

    const type = createElementWithClass('td', 'affected-resource-list-item');
    type.textContent = mixedContent.resourceType;
    element.appendChild(type);

    const status = createElementWithClass('td', 'affected-resource-list-item');
    status.textContent = mixedContent.resolutionStatusText;
    element.appendChild(status);

    const initiator = createElementWithClass('td', 'affected-resource-list-item');
    initiator.textContent = extractShortPath(mixedContent.mainResourceURL);
    UI.Tooltip.Tooltip.install(initiator, mixedContent.mainResourceURL);
    element.appendChild(initiator);

    this._affectedResources.appendChild(element);
  }

  update() {
    this.clear();
    this._appendAffectedMixedContents(this._issue.mixedContents());
  }
}

class AggregatedIssueView extends UI.Widget.Widget {
  /**
   *
   * @param {!IssuesPaneImpl} parent
   * @param {!SDK.Issue.AggregatedIssue} issue
   * @param {!SDK.Issue.IssueDescription} description
   */
  constructor(parent, issue, description) {
    super(false);
    this._parent = parent;
    this._issue = issue;
    /** @type {!SDK.Issue.IssueDescription} */
    this._description = description;
    this._appendHeader();
    this._body = this._createBody();
    this._affectedResources = this._createAffectedResources(this._body);
    this._affectedCookiesView = new AffectedCookiesView(this, this._issue);
    this._affectedCookiesView.update();
    this._affectedRequestsView = new AffectedRequestsView(this, this._issue);
    this._affectedRequestsView.update();
    this._affectedMixedContentView = new AffectedMixedContentView(this, this._issue);
    this._affectedMixedContentView.update();
    this._createReadMoreLink();

    this.contentElement.classList.add('issue');
    this.contentElement.classList.add('collapsed');

    this.updateAffectedResourceVisibility();
  }

  /**
   * @param {!Element} resource
   */
  appendAffectedResource(resource) {
    this._affectedResources.appendChild(resource);
  }

  _appendHeader() {
    const header = createElementWithClass('div', 'header');
    header.addEventListener('click', this._handleClick.bind(this));
    const icon = UI.Icon.Icon.create('largeicon-breaking-change', 'icon');
    header.appendChild(icon);

    const title = createElementWithClass('div', 'title');
    title.textContent = this._description.title;
    header.appendChild(title);

    this.contentElement.appendChild(header);
  }

  updateAffectedResourceVisibility() {
    const noCookies = !this._affectedCookiesView || this._affectedCookiesView.isEmpty();
    const noRequests = !this._affectedRequestsView || this._affectedRequestsView.isEmpty();
    const noMixedContent = !this._affectedMixedContentView || this._affectedMixedContentView.isEmpty();
    const noResources = noCookies && noRequests && noMixedContent;
    this._affectedResources.style.display = noResources ? 'none' : '';
  }

  /**
   *
   * @param {!Element} body
   * @returns {!Element}
   */
  _createAffectedResources(body) {
    const wrapper = createElementWithClass('div', 'affected-resources');
    const label = createElementWithClass('div', 'affected-resources-label');
    label.textContent = ls`Affected Resources`;
    wrapper.appendChild(label);
    body.appendChild(wrapper);
    return wrapper;
  }

  _createBody() {
    const body = createElementWithClass('div', 'body');

    const kindAndCode = createElementWithClass('div', 'kind-code-line');
    const kind = createElementWithClass('span', 'issue-kind');
    kind.textContent = issueKindToString(this._description.issueKind);
    kindAndCode.appendChild(kind);
    kindAndCode.appendChild(createElementWithClass('span', 'separator'));
    const code = createElementWithClass('span', 'issue-code');
    code.textContent = this._issue.code();
    kindAndCode.appendChild(code);
    body.appendChild(kindAndCode);

    const message = this._description.message();
    body.appendChild(message);

    const bodyWrapper = createElementWithClass('div', 'body-wrapper');
    bodyWrapper.appendChild(body);
    this.contentElement.appendChild(bodyWrapper);
    return body;
  }

  _createReadMoreLink() {
    const link = UI.XLink.XLink.create(this._description.link, ls`Learn more: ${this._description.linkTitle}`, 'link');
    const linkIcon = UI.Icon.Icon.create('largeicon-link', 'link-icon');
    link.prepend(linkIcon);
    const linkWrapper = createElementWithClass('div', 'link-wrapper');
    linkWrapper.appendChild(link);
    this._body.appendChild(linkWrapper);
  }

  _handleClick() {
    this._parent.handleSelect(this);
  }

  update() {
    this._affectedCookiesView.update();
    this._affectedRequestsView.update();
    this._affectedMixedContentView.update();
    this.updateAffectedResourceVisibility();
  }

  /**
   * @param {(boolean|undefined)=} expand - Expands the issue if `true`, collapses if `false`, toggles collapse if undefined
   */
  toggle(expand) {
    if (expand === undefined) {
      this.contentElement.classList.toggle('collapsed');
    } else {
      this.contentElement.classList.toggle('collapsed', !expand);
    }
  }

  reveal() {
    this.toggle(true);
    this.contentElement.scrollIntoView(true);
  }

  /**
   * @override
   */
  detach() {
    super.detach();
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
    const description = aggregatedIssue.getDescription();
    if (!description) {
      console.warn('Could not find description for issue code:', aggregatedIssue.code());
      return;
    }
    if (!this._issueViews.has(aggregatedIssue.code())) {
      const view = new AggregatedIssueView(this, aggregatedIssue, description);
      this._issueViews.set(aggregatedIssue.code(), view);
      view.show(this.contentElement);
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
   * @param {!AggregatedIssueView} issueView
   */
  handleSelect(issueView) {
    issueView.toggle();
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
 * @param {!SDK.Issue.IssueKind} kind
 * @return {string}
 */
function issueKindToString(kind) {
  switch (kind) {
    case SDK.Issue.IssueKind.BreakingChange:
      return ls`Breaking change`;
  }
  return '';
}
