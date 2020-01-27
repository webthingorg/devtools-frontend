// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Issue} from '../sdk/Issue.js';

function createSVGIcon(className, src) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', 20);
  icon.setAttribute('height', 20);
  icon.setAttribute('viewBox', '0 0 20 20');
  icon.setAttribute('class', className);
  icon.innerHTML = src;
  return icon;
}

/** @enum {symbol} */
export const Priority = {
  High: Symbol('PriorityHigh'),
};


const IssueDetails = {
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

    class IssueView extends UI.Widget {
      constructor(parent, issue) {
        super(false);
        this._parent = parent;
        this._issue = issue;
        this._details = IssueDetails[issue.code];


        this._issue.addEventListener(Issue.Events.Updated, this._handleIssueUpdated.bind(this));

        this.contentElement.classList.add('issue');
        this.contentElement.classList.add('collapsed');

        /*
     * Create the header
     */
        const header = createElementWithClass('div', 'header');
        header.addEventListener('click', this._handleSelect.bind(this));

        const icon = createSVGIcon('icon', `
            <mask id="path-2-inside-1" fill="white">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.21799 4.09202C3 4.51984 3 5.0799 3 6.2V11.8C3 11.9546 3 12.0985 3.00057 12.2329C3.00019 12.2386 3 12.2443 3 12.25V17.3964C3 17.6192 3.26929 17.7307 3.42678 17.5732L6.00005 14.9999C6.06466 15 6.13127 15 6.2 15H13.8C14.9201 15 15.4802 15 15.908 14.782C16.2843 14.5903 16.5903 14.2843 16.782 13.908C17 13.4802 17 12.9201 17 11.8V6.2C17 5.0799 17 4.51984 16.782 4.09202C16.5903 3.71569 16.2843 3.40973 15.908 3.21799C15.4802 3 14.9201 3 13.8 3H6.2C5.0799 3 4.51984 3 4.09202 3.21799C3.71569 3.40973 3.40973 3.71569 3.21799 4.09202Z"/>
            </mask>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.21799 4.09202C3 4.51984 3 5.0799 3 6.2V11.8C3 11.9546 3 12.0985 3.00057 12.2329C3.00019 12.2386 3 12.2443 3 12.25V17.3964C3 17.6192 3.26929 17.7307 3.42678 17.5732L6.00005 14.9999C6.06466 15 6.13127 15 6.2 15H13.8C14.9201 15 15.4802 15 15.908 14.782C16.2843 14.5903 16.5903 14.2843 16.782 13.908C17 13.4802 17 12.9201 17 11.8V6.2C17 5.0799 17 4.51984 16.782 4.09202C16.5903 3.71569 16.2843 3.40973 15.908 3.21799C15.4802 3 14.9201 3 13.8 3H6.2C5.0799 3 4.51984 3 4.09202 3.21799C3.71569 3.40973 3.40973 3.71569 3.21799 4.09202Z" fill="#F29900"/>
            <path d="M3.21799 4.09202L2.32698 3.63803L2.32698 3.63803L3.21799 4.09202ZM3.00057 12.2329L3.99831 12.3002L4.00072 12.2645L4.00056 12.2287L3.00057 12.2329ZM3.42678 17.5732L2.71967 16.8661L2.71967 16.8661L3.42678 17.5732ZM6.00005 14.9999L6.00083 13.9999L5.58616 13.9996L5.29294 14.2928L6.00005 14.9999ZM15.908 14.782L15.454 13.891H15.454L15.908 14.782ZM16.782 13.908L15.891 13.454V13.454L16.782 13.908ZM16.782 4.09202L15.891 4.54601V4.54601L16.782 4.09202ZM15.908 3.21799L15.454 4.10899L15.454 4.10899L15.908 3.21799ZM4.09202 3.21799L3.63803 2.32698L3.63803 2.32698L4.09202 3.21799ZM4 6.2C4 5.62345 4.00078 5.25117 4.02393 4.96784C4.04612 4.69617 4.0838 4.59545 4.10899 4.54601L2.32698 3.63803C2.13419 4.01641 2.06287 4.40963 2.03057 4.80497C1.99922 5.18864 2 5.65645 2 6.2H4ZM4 11.8V6.2H2V11.8H4ZM4.00056 12.2287C4 12.0968 4 11.9551 4 11.8H2C2 11.9541 2 12.1003 2.00058 12.2372L4.00056 12.2287ZM4 12.25C4 12.2667 3.99944 12.2835 3.99831 12.3002L2.00284 12.1657C2.00095 12.1937 2 12.2218 2 12.25H4ZM4 17.3964V12.25H2V17.3964H4ZM2.71967 16.8661C3.19214 16.3936 4 16.7283 4 17.3964H2C2 18.5101 3.34643 19.0678 4.13388 18.2803L2.71967 16.8661ZM5.29294 14.2928L2.71967 16.8661L4.13388 18.2803L6.70716 15.7071L5.29294 14.2928ZM6.2 14C6.1312 14 6.06498 14 6.00083 13.9999L5.99927 15.9999C6.06434 16 6.13135 16 6.2 16V14ZM13.8 14H6.2V16H13.8V14ZM15.454 13.891C15.4045 13.9162 15.3038 13.9539 15.0322 13.9761C14.7488 13.9992 14.3766 14 13.8 14V16C14.3436 16 14.8114 16.0008 15.195 15.9694C15.5904 15.9371 15.9836 15.8658 16.362 15.673L15.454 13.891ZM15.891 13.454C15.7951 13.6422 15.6422 13.7951 15.454 13.891L16.362 15.673C16.9265 15.3854 17.3854 14.9265 17.673 14.362L15.891 13.454ZM16 11.8C16 12.3766 15.9992 12.7488 15.9761 13.0322C15.9539 13.3038 15.9162 13.4045 15.891 13.454L17.673 14.362C17.8658 13.9836 17.9371 13.5904 17.9694 13.195C18.0008 12.8114 18 12.3436 18 11.8H16ZM16 6.2V11.8H18V6.2H16ZM15.891 4.54601C15.9162 4.59545 15.9539 4.69617 15.9761 4.96784C15.9992 5.25117 16 5.62345 16 6.2H18C18 5.65645 18.0008 5.18864 17.9694 4.80497C17.9371 4.40963 17.8658 4.01641 17.673 3.63803L15.891 4.54601ZM15.454 4.10899C15.6422 4.20487 15.7951 4.35785 15.891 4.54601L17.673 3.63803C17.3854 3.07354 16.9265 2.6146 16.362 2.32698L15.454 4.10899ZM13.8 4C14.3766 4 14.7488 4.00078 15.0322 4.02393C15.3038 4.04612 15.4045 4.0838 15.454 4.10899L16.362 2.32698C15.9836 2.13419 15.5904 2.06287 15.195 2.03057C14.8114 1.99922 14.3436 2 13.8 2V4ZM6.2 4H13.8V2H6.2V4ZM4.54601 4.10899C4.59545 4.0838 4.69617 4.04612 4.96784 4.02393C5.25117 4.00078 5.62345 4 6.2 4V2C5.65645 2 5.18864 1.99922 4.80497 2.03057C4.40963 2.06287 4.01641 2.13419 3.63803 2.32698L4.54601 4.10899ZM4.10899 4.54601C4.20487 4.35785 4.35785 4.20487 4.54601 4.10899L3.63803 2.32698C3.07354 2.6146 2.6146 3.07354 2.32698 3.63803L4.10899 4.54601Z" fill="url(#paint0_linear)" fill-opacity="0.12" mask="url(#path-2-inside-1)"/>
            <path d="M3.21799 4.09202L2.32698 3.63803L2.32698 3.63803L3.21799 4.09202ZM3.00057 12.2329L3.99831 12.3002L4.00072 12.2645L4.00056 12.2287L3.00057 12.2329ZM3.42678 17.5732L2.71967 16.8661L2.71967 16.8661L3.42678 17.5732ZM6.00005 14.9999L6.00083 13.9999L5.58616 13.9996L5.29294 14.2928L6.00005 14.9999ZM15.908 14.782L15.454 13.891H15.454L15.908 14.782ZM16.782 13.908L15.891 13.454V13.454L16.782 13.908ZM16.782 4.09202L15.891 4.54601V4.54601L16.782 4.09202ZM15.908 3.21799L15.454 4.10899L15.454 4.10899L15.908 3.21799ZM4.09202 3.21799L3.63803 2.32698L3.63803 2.32698L4.09202 3.21799ZM4 6.2C4 5.62345 4.00078 5.25117 4.02393 4.96784C4.04612 4.69617 4.0838 4.59545 4.10899 4.54601L2.32698 3.63803C2.13419 4.01641 2.06287 4.40963 2.03057 4.80497C1.99922 5.18864 2 5.65645 2 6.2H4ZM4 11.8V6.2H2V11.8H4ZM4.00056 12.2287C4 12.0968 4 11.9551 4 11.8H2C2 11.9541 2 12.1003 2.00058 12.2372L4.00056 12.2287ZM4 12.25C4 12.2667 3.99944 12.2835 3.99831 12.3002L2.00284 12.1657C2.00095 12.1937 2 12.2218 2 12.25H4ZM4 17.3964V12.25H2V17.3964H4ZM2.71967 16.8661C3.19214 16.3936 4 16.7283 4 17.3964H2C2 18.5101 3.34643 19.0678 4.13388 18.2803L2.71967 16.8661ZM5.29294 14.2928L2.71967 16.8661L4.13388 18.2803L6.70716 15.7071L5.29294 14.2928ZM6.2 14C6.1312 14 6.06498 14 6.00083 13.9999L5.99927 15.9999C6.06434 16 6.13135 16 6.2 16V14ZM13.8 14H6.2V16H13.8V14ZM15.454 13.891C15.4045 13.9162 15.3038 13.9539 15.0322 13.9761C14.7488 13.9992 14.3766 14 13.8 14V16C14.3436 16 14.8114 16.0008 15.195 15.9694C15.5904 15.9371 15.9836 15.8658 16.362 15.673L15.454 13.891ZM15.891 13.454C15.7951 13.6422 15.6422 13.7951 15.454 13.891L16.362 15.673C16.9265 15.3854 17.3854 14.9265 17.673 14.362L15.891 13.454ZM16 11.8C16 12.3766 15.9992 12.7488 15.9761 13.0322C15.9539 13.3038 15.9162 13.4045 15.891 13.454L17.673 14.362C17.8658 13.9836 17.9371 13.5904 17.9694 13.195C18.0008 12.8114 18 12.3436 18 11.8H16ZM16 6.2V11.8H18V6.2H16ZM15.891 4.54601C15.9162 4.59545 15.9539 4.69617 15.9761 4.96784C15.9992 5.25117 16 5.62345 16 6.2H18C18 5.65645 18.0008 5.18864 17.9694 4.80497C17.9371 4.40963 17.8658 4.01641 17.673 3.63803L15.891 4.54601ZM15.454 4.10899C15.6422 4.20487 15.7951 4.35785 15.891 4.54601L17.673 3.63803C17.3854 3.07354 16.9265 2.6146 16.362 2.32698L15.454 4.10899ZM13.8 4C14.3766 4 14.7488 4.00078 15.0322 4.02393C15.3038 4.04612 15.4045 4.0838 15.454 4.10899L16.362 2.32698C15.9836 2.13419 15.5904 2.06287 15.195 2.03057C14.8114 1.99922 14.3436 2 13.8 2V4ZM6.2 4H13.8V2H6.2V4ZM4.54601 4.10899C4.59545 4.0838 4.69617 4.04612 4.96784 4.02393C5.25117 4.00078 5.62345 4 6.2 4V2C5.65645 2 5.18864 1.99922 4.80497 2.03057C4.40963 2.06287 4.01641 2.13419 3.63803 2.32698L4.54601 4.10899ZM4.10899 4.54601C4.20487 4.35785 4.35785 4.20487 4.54601 4.10899L3.63803 2.32698C3.07354 2.6146 2.6146 3.07354 2.32698 3.63803L4.10899 4.54601Z" fill="url(#paint1_linear)" fill-opacity="0.24" mask="url(#path-2-inside-1)"/>
            <mask id="path-4-outside-2" maskUnits="userSpaceOnUse" x="8" y="4" width="4" height="10" fill="black">
            <rect fill="white" x="8" y="4" width="4" height="10"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 5H9V9.5H11V5ZM11 11H9V13H11V11Z"/>
            </mask>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 5H9V9.5H11V5ZM11 11H9V13H11V11Z" fill="white"/>
            <path d="M9 5V4.5H8.5V5H9ZM11 5H11.5V4.5H11V5ZM9 9.5H8.5V10H9V9.5ZM11 9.5V10H11.5V9.5H11ZM9 11V10.5H8.5V11H9ZM11 11H11.5V10.5H11V11ZM9 13H8.5V13.5H9V13ZM11 13V13.5H11.5V13H11ZM9 5.5H11V4.5H9V5.5ZM9.5 9.5V5H8.5V9.5H9.5ZM11 9H9V10H11V9ZM10.5 5V9.5H11.5V5H10.5ZM9 11.5H11V10.5H9V11.5ZM9.5 13V11H8.5V13H9.5ZM11 12.5H9V13.5H11V12.5ZM10.5 11V13H11.5V11H10.5Z" fill="black" fill-opacity="0.12" mask="url(#path-4-outside-2)"/>
            <defs>
            <linearGradient id="paint0_linear" x1="10" y1="3" x2="10" y2="17.6469" gradientUnits="userSpaceOnUse">
            <stop stop-opacity="0"/>
            <stop offset="1"/>
            </linearGradient>
            <linearGradient id="paint1_linear" x1="10" y1="3" x2="10" y2="17.6469" gradientUnits="userSpaceOnUse">
            <stop stop-color="white"/>
            <stop offset="0.494792" stop-color="white" stop-opacity="0"/>
            <stop offset="1" stop-color="white" stop-opacity="0"/>
            </linearGradient>
            </defs>
            `);
        header.appendChild(icon);

        const title = createElementWithClass('div', 'title');
        title.innerText = this._details.title;
        header.appendChild(title);

        const priority = createElementWithClass('div', 'priority');
        switch (this._details.priority) {
          case Priority.High:
            priority.innerText = ls`High Priority`;
            break;
          default:
            console.warn('Unknown issue priority', this._details.priority);
        }
        header.appendChild(priority);

        const collapseIcon = createSVGIcon(
            'collapse-icon', '<path d="M14.1666 11.6667L9.99996 7.49999L5.83329 11.6667L14.1666 11.6667Z"/>');
        header.appendChild(collapseIcon);

        this.contentElement.appendChild(header);

        /*
     * Create the body
     */
        const body = createElementWithClass('div', 'body');

        const message = createElementWithClass('div', 'message');
        message.innerText = this._details.message;
        body.appendChild(message);

        const code = createElementWithClass('div', 'code');
        code.innerText = this._issue.code;
        body.appendChild(code);

        // const resources = this.createResourceElement();
        // body.appendChild(resources);

        const link = UI.XLink.create(this._details.link, 'Read more · ' + this._details.linkTitle, 'link');
        body.appendChild(link);

        const linkIcon =
            createSVGIcon('link-icon', '<circle cx="10" cy="10" r="6.5"/><path d="M6 10H13M13 10L10 7M13 10L10 13"/>');
        link.prepend(linkIcon);

        const bodyWrapper = createElementWithClass('div', 'body-wrapper');
        bodyWrapper.appendChild(body);
        this.contentElement.appendChild(bodyWrapper);
      }

      createResourceElement() {
        const wrapper = createElementWithClass('div', 'resources');

        const label = createElementWithClass('div', 'label');
        label.innerText = ls`Affected Resources`;
        wrapper.appendChild(label);

        this._wrapper = wrapper;

        this.renderResource(this._issue.resources);


        return wrapper;
      }

      renderResource(_resources) {
        this._wrapper.innerHTML = '';
        const resource = createElementWithClass('div', 'resource');

        const resourceIcon = createSVGIcon('resource-icon', '<path d="M5 9L0 0L10 0L5 9Z" fill="#80868B"/>');
        resource.appendChild(resourceIcon);

        const resourceLabel = createElementWithClass('div', 'resource-label');
        resourceLabel.innerText = _resources.length + ' cookies';
        resource.appendChild(resourceLabel);

        const resources = createElementWithClass('div', 'resources');
        for (const cookie of _resources) {
          const tmp = createElementWithClass('div', 'resource.cookie');
          tmp.innerText = cookie;
          resources.appendChild(tmp);
        }

        resource.appendChild(resources);
        this._wrapper.appendChild(resource);
      }

      _handleIssueUpdated() {
        const urls = new Set();
        for (const resource of this._issue.resources) {
          const m = resource.match(/(\w+):(.+)/);
          if (!m) {
            continue;
          }

          const [, type, id] = m;
          if (type !== 'url') {
            continue;
          }

          urls.add(id);
        }

        this.renderResource(Array.from(urls.values()));
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

        this._issues = new Map();
        this._issueViews = new Map();

        this._selectedIssue = null;
      }

      _issueAdded(event) {
        if (!(event.data.code in IssueDetails)) {
          return;
        }

        const view = new IssueView(this, event.data);
        view.show(this.contentElement);
        view.toggle();
        this._issueViews.set(event.data.code, view);
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
