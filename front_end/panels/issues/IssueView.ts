// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as IssueCounter from '../../ui/components/issue_counter/issue_counter.js';
import * as MarkdownView from '../../ui/components/markdown_view/markdown_view.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ElementsComponents from '../elements/components/components.js';
import * as Network from '../network/network.js';

import {AffectedDirectivesView} from './AffectedDirectivesView.js';
import {AffectedBlockedByResponseView} from './AffectedBlockedByResponseView.js';
import {AffectedCookiesView} from './AffectedCookiesView.js';
import {AffectedDocumentsInQuirksModeView} from './AffectedDocumentsInQuirksModeView.js';
import {AffectedElementsView} from './AffectedElementsView.js';
import {AffectedElementsWithLowContrastView} from './AffectedElementsWithLowContrastView.js';
import {AffectedHeavyAdView} from './AffectedHeavyAdView.js';
import {AffectedItem, AffectedResourcesView, extractShortPath} from './AffectedResourcesView.js';
import {AffectedSharedArrayBufferIssueDetailsView} from './AffectedSharedArrayBufferIssueDetailsView.js';
import {AffectedTrustedWebActivityIssueDetailsView} from './AffectedTrustedWebActivityIssueDetailsView.js';
import {CorsIssueDetailsView} from './CorsIssueDetailsView.js';

import type {AggregatedIssue} from './IssueAggregator.js';

const UIStrings = {
  /**
  *@description Noun, singular. Label for a column or field containing the name of an entity.
  */
  name: 'Name',
  /**
  *@description The kind of resolution for a mixed content issue
  */
  blocked: 'blocked',
  /**
  *@description Label for a type of issue that can appear in the Issues view. Noun for singular or plural number of network requests.
  */
  nRequests: '{n, plural, =1 {# request} other {# requests}}',
  /**
  *@description Singular or Plural label for number of affected sources (consisting of (source) file name + line number) in issue view
  */
  nSources: '{n, plural, =1 {# source} other {# sources}}',
  /**
  *@description Label for singular or plural number of affected resources in issue view
  */
  nResources: '{n, plural, =1 {# resource} other {# resources}}',
  /**
  *@description Label for mixed content issue's restriction status
  */
  restrictionStatus: 'Restriction Status',
  /**
  * @description When there is a Heavy Ad, the browser can choose to deal with it in different ways.
  * This string indicates that the ad was only warned, and not removed.
  */
  warned: 'Warned',
  /**
  *@description Header for the section listing affected resources
  */
  affectedResources: 'Affected Resources',
  /**
  *@description Title for a link to further information in issue view
  *@example {SameSite Cookies Explained} PH1
  */
  learnMoreS: 'Learn more: {PH1}',
  /**
 *@description The kind of resolution for a mixed content issue
 */
  automaticallyUpgraded: 'automatically upgraded',
};
const str_ = i18n.i18n.registerUIStrings('panels/issues/IssueView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class AffectedRequestsView extends AffectedResourcesView {
  _issue: IssuesManager.Issue.Issue;
  constructor(parent: IssueView, issue: IssuesManager.Issue.Issue) {
    super(parent);
    this._issue = issue;
  }

  _appendAffectedRequests(affectedRequests: Iterable<Protocol.Audits.AffectedRequest>): void {
    let count = 0;
    for (const affectedRequest of affectedRequests) {
      for (const request of this.resolveRequestId(affectedRequest.requestId)) {
        count++;
        this._appendNetworkRequest(request);
      }
    }
    this.updateAffectedResourceCount(count);
  }

  protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString {
    return i18nString(UIStrings.nRequests, {n: count});
  }

  _appendNetworkRequest(request: SDK.NetworkRequest.NetworkRequest): void {
    const nameText = Platform.StringUtilities.trimMiddle(request.name(), 100);
    const nameElement = document.createElement('td');
    const tab = issueTypeToNetworkHeaderMap.get(this._issue.getCategory()) || Network.NetworkItemView.Tabs.Headers;
    nameElement.appendChild(UI.UIUtils.createTextButton(nameText, () => {
      Host.userMetrics.issuesPanelResourceOpened(this._issue.getCategory(), AffectedItem.Request);
      Network.NetworkPanel.NetworkPanel.selectAndShowRequest(request, tab);
    }, 'link-style devtools-link'));
    const element = document.createElement('tr');
    element.classList.add('affected-resource-request');
    element.appendChild(nameElement);
    this.affectedResources.appendChild(element);
  }

  update(): void {
    this.clear();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const unused of this._issue.getBlockedByResponseDetails()) {
      // If the issue has blockedByResponseDetails, the corresponding AffectedBlockedByResponseView
      // will take care of displaying the request.
      this.updateAffectedResourceCount(0);
      return;
    }
    this._appendAffectedRequests(this._issue.requests());
  }
}

class AffectedSourcesView extends AffectedResourcesView {
  _issue: IssuesManager.Issue.Issue;
  constructor(parent: IssueView, issue: IssuesManager.Issue.Issue) {
    super(parent);
    this._issue = issue;
  }

  _appendAffectedSources(affectedSources: Iterable<Protocol.Audits.SourceCodeLocation>): void {
    let count = 0;
    for (const source of affectedSources) {
      this._appendAffectedSource(source);
      count++;
    }
    this.updateAffectedResourceCount(count);
  }

  protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString {
    return i18nString(UIStrings.nSources, {n: count});
  }

  _appendAffectedSource({url, lineNumber, columnNumber}: Protocol.Audits.SourceCodeLocation): void {
    const cellElement = document.createElement('td');
    // TODO(chromium:1072331): Check feasibility of plumping through scriptId for `linkifyScriptLocation`
    //                         to support source maps and formatted scripts.
    const linkifierURLOptions = ({columnNumber, lineNumber, tabStop: true} as Components.Linkifier.LinkifyURLOptions);
    // An element created with linkifyURL can subscribe to the events
    // 'click' neither 'keydown' if that key is the 'Enter' key.
    // Also, this element has a context menu, so we should be able to
    // track when the user use the context menu too.
    // TODO(crbug.com/1108503): Add some mechanism to be able to add telemetry to this element.
    const anchorElement = Components.Linkifier.Linkifier.linkifyURL(url, linkifierURLOptions);
    cellElement.appendChild(anchorElement);
    const rowElement = document.createElement('tr');
    rowElement.classList.add('affected-resource-source');
    rowElement.appendChild(cellElement);
    this.affectedResources.appendChild(rowElement);
  }

  update(): void {
    this.clear();
    this._appendAffectedSources(this._issue.sources());
  }
}

const issueTypeToNetworkHeaderMap = new Map<IssuesManager.Issue.IssueCategory, Network.NetworkItemView.Tabs>([
  [IssuesManager.Issue.IssueCategory.SameSiteCookie, Network.NetworkItemView.Tabs.Cookies],
  [IssuesManager.Issue.IssueCategory.CrossOriginEmbedderPolicy, Network.NetworkItemView.Tabs.Headers],
  [IssuesManager.Issue.IssueCategory.MixedContent, Network.NetworkItemView.Tabs.Headers],
]);

class AffectedMixedContentView extends AffectedResourcesView {
  _issue: AggregatedIssue;
  constructor(parent: IssueView, issue: AggregatedIssue) {
    super(parent);
    this._issue = issue;
  }

  _appendAffectedMixedContentDetails(mixedContentIssues: Iterable<IssuesManager.MixedContentIssue.MixedContentIssue>):
      void {
    const header = document.createElement('tr');
    this.appendColumnTitle(header, i18nString(UIStrings.name));
    this.appendColumnTitle(header, i18nString(UIStrings.restrictionStatus));

    this.affectedResources.appendChild(header);

    let count = 0;
    for (const issue of mixedContentIssues) {
      const details = issue.getDetails();
      if (details.request) {
        this.resolveRequestId(details.request.requestId).forEach(networkRequest => {
          this.appendAffectedMixedContent(details, networkRequest);
          count++;
        });
      } else {
        this.appendAffectedMixedContent(details);
        count++;
      }
    }
    this.updateAffectedResourceCount(count);
  }

  protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString {
    return i18nString(UIStrings.nResources, {n: count});
  }

  appendAffectedMixedContent(
      mixedContent: Protocol.Audits.MixedContentIssueDetails,
      maybeRequest: SDK.NetworkRequest.NetworkRequest|null = null): void {
    const element = document.createElement('tr');
    element.classList.add('affected-resource-mixed-content');
    const filename = extractShortPath(mixedContent.insecureURL);

    const name = document.createElement('td');
    if (maybeRequest) {
      const request = maybeRequest;  // re-assignment to make type checker happy
      const tab = issueTypeToNetworkHeaderMap.get(this._issue.getCategory()) || Network.NetworkItemView.Tabs.Headers;
      name.appendChild(UI.UIUtils.createTextButton(filename, () => {
        Host.userMetrics.issuesPanelResourceOpened(this._issue.getCategory(), AffectedItem.Request);
        Network.NetworkPanel.NetworkPanel.selectAndShowRequest(request, tab);
      }, 'link-style devtools-link'));
    } else {
      name.classList.add('affected-resource-mixed-content-info');
      name.textContent = filename;
    }
    UI.Tooltip.Tooltip.install(name, mixedContent.insecureURL);
    element.appendChild(name);

    const status = document.createElement('td');
    status.classList.add('affected-resource-mixed-content-info');
    status.textContent = AffectedMixedContentView.translateStatus(mixedContent.resolutionStatus);
    element.appendChild(status);

    this.affectedResources.appendChild(element);
  }

  private static translateStatus(resolutionStatus: Protocol.Audits.MixedContentResolutionStatus):
      Platform.UIString.LocalizedString {
    switch (resolutionStatus) {
      case Protocol.Audits.MixedContentResolutionStatus.MixedContentBlocked:
        return i18nString(UIStrings.blocked);
      case Protocol.Audits.MixedContentResolutionStatus.MixedContentAutomaticallyUpgraded:
        return i18nString(UIStrings.automaticallyUpgraded);
      case Protocol.Audits.MixedContentResolutionStatus.MixedContentWarning:
        return i18nString(UIStrings.warned);
    }
  }

  update(): void {
    this.clear();
    this._appendAffectedMixedContentDetails(this._issue.getMixedContentIssues());
  }
}

export class IssueView extends UI.TreeOutline.TreeElement {
  _parent: UI.Widget.VBox;
  _issue: AggregatedIssue;
  _description: IssuesManager.MarkdownIssueDescription.IssueDescription;
  toggleOnClick: boolean;
  affectedResources: UI.TreeOutline.TreeElement;
  _affectedResourceViews: AffectedResourcesView[];
  _aggregatedIssuesCount: HTMLElement|null;
  _hasBeenExpandedBefore: boolean;
  private throttle: Common.Throttler.Throttler;
  private needsUpdateOnExpand = true;

  constructor(
      parent: UI.Widget.VBox, issue: AggregatedIssue,
      description: IssuesManager.MarkdownIssueDescription.IssueDescription) {
    super();
    this._parent = parent;
    this._issue = issue;
    this._description = description;
    this.throttle = new Common.Throttler.Throttler(250);

    this.toggleOnClick = true;
    this.listItemElement.classList.add('issue');
    this.childrenListElement.classList.add('body');
    this.childrenListElement.classList.add(IssueView.getBodyCSSClass(this._issue.getKind()));

    this.affectedResources = this._createAffectedResources();
    this._affectedResourceViews = [
      new AffectedCookiesView(this, this._issue),
      new AffectedElementsView(this, this._issue),
      new AffectedRequestsView(this, this._issue),
      new AffectedMixedContentView(this, this._issue),
      new AffectedSourcesView(this, this._issue),
      new AffectedHeavyAdView(this, this._issue),
      new AffectedDirectivesView(this, this._issue),
      new AffectedBlockedByResponseView(this, this._issue),
      new AffectedSharedArrayBufferIssueDetailsView(this, this._issue),
      new AffectedElementsWithLowContrastView(this, this._issue),
      new AffectedTrustedWebActivityIssueDetailsView(this, this._issue),
      new CorsIssueDetailsView(this, this._issue),
      new AffectedDocumentsInQuirksModeView(this, this._issue),
    ];

    this._aggregatedIssuesCount = null;
    this._hasBeenExpandedBefore = false;
  }

  private static getBodyCSSClass(issueKind: IssuesManager.Issue.IssueKind): string {
    switch (issueKind) {
      case IssuesManager.Issue.IssueKind.BreakingChange:
        return 'issue-kind-breaking-change';
      case IssuesManager.Issue.IssueKind.PageError:
        return 'issue-kind-page-error';
      case IssuesManager.Issue.IssueKind.Improvement:
        return 'issue-kind-improvement';
    }
  }

  getIssueTitle(): string {
    return this._description.title;
  }

  onattach(): void {
    this._appendHeader();
    this._createBody();
    this.appendChild(this.affectedResources);
    for (const view of this._affectedResourceViews) {
      this.appendAffectedResource(view);
      view.update();
    }

    this._createReadMoreLinks();
    this.updateAffectedResourceVisibility();
  }

  appendAffectedResource(resource: UI.TreeOutline.TreeElement): void {
    this.affectedResources.appendChild(resource);
  }

  _appendHeader(): void {
    const header = document.createElement('div');
    header.classList.add('header');
    const icon = new IconButton.Icon.Icon();
    const kind = this._issue.getKind();
    icon.data = IssueCounter.IssueCounter.getIssueKindIconData(kind);
    icon.classList.add('leading-issue-icon');
    this._aggregatedIssuesCount = (document.createElement('span') as HTMLElement);
    const countAdorner = new ElementsComponents.Adorner.Adorner();
    countAdorner.data = {
      name: 'countWrapper',
      content: this._aggregatedIssuesCount,
      category: ElementsComponents.AdornerManager.AdornerCategories.DEFAULT,
    };
    countAdorner.classList.add('aggregated-issues-count');
    this._aggregatedIssuesCount.textContent = `${this._issue.getAggregatedIssuesCount()}`;
    header.appendChild(icon);
    UI.Tooltip.Tooltip.install(icon, IssueCounter.IssueCounter.getIssueKindDescription(kind));
    header.appendChild(countAdorner);

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = this._description.title;
    header.appendChild(title);

    this.listItemElement.appendChild(header);
  }

  onexpand(): void {
    Host.userMetrics.issuesPanelIssueExpanded(this._issue.getCategory());

    if (this.needsUpdateOnExpand) {
      this.doUpdate();
    }

    if (!this._hasBeenExpandedBefore) {
      this._hasBeenExpandedBefore = true;
      for (const view of this._affectedResourceViews) {
        view.expandIfOneResource();
      }
    }
  }

  _updateAggregatedIssuesCount(): void {
    if (this._aggregatedIssuesCount) {
      this._aggregatedIssuesCount.textContent = `${this._issue.getAggregatedIssuesCount()}`;
    }
  }

  updateAffectedResourceVisibility(): void {
    const noResources = this._affectedResourceViews.every(view => view.isEmpty());
    this.affectedResources.hidden = noResources;
  }

  _createAffectedResources(): UI.TreeOutline.TreeElement {
    const wrapper = new UI.TreeOutline.TreeElement();
    wrapper.setCollapsible(false);
    wrapper.setExpandable(true);
    wrapper.expand();
    wrapper.selectable = false;
    wrapper.listItemElement.classList.add('affected-resources-label');
    wrapper.listItemElement.textContent = i18nString(UIStrings.affectedResources);
    wrapper.childrenListElement.classList.add('affected-resources');
    return wrapper;
  }

  _createBody(): void {
    const messageElement = new UI.TreeOutline.TreeElement();
    messageElement.setCollapsible(false);
    messageElement.selectable = false;
    const markdownComponent = new MarkdownView.MarkdownView.MarkdownView();
    markdownComponent.data = {tokens: this._description.markdown};
    messageElement.listItemElement.appendChild(markdownComponent);
    this.appendChild(messageElement);
  }

  _createReadMoreLinks(): void {
    const linkWrapper = new UI.TreeOutline.TreeElement();
    linkWrapper.setCollapsible(false);
    linkWrapper.listItemElement.classList.add('link-wrapper');

    const linkList = linkWrapper.listItemElement.createChild('ul', 'link-list');
    for (const description of this._description.links) {
      const link = UI.Fragment.html`<x-link class="link devtools-link" tabindex="0" href=${description.link}>${
                       i18nString(UIStrings.learnMoreS, {PH1: description.linkTitle})}</x-link>` as UI.XLink.XLink;
      const linkIcon = new IconButton.Icon.Icon();
      linkIcon.data = {iconName: 'link_icon', color: 'var(--color-link)', width: '16px', height: '16px'};
      linkIcon.classList.add('link-icon');
      link.prepend(linkIcon);
      link.addEventListener('x-link-invoke', () => {
        Host.userMetrics.issuesPanelResourceOpened(this._issue.getCategory(), AffectedItem.LearnMore);
      });

      const linkListItem = linkList.createChild('li');
      linkListItem.appendChild(link);
    }
    this.appendChild(linkWrapper);
  }

  private doUpdate(): void {
    if (this.expanded) {
      this._affectedResourceViews.forEach(view => view.update());
      this.updateAffectedResourceVisibility();
    }
    this.needsUpdateOnExpand = !this.expanded;
    this._updateAggregatedIssuesCount();
  }

  update(): void {
    this.throttle.schedule(async () => this.doUpdate());
  }

  toggle(expand?: boolean): void {
    if (expand || (expand === undefined && !this.expanded)) {
      this.expand();
    } else {
      this.collapse();
    }
  }
}
