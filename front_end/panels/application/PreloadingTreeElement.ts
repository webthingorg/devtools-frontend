// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

import {ApplicationPanelTreeElement, ExpandableApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import type * as PreloadingHelper from './preloading/helper/helper.js';
import {PreloadingAttemptView, PreloadingRuleSetView, PreloadingSummaryView} from './preloading/PreloadingView.js';
import {type ResourcesPanel} from './ResourcesPanel.js';

const UIStrings = {
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  speculativeLoads: 'Speculative loads',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  rules: 'Rules',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  speculations: 'Speculations',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/PreloadingTreeElement.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class PreloadingTreeElementBase<V extends PreloadingRuleSetView|PreloadingAttemptView> extends
    ApplicationPanelTreeElement {
  #model?: SDK.PreloadingModel.PreloadingModel;
  #viewCtor: {new(model: SDK.PreloadingModel.PreloadingModel): V};
  protected view?: V;
  #path: Platform.DevToolsPath.UrlString;
  #selectedInternal: boolean;

  constructor(
      panel: ResourcesPanel, ctorV: {new(model: SDK.PreloadingModel.PreloadingModel): V},
      path: Platform.DevToolsPath.UrlString, title: string) {
    super(panel, title, false);

    this.#viewCtor = ctorV;
    this.#path = path;

    const icon = UI.Icon.Icon.create('arrow-up-down', 'resource-tree-item');
    this.setLeadingIcons([icon]);
    this.#selectedInternal = false;

    // TODO(https://crbug.com/1384419): Set link
  }

  override get itemURL(): Platform.DevToolsPath.UrlString {
    return this.#path;
  }

  initialize(model: SDK.PreloadingModel.PreloadingModel): void {
    this.#model = model;

    // Show the view if the model was initialized after selection.
    if (this.#selectedInternal && !this.view) {
      this.onselect(false);
    }
  }

  override onselect(selectedByUser?: boolean): boolean {
    super.onselect(selectedByUser);
    this.#selectedInternal = true;

    if (!this.#model) {
      return false;
    }

    if (!this.view) {
      this.view = new this.#viewCtor(this.#model);
    }

    this.showView(this.view);

    return false;
  }
}

class ExpandablePreloadingTreeElementBase<V extends PreloadingSummaryView> extends
    ExpandableApplicationPanelTreeElement {
  #model?: SDK.PreloadingModel.PreloadingModel;
  #viewCtor: {new(model: SDK.PreloadingModel.PreloadingModel): V};
  protected view?: V;
  #selectedInternal: boolean;

  constructor(panel: ResourcesPanel, ctorV: {new(model: SDK.PreloadingModel.PreloadingModel): V}, title: string) {
    super(panel, title, 'preloading');

    this.#viewCtor = ctorV;

    const icon = UI.Icon.Icon.create('arrow-up-down', 'resource-tree-item');
    this.setLeadingIcons([icon]);
    this.#selectedInternal = false;

    // TODO(https://crbug.com/1384419): Set link
  }

  initialize(model: SDK.PreloadingModel.PreloadingModel): void {
    this.#model = model;

    // Show the view if the model was initialized after selection.
    if (this.#selectedInternal && !this.view) {
      this.onselect(false);
    }
  }

  override onselect(selectedByUser?: boolean): boolean {
    super.onselect(selectedByUser);
    this.#selectedInternal = true;

    if (!this.#model) {
      return false;
    }

    if (!this.view) {
      this.view = new this.#viewCtor(this.#model);
    }

    this.showView(this.view);

    return false;
  }
}

export class PreloadingSummaryTreeElement extends ExpandablePreloadingTreeElementBase<PreloadingSummaryView> {
  #ruleSet: PreloadingRuleSetTreeElement|null = null;
  #attempt: PreloadingAttemptTreeElement|null = null;

  constructor(panel: ResourcesPanel) {
    super(panel, PreloadingSummaryView, i18nString(UIStrings.speculativeLoads));
  }

  // Note that
  //
  // - TreeElement.ensureSelection assumes TreeElement.treeOutline initalized.
  // - TreeElement.treeOutline is propagated in TreeElement.appendChild.
  //
  // So, `this.constructChildren` should be called just after `parent.appendChild(this)`
  // to enrich children with TreeElement.selectionElementInternal correctly.
  constructChildren(panel: ResourcesPanel): void {
    this.#ruleSet = new PreloadingRuleSetTreeElement(panel);
    this.#attempt = new PreloadingAttemptTreeElement(panel);
    this.appendChild(this.#ruleSet);
    this.appendChild(this.#attempt);
  }

  override initialize(model: SDK.PreloadingModel.PreloadingModel): void {
    if (this.#ruleSet === null || this.#attempt === null) {
      throw new Error('unreachable');
    }

    super.initialize(model);
    this.#ruleSet.initialize(model);
    this.#attempt.initialize(model);
  }

  expandAndRevealRuleSet(revealInfo: PreloadingHelper.PreloadingForward.RuleSetView): void {
    if (this.#ruleSet === null) {
      throw new Error('unreachable');
    }

    this.expand();
    this.#ruleSet.revealRuleSet(revealInfo);
  }

  expandAndRevealAttempts(filter: PreloadingHelper.PreloadingForward.AttemptViewWithFilter): void {
    if (this.#attempt === null) {
      throw new Error('unreachable');
    }

    this.expand();
    this.#attempt.revealAttempts(filter);
  }
}

export class PreloadingRuleSetTreeElement extends PreloadingTreeElementBase<PreloadingRuleSetView> {
  constructor(panel: ResourcesPanel) {
    super(
        panel, PreloadingRuleSetView, 'preloading://rule-set' as Platform.DevToolsPath.UrlString,
        i18nString(UIStrings.rules));
  }

  revealRuleSet(revealInfo: PreloadingHelper.PreloadingForward.RuleSetView): void {
    this.select();

    if (this.view === undefined) {
      return;
    }

    this.view?.revealRuleSet(revealInfo);
  }
}

class PreloadingAttemptTreeElement extends PreloadingTreeElementBase<PreloadingAttemptView> {
  constructor(panel: ResourcesPanel) {
    super(
        panel, PreloadingAttemptView, 'preloading://attempt' as Platform.DevToolsPath.UrlString,
        i18nString(UIStrings.speculations));
  }

  revealAttempts(filter: PreloadingHelper.PreloadingForward.AttemptViewWithFilter): void {
    this.select();
    this.view?.setFilter(filter);
  }
}
