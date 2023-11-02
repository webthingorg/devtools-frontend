// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as SDK from '../../core/sdk/sdk.js';
import type * as Platform from '../../core/platform/platform.js';

import {ApplicationPanelTreeElement} from './ApplicationPanelTreeElement.js';
import {type ResourcesPanel} from './ResourcesPanel.js';
import type * as PreloadingHelper from './preloading/helper/helper.js';

import {PreloadingRuleSetView, PreloadingAttemptView, PreloadingResultView} from './preloading/PreloadingView.js';

const UIStrings = {
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  speculationRules: 'Rules',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  preloads: 'Speculations',
  /**
   *@description Text in Application Panel Sidebar of the Application panel
   */
  thisPage: 'This page',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/PreloadingTreeElement.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

class PreloadingTreeElementBase<V extends PreloadingRuleSetView|PreloadingAttemptView|PreloadingResultView> extends
    ApplicationPanelTreeElement {
  #model?: SDK.PreloadingModel.PreloadingModel;
  #viewCtor: {new(model: SDK.PreloadingModel.PreloadingModel): V};
  protected view?: V;
  #path: Platform.DevToolsPath.UrlString;
  #selectedInternal: boolean;

  constructor(
      resourcesPanel: ResourcesPanel, ctorV: {new(model: SDK.PreloadingModel.PreloadingModel): V}, path: string,
      title: string) {
    super(resourcesPanel, title, false);

    this.#viewCtor = ctorV;
    this.#path = 'preloading://{path}' as Platform.DevToolsPath.UrlString;

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
    // TODO(https://crbug.com/1384419): Report metrics when the panel shown.

    return false;
  }
}

export class PreloadingRuleSetTreeElement extends PreloadingTreeElementBase<PreloadingRuleSetView> {
  constructor(resourcesPanel: ResourcesPanel) {
    super(
        resourcesPanel, PreloadingRuleSetView, 'preloading://rule-set' as Platform.DevToolsPath.UrlString,
        i18nString(UIStrings.speculationRules));
  }

  revealRuleSet(revealInfo: PreloadingHelper.PreloadingForward.RuleSetView): void {
    if (this.view === undefined) {
      return;
    }

    this.view.revealRuleSet(revealInfo);
  }
}

export class PreloadingAttemptTreeElement extends PreloadingTreeElementBase<PreloadingAttemptView> {
  constructor(resourcesPanel: ResourcesPanel) {
    super(
        resourcesPanel, PreloadingAttemptView, 'preloading://attempt' as Platform.DevToolsPath.UrlString,
        i18nString(UIStrings.preloads));
  }

  setFilter(filter: PreloadingHelper.PreloadingForward.AttemptViewWithFilter): void {
    if (this.view === undefined) {
      return;
    }

    this.view.setFilter(filter);
  }
}

export class PreloadingResultTreeElement extends PreloadingTreeElementBase<PreloadingResultView> {
  constructor(resourcesPanel: ResourcesPanel) {
    super(
        resourcesPanel, PreloadingResultView, 'preloading://result' as Platform.DevToolsPath.UrlString,
        i18nString(UIStrings.thisPage));
  }
}
