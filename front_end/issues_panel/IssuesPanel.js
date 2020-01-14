// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function createSVGIcon(className, src) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', 20);
  icon.setAttribute('height', 20);
  icon.setAttribute('viewBox', '0 0 20 20');
  icon.setAttribute('class', className);
  icon.innerHTML = src;
  return icon;
}

class IssueView extends UI.Widget {
  constructor(parent, issue) {
    super(false);
    this._parent = parent;
    this._issue = issue;

    this.contentElement.classList.add('issue');
    this.contentElement.classList.add('collapsed');

    /*
         * Create the header
         */
    const header = createElementWithClass('div', 'header');
    header.addEventListener('click', this._handleSelect.bind(this));

    const icon = createSVGIcon(
        'icon',
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M19.1666 17.5L9.99998 1.66666L0.833313 17.5H19.1666ZM10.8333 15H9.16665V13.3333H10.8333V15ZM9.16665 11.6667H10.8333V8.33332H9.16665V11.6667Z"/>');
    header.appendChild(icon);

    const title = createElementWithClass('div', 'title');
    title.innerText = this._issue.title;
    header.appendChild(title);

    const priority = createElementWithClass('div', 'priority');
    priority.innerText = this._issue.priority;
    header.appendChild(priority);

    const collapseIcon =
        createSVGIcon('collapse-icon', '<path d="M14.1666 11.6667L9.99996 7.49999L5.83329 11.6667L14.1666 11.6667Z"/>');
    header.appendChild(collapseIcon);

    this.contentElement.appendChild(header);

    /*
         * Create the body
         */
    const body = createElementWithClass('div', 'body');

    const message = createElementWithClass('div', 'message');
    message.innerText = this._issue.message;
    body.appendChild(message);

    const code = createElementWithClass('div', 'code');
    code.innerText = this._issue.code;
    body.appendChild(code);

    const link = UI.XLink.create(this._issue.link, 'Read more · ' + this._issue.linkTitle, 'link');
    body.appendChild(link);

    const linkIcon =
        createSVGIcon('link-icon', '<circle cx="10" cy="10" r="6.5"/><path d="M6 10H13M13 10L10 7M13 10L10 13"/>');
    link.prepend(linkIcon);

    const bodyWrapper = createElementWithClass('div', 'body-wrapper');
    bodyWrapper.appendChild(body);
    this.contentElement.appendChild(bodyWrapper);
  }

  _handleSelect() {
    this._parent.handleSelect(this);
  }

  toggle() {
    this.contentElement.classList.toggle('collapsed');
  }
}

export default class IssuesPanelImpl extends UI.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('issues_panel/issuesPanel.css');

    const mainTarget = SDK.targetManager.mainTarget();
    this._model = mainTarget.model(SDK.IssuesModel);
    this._model.addEventListener(SDK.IssuesModel.Events.IssueAdded, this._issueAdded.bind(this));

    this._issues = [];
    this._selectedIssue = null;
  }

  _issueAdded(event) {
    this._issues.push(event.data.issue);

    if (this._issues.length === 1) {
      this.appendIssue({
        code: 'SameSiteCookies::SameSiteNoneButNotSecure',
        title: 'A Cookie has been set with SameSite=None but without Secure',
        message:
            'In a future version of chrome, third party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man in the middle scenario.',
        priority: 'High Priority',
        link: 'https://web.dev/samesite-cookies-explained/',
        linkTitle: 'SameSite cookies explained',
      });
      this.appendIssue({
        code: 'SameSiteCookies::SameSiteNoneButNotSecure',
        title: 'A Cookie has been set with SameSite=None but without Secure',
        message:
            'In a future version of chrome, third party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man in the middle scenario.',
        priority: 'High Priority',
        link: 'https://web.dev/samesite-cookies-explained/',
        linkTitle: 'SameSite cookies explained',
      });
      this.appendIssue({
        code: 'SameSiteCookies::SameSiteNoneButNotSecure',
        title: 'A Cookie has been set with SameSite=None but without Secure',
        message:
            'In a future version of chrome, third party cookies will only be sent when marked as SameSite=None and Secure to prevent them from being accessed in a man in the middle scenario.',
        priority: 'High Priority',
        link: 'https://web.dev/samesite-cookies-explained/',
        linkTitle: 'SameSite cookies explained',
      });
    }
  }

  appendIssue(issue) {
    const issueView = new IssueView(this, issue);
    issueView.show(this.contentElement);
  }

  handleSelect(issue) {
    issue.toggle();
    if (!this._selectedIssue) {
      this._selectedIssue = issue;
    } else if (this._selectedIssue === issue) {
      this._selectedIssue = null;
    } else {
      this._selectedIssue.toggle();
      this._selectedIssue = issue;
    }
  }

  wasShown() {
    if (this._started) {
      return;
    }

    this._started = true;
  }
}


/* Legacy exported object */
self.IssuesPanel = self.IssuesPanel || {};

/* Legacy exported object */
IssuesPanel = IssuesPanel || {};

/**
 * @constructor
 */
IssuesPanel.IssuesPanel = IssuesPanelImpl;
