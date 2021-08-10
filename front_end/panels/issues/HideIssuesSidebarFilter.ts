// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../core/common/common.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Components from './components/components.js';
import * as UI from '../../ui/legacy/legacy.js';

const UIStrings = {
  /**
  *@description Title for the hide issues by kind row.
  */
  hideByKind: 'Hide issues by kind',
  /**
  *@description Title for the hide issues by category row.
  */
  hideByCategory: 'Hide issues by category',
  /**
  *@description Title for the hide issues by category row.
  */
  hideByCode: 'Individually hide issues',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/HideIssuesSidebarFilter.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class HideIssuesSidebarFilter extends UI.Widget.VBox {
  private expandableTree: UI.TreeOutline.TreeOutlineInShadow;
  private filterMap: Map<IssuesManager.IssuesManager.HideIssueFilterType, SidebarFilterRow>;
  private issuesManager: IssuesManager.IssuesManager.IssuesManager;
  constructor() {
    super(true);
    this.registerRequiredCSS('panels/issues/hideIssuesSidebarFilter.css');
    this.contentElement.classList.add('hide-issues-sidebar-filter');

    this.expandableTree = new UI.TreeOutline.TreeOutlineInShadow();
    this.expandableTree.setShowSelectionOnKeyboardFocus(true);
    this.expandableTree.registerRequiredCSS('panels/issues/hideIssuesSidebarFilter.css');
    this.expandableTree.element.classList.add('expandable-tree-element');
    this.expandableTree.contentElement.classList.add('expandable-tree-content');
    this.contentElement.appendChild(this.expandableTree.element);

    this.filterMap = new Map();
    this.appendSidebarFilterRow(
        IssuesManager.IssuesManager.HideIssueFilterType.Kind, i18nString(UIStrings.hideByKind),
        Object.values(IssuesManager.Issue.IssueKind));
    this.appendSidebarFilterRow(
        IssuesManager.IssuesManager.HideIssueFilterType.Category, i18nString(UIStrings.hideByCategory),
        Object.values(IssuesManager.Issue.IssueCategory));
    this.appendSidebarFilterRow(
        IssuesManager.IssuesManager.HideIssueFilterType.Code, i18nString(UIStrings.hideByCode), []);

    this.issuesManager = IssuesManager.IssuesManager.IssuesManager.instance();
    this.issuesManager.addEventListener(
        IssuesManager.IssuesManager.Events.IssueAdded, this.addEntryToCodeDropdown.bind(this));
    this.issuesManager.addEventListener(
        IssuesManager.IssuesManager.Events.FullUpdateRequired, this.updateCodeDropdownEntries.bind(this));
    this.updateCodeDropdownEntries();
  }

  appendSidebarFilterRow(type: IssuesManager.IssuesManager.HideIssueFilterType, title: string, menuEntires?: string[]):
      void {
    const row = new SidebarFilterRow(type, title);
    if (menuEntires) {
      row.setMenuEntries(menuEntires);
    }
    this.expandableTree.appendChild(row);
    this.filterMap.set(type, row);
  }

  addEntryToCodeDropdown(event: Common.EventTarget.EventTargetEvent<IssuesManager.IssuesManager.IssueAddedEvent>):
      void {
    const row = this.filterMap.get(IssuesManager.IssuesManager.HideIssueFilterType.Code);
    if (row) {
      const issue = event.data.issue;
      row.addMenuEntry(issue.code());
    }
  }

  updateCodeDropdownEntries(): void {
    const row = this.filterMap.get(IssuesManager.IssuesManager.HideIssueFilterType.Code);
    if (row) {
      row.clearMenuEntries();
      for (const issue of this.issuesManager.issues()) {
        row.addMenuEntry(issue.code());
      }
    }
  }
}

export class SidebarFilterRow extends UI.TreeOutline.TreeElement {
  private filterSections: Components.IssueFilterSection.IssueFilterSection;
  private menuEntires: Set<string> = new Set();
  private parameter: IssuesManager.IssuesManager.HideIssueFilterType;
  private setting: Common.Settings.Setting<IssuesManager.IssuesManager.JointHideIssueFilter> =
      IssuesManager.IssuesManager.getJointHideIssueFilter();
  constructor(parameter: IssuesManager.IssuesManager.HideIssueFilterType, title: string) {
    super();
    this.parameter = parameter;
    this.filterSections = new Components.IssueFilterSection.IssueFilterSection();

    this.selectable = true;
    this.setExpandable(true);
    this.listItemElement.classList.add('expandable-filter-row');
    this.childrenListElement.classList.add('expandable-filter-row-body');
    this.childrenListElement.appendChild(this.filterSections);
    this.appendHeader(title);

    this.filterSections.data = {
      parameter: this.parameter,
      includedCallback: this.openIncludedContextMenu.bind(this),
      excludedCallback: this.openExcludedContextMenu.bind(this),
    };
  }

  appendHeader(text: string): void {
    const header = document.createElement('div');
    const title = document.createElement('div');

    header.classList.add('header');
    title.classList.add('title');

    title.textContent = text;
    header.appendChild(title);
    this.listItemElement.appendChild(header);
  }

  setMenuEntries(entries: string[]): void {
    this.menuEntires = new Set(entries);
  }

  addMenuEntry(entry: string): void {
    this.menuEntires.add(entry);
  }

  clearMenuEntries(): void {
    this.menuEntires.clear();
  }

  toggleHideAction(entry: string): void {
    const setting = this.setting;
    const levels = setting.get();
    const toggleAction = !levels[this.parameter].included.includes(entry);
    if (toggleAction) {
      if (levels[this.parameter].excluded.includes(entry)) {
        return;
      }
      levels[this.parameter].included.push(entry);
      setting.set(levels);
      return;
    }
    const index = levels[this.parameter].included.indexOf(entry);
    levels[this.parameter].included.splice(index, 1);
    setting.set(levels);
    return;
  }

  toggleExcludeAction(entry: string): void {
    const setting = this.setting;
    const levels = setting.get();
    const toggleAction = !levels[this.parameter].excluded.includes(entry);
    if (toggleAction) {
      levels[this.parameter].excluded.push(entry);
      setting.set(levels);
      return;
    }
    const index = levels[this.parameter].excluded.indexOf(entry);
    levels[this.parameter].excluded.splice(index, 1);
    setting.set(levels);
    return;
  }

  openIncludedContextMenu(event: Common.EventTarget.EventTargetEvent): void {
    const setting = this.setting;
    const levels = setting.get();
    const mouseEvent = (event.data as Event);
    const contextMenu = new UI.ContextMenu.ContextMenu(mouseEvent, true);
    for (const level of this.menuEntires.values()) {
      if (!levels[this.parameter].excluded.includes(level)) {
        contextMenu.defaultSection().appendCheckboxItem(
            level, this.toggleHideAction.bind(this, level), levels[this.parameter].included.includes(level));
      }
    }
    contextMenu.show();
  }

  openExcludedContextMenu(event: Common.EventTarget.EventTargetEvent): void {
    const setting = this.setting;
    const levels = setting.get();
    const mouseEvent = (event.data as Event);
    const contextMenu = new UI.ContextMenu.ContextMenu(mouseEvent, true);
    for (const level of this.menuEntires.values()) {
      if (!levels[this.parameter].included.includes(level)) {
        contextMenu.defaultSection().appendCheckboxItem(
            level, this.toggleExcludeAction.bind(this, level), levels[this.parameter].excluded.includes(level));
      }
    }
    contextMenu.show();
  }
}
