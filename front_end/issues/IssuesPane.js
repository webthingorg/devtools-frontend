// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Events} from '../sdk/Issue.js';

class IssueView extends UI.Widget {
  constructor(parent, issue) {
    super(false);
    this._parent = parent;
    this._issue = issue;
    this._details = issueDetails[issue.code];
    this._affectedCookies = null;
    this._affectedCookiesLabel = null;
    this._affectedResources = null;

    this.contentElement.classList.add('issue');

    this.appendHeader();
    this.appendBody();

    this._issue.addEventListener(Events.InstanceAdded, this._handleInstanceAdded.bind(this));
    this._issue.addEventListener(Events.CookieAdded, this._handleCookieAdded.bind(this));
  }

  appendHeader() {
    const header = createElementWithClass('div', 'header');
    header.addEventListener('click', this._handleSelect.bind(this));
    const icon = UI.Icon.create('largeicon-breaking-change', 'icon');
    header.appendChild(icon);

    const title = createElementWithClass('div', 'title');
    title.textContent = this._details.title;
    header.appendChild(title);

    const priority = createElementWithClass('div', 'priority');
    switch (this._details.priority) {
      case Priority.High:
        priority.textContent = ls`High Priority`;
        break;
      default:
        console.warn('Unknown issue priority', this._details.priority);
    }
    header.appendChild(priority);
    this.contentElement.appendChild(header);
  }

  appendBody() {
    const body = createElementWithClass('div', 'body');

    const message = createElementWithClass('div', 'message');
    message.textContent = this._details.message;
    body.appendChild(message);

    const code = createElementWithClass('div', 'code');
    code.textContent = this._issue.code;
    body.appendChild(code);

    const link = UI.XLink.create(this._details.link, 'Read more · ' + this._details.linkTitle, 'link');
    body.appendChild(link);

    const linkIcon = UI.Icon.create('largeicon-link', 'link-icon');
    link.prepend(linkIcon);

    this.appendAffectedResources(body);

    const bodyWrapper = createElementWithClass('div', 'body-wrapper');
    bodyWrapper.appendChild(body);
    this.contentElement.appendChild(bodyWrapper);
  }

  appendAffectedResources(body) {
    const wrapper = createElementWithClass('div', 'affected-resources');
    const label = createElementWithClass('div', 'affected-resources-label');
    label.textContent = 'Affected Resources';
    wrapper.appendChild(label);
    this._affectedResources = wrapper;

    this.appendAffectedCookies();

    body.appendChild(wrapper);
  }


  _updateAffectedCookiesCounter() {
    this._affectedCookiesLabel.textContent = ls`${this._issue.numberOfCookies()} cookies`;
  }

  appendAffectedCookies() {
    const wrapper = createElementWithClass('div', 'affected-cookies');
    const label = createElementWithClass('div', 'affected-cookies-label');
    label.addEventListener('click', () => {
      wrapper.classList.toggle('expanded');
    });
    wrapper.appendChild(label);
    this._affectedCookiesLabel = label;
    this._updateAffectedCookiesCounter();

    const body2 = createElementWithClass('div', 'affected-cookies-wrapper');
    const body = createElementWithClass('table', 'affected-cookies-cookies');
    const header = createElementWithClass('tr');

    const name = createElementWithClass('td', 'affected-cookies-header');
    name.textContent = 'Name';
    header.appendChild(name);

    const info = createElementWithClass('td', 'affected-cookies-header affected-cookies-header-info');
    // Prepend a space to align them better with cookie domains starting with a "."
    info.textContent = '\u2009Context';
    header.appendChild(info);

    body.appendChild(header);
    body2.appendChild(body);
    wrapper.appendChild(body2);
    this._affectedCookies = body;

    for (const instance of this._issue.instances()) {
      this.appendAffectedCookie(instance.cookie);
    }

    this._affectedResources.appendChild(wrapper);
  }

  appendAffectedCookie(cookie) {
    this._updateAffectedCookiesCounter();
    const element = createElementWithClass('tr', 'affected-cookies-cookie');
    const name = createElementWithClass('td', '');
    name.appendChild(Components.Linkifier.linkifyRevealable(new SDK.Cookie(cookie.name, cookie.value), cookie.name));
    const info = createElementWithClass('td', 'affected-cookies-cookie-info');

    // Prepend a space for all domains not starting with a "." to align them better.
    info.textContent = (cookie.domain[0] !== '.' ? '\u2008' : '') + cookie.domain + cookie.path;

    element.appendChild(name);
    element.appendChild(info);
    this._affectedCookies.appendChild(element);
  }

  _handleCookieAdded(event) {
    this.appendAffectedCookie(event.data);
  }

  _handleInstanceAdded(event) {
  }

  _handleSelect() {
    this._parent.handleSelect(this);
  }

  toggle() {
    this.contentElement.classList.toggle('collapsed');
  }
}

export class IssuesPaneImpl extends UI.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues/issuesPane.css');

    const mainTarget = SDK.targetManager.mainTarget();
    this._model = mainTarget.model(SDK.IssuesModel);
    this._model.addEventListener(SDK.IssuesModel.Events.IssueAdded, this._issueAdded.bind(this));
    this._model.ensureEnabled();

    this._issues = new Map();
    this._issueViews = new Map();

    this._selectedIssue = null;

    const issues = this._model.issues();
    for (const issue of issues) {
      this._issueAdded(issue);
    }
  }

  _issueAdded(event) {
    if (!(event.data.code in issueDetails)) {
      console.warn('Received issue with unknow code:', event.data.code);
      return;
    }

    const view = new IssueView(this, event.data);
    view.show(this.contentElement);
    this._issueViews.set(event.data.code, view);
  }

  handleSelect(issue) {
    issue.toggle();
  }
}

/** @enum {symbol} */
export const Priority = {
  High: Symbol('PriorityHigh'),
};

export default IssuesPaneImpl;

const issueDetails = {
  'SameSiteCookies::SameSiteNoneWithoutSecure':
      {title: ls`A Cookie has been set with SameSite=None but without Secure`, message: ls
    `In a future version of chrome, third party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man in the middle scenario.`,
    priority: Priority.High,
    link: ls`https://web.dev/samesite-cookies-explained/`,
    linkTitle: ls`SameSite cookies explained`,
  },
  'SameSiteCookies::SameSiteNoneMissingForThirdParty': {
    title: ls`A Cookie in a third party context has been set without SameSite=None`,
    message: ls
    `In a future version of chrome, third party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man in the middle szenario.`,
    priority: Priority.High,
    link: ls`https://web.dev/samesite-cookies-explained/`,
    linkTitle: ls`SameSite cookies explained`,
  },
};
