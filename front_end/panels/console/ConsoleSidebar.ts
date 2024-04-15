// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import type * as TextUtils from '../../models/text_utils/text_utils.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

import {ConsoleFilter, FilterType, type LevelsMask} from './ConsoleFilter.js';
import consoleSidebarStyles from './consoleSidebar.css.js';
import {type ConsoleViewMessage} from './ConsoleViewMessage.js';

const {render, html, Directives: {ref}} = LitHtml;

const UIStrings = {
  /**
   * @description Filter name in Console Sidebar of the Console panel. This is shown when we fail to
   * parse a URL when trying to display console messages from each URL separately. This might be
   * because the console message does not come from any particular URL. This should be translated as
   * a term that indicates 'not one of the other URLs listed here'.
   */
  other: '<other>',
  /**
   *@description Text in Console Sidebar of the Console panel to show how many user messages exist.
   */
  dUserMessages: '{n, plural, =0 {No user messages} =1 {# user message} other {# user messages}}',
  /**
   *@description Text in Console Sidebar of the Console panel to show how many messages exist.
   */
  dMessages: '{n, plural, =0 {No messages} =1 {# message} other {# messages}}',
  /**
   *@description Text in Console Sidebar of the Console panel to show how many errors exist.
   */
  dErrors: '{n, plural, =0 {No errors} =1 {# error} other {# errors}}',
  /**
   *@description Text in Console Sidebar of the Console panel to show how many warnings exist.
   */
  dWarnings: '{n, plural, =0 {No warnings} =1 {# warning} other {# warnings}}',
  /**
   *@description Text in Console Sidebar of the Console panel to show how many info messages exist.
   */
  dInfo: '{n, plural, =0 {No info} =1 {# info} other {# info}}',
  /**
   *@description Text in Console Sidebar of the Console panel to show how many verbose messages exist.
   */
  dVerbose: '{n, plural, =0 {No verbose} =1 {# verbose} other {# verbose}}',
};
const str_ = i18n.i18n.registerUIStrings('panels/console/ConsoleSidebar.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

type Constructor<T, Args extends unknown[]> = {
  new (...args: Args): T,
};

function typedRef<T extends Element, Args extends unknown[]>(
  type: Constructor<T, Args>, callback: (_: T) => any): ReturnType<typeof ref> {
    return ref((e?: Element) => {
      if (!(e instanceof type)) {
        throw new Error(`Expected an element of type ${type.name} but got ${e?.constructor?.name}`);
      }
      callback(e as T);
    });
}

export class ConsoleSidebar extends Common.ObjectWrapper.eventMixin<EventTypes, typeof UI.Widget.VBox>(UI.Widget.VBox) {
  private tree!: UI.TreeOutline.TreeOutline<URLGroupTreeElement|FilterTreeElement>;
  private selectedTreeElement: UI.TreeOutline.TreeElement|null;
  private readonly treeElements: FilterTreeElement[];

  constructor() {
    super(true);
    this.setMinimumSize(125, 0);

    this.contentElement.setAttribute('jslog', `${VisualLogging.pane('sidebar').track({resize: true})}`);
    this.selectedTreeElement = null;
    this.treeElements = [];
    const selectedFilterSetting =
        Common.Settings.Settings.instance().createSetting<string|null>('console.sidebar-selected-filter', null);

    render(html`
        <devtools-tree-outline-legacy
          @elementSelected="${this.selectionChanged}"
          ${typedRef(UI.TreeOutline.TreeOutlineCustomElement, (tree) => {
            this.tree = tree.treeOutline;
            tree.registerCSSFiles([consoleSidebarStyles]);
        })} .itemRenderer=${(node: URLGroupTreeElement|FilterTreeElement): LitHtml.TemplateResult => {
          if (node instanceof URLGroupTreeElement) {
            return html`
              <div class="selection fill"></div>
              <div class="leading-icons icons-container"><devtools-icon class="document"></devtools-icon></div>
              <span class="tree-element-title">${node.filter().name}</span>
              <span class="count">${node.messageCount}</span>`;
          }
          return html`
            <div class="selection fill"></div>
            <div class="leading-icons icons-container">${node.icon}</div>
            <span class="tree-element-title">${i18nString(node.uiStringForFilterCount, {n: node.messageCount})}</span>`;
        }}>
        </devtools-tree-outline-legacy>
      `, this.contentElement, { host: this });
        

    const consoleAPIParsedFilters = [{
      key: FilterType.Source,
      text: SDK.ConsoleModel.FrontendMessageSource.ConsoleAPI,
      negative: false,
      regex: undefined,
    }];
    this.appendGroup(
        GroupName.All, [], ConsoleFilter.allLevelsFilterValue(), IconButton.Icon.create('list'), selectedFilterSetting);
    this.appendGroup(
        GroupName.ConsoleAPI, consoleAPIParsedFilters, ConsoleFilter.allLevelsFilterValue(),
        IconButton.Icon.create('profile'), selectedFilterSetting);
    this.appendGroup(
        GroupName.Error, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Error),
        IconButton.Icon.create('cross-circle'), selectedFilterSetting);
    this.appendGroup(
        GroupName.Warning, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Warning),
        IconButton.Icon.create('warning'), selectedFilterSetting);
    this.appendGroup(
        GroupName.Info, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Info),
        IconButton.Icon.create('info'), selectedFilterSetting);
    this.appendGroup(
        GroupName.Verbose, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Verbose),
        IconButton.Icon.create('bug'), selectedFilterSetting);
    const selectedTreeElementName = selectedFilterSetting.get();
    const defaultTreeElement =
        this.treeElements.find(x => x.name() === selectedTreeElementName) || this.treeElements[0];
    defaultTreeElement.select();
  }

  private appendGroup(
      name: string, parsedFilters: TextUtils.TextUtils.ParsedFilter[], levelsMask: LevelsMask,
      icon: IconButton.Icon.Icon, selectedFilterSetting: Common.Settings.Setting<string|null>): void {
    const filter = new ConsoleFilter(name, parsedFilters, null, levelsMask);
    const treeElement = new FilterTreeElement(filter, icon, selectedFilterSetting);
    this.tree.appendChild(treeElement);
    this.treeElements.push(treeElement);
  }

  clear(): void {
    for (const treeElement of this.treeElements) {
      treeElement.clear();
    }
  }

  onMessageAdded(viewMessage: ConsoleViewMessage): void {
    for (const treeElement of this.treeElements) {
      treeElement.onMessageAdded(viewMessage);
    }
  }

  shouldBeVisible(viewMessage: ConsoleViewMessage): boolean {
    if (this.selectedTreeElement instanceof ConsoleSidebarTreeElement) {
      return this.selectedTreeElement.filter().shouldBeVisible(viewMessage);
    }
    return true;
  }

  private selectionChanged(event: CustomEvent): void {
    this.selectedTreeElement = event.detail;
    this.dispatchEventToListeners(Events.FilterSelected);
  }
}

export const enum Events {
  FilterSelected = 'FilterSelected',
}

export type EventTypes = {
  [Events.FilterSelected]: void,
};

class ConsoleSidebarTreeElement extends UI.TreeOutline.TreeElement {
  protected filterInternal: ConsoleFilter;

  constructor(filter: ConsoleFilter) {
    super();
    this.filterInternal = filter;
  }

  filter(): ConsoleFilter {
    return this.filterInternal;
  }
}

export class URLGroupTreeElement extends ConsoleSidebarTreeElement {
  messageCount: number;

  constructor(filter: ConsoleFilter) {
    super(filter);
    this.messageCount = 0;
  }

  incrementAndUpdateCounter(): void {
    this.messageCount++;
    this.rerenderRequired();
  }
}

const enum GroupName {
  ConsoleAPI = 'user message',
  All = 'message',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Verbose = 'verbose',
}

/**
 * Maps the GroupName for a filter to the UIString used to render messages.
 * Stored here so we only construct it once at runtime, rather than everytime we
 * construct a filter or get a new message.
 */
const stringForFilterSidebarItemMap = new Map<GroupName, string>([
  [GroupName.ConsoleAPI, UIStrings.dUserMessages],
  [GroupName.All, UIStrings.dMessages],
  [GroupName.Error, UIStrings.dErrors],
  [GroupName.Warning, UIStrings.dWarnings],
  [GroupName.Info, UIStrings.dInfo],
  [GroupName.Verbose, UIStrings.dVerbose],
]);

export class FilterTreeElement extends ConsoleSidebarTreeElement {
  private readonly selectedFilterSetting: Common.Settings.Setting<string|null>;
  private readonly urlTreeElements: Map<string|null, URLGroupTreeElement>;

  messageCount: number;
  readonly uiStringForFilterCount: string;
  readonly icon: IconButton.Icon.Icon;

  constructor(
      filter: ConsoleFilter, icon: IconButton.Icon.Icon, selectedFilterSetting: Common.Settings.Setting<string|null>) {
    super(filter);
    this.icon = icon;
    this.uiStringForFilterCount = stringForFilterSidebarItemMap.get(filter.name as GroupName) || '';
    this.selectedFilterSetting = selectedFilterSetting;
    this.urlTreeElements = new Map();
    this.messageCount = 0;
    this.updateCounter();
  }

  clear(): void {
    this.urlTreeElements.clear();
    this.removeChildren();
    this.messageCount = 0;
    this.updateCounter();
  }

  name(): string {
    return this.filterInternal.name;
  }

  override onselect(selectedByUser?: boolean): boolean {
    this.selectedFilterSetting.set(this.filterInternal.name);
    return super.onselect(selectedByUser);
  }

  private updateCounter(): void {
    this.setExpandable(Boolean(this.childCount()));
    this.rerenderRequired();
  }

  onMessageAdded(viewMessage: ConsoleViewMessage): void {
    const message = viewMessage.consoleMessage();
    const shouldIncrementCounter = message.type !== SDK.ConsoleModel.FrontendMessageType.Command &&
        message.type !== SDK.ConsoleModel.FrontendMessageType.Result && !message.isGroupMessage();
    if (!this.filterInternal.shouldBeVisible(viewMessage) || !shouldIncrementCounter) {
      return;
    }
    const child = this.childElement(message.url);
    child.incrementAndUpdateCounter();
    this.messageCount++;
    this.updateCounter();
  }

  private childElement(url?: Platform.DevToolsPath.UrlString): URLGroupTreeElement {
    const urlValue = url || null;
    let child = this.urlTreeElements.get(urlValue);
    if (child) {
      return child;
    }

    const filter = this.filterInternal.clone();
    const parsedURL = urlValue ? Common.ParsedURL.ParsedURL.fromString(urlValue) : null;
    if (urlValue) {
      filter.name = parsedURL ? parsedURL.displayName : urlValue;
    } else {
      filter.name = i18nString(UIStrings.other);
    }
    filter.parsedFilters.push({key: FilterType.Url, text: urlValue, negative: false, regex: undefined});
    child = new URLGroupTreeElement(filter);
    if (urlValue) {
      child.tooltip = urlValue;
    }
    this.urlTreeElements.set(urlValue, child);
    this.appendChild(child);
    return child;
  }
}
