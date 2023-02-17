// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Protocol from '../../generated/protocol.js';

import topLevelTargetSelectorStyles from './topLevelTargetSelector.css.js';

const UIStrings = {
  /**
   *@description Title of toolbar item in top-level target selector in the main toolbar
   */
  targetNotSelected: 'Top-level target: Not selected',
  // /**
  //  *@description Text in Console Context Selector of the Console panel
  //  */
  // extension: 'Extension',
  /**
   *@description Text in Console Context Selector of the Console panel
   *@example {top} PH1
   */
  targetS: 'Top-level target: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('entrypoints/main/TopLevelTargetSelector.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let topLevelTargetSelectorInstance: TopLevelTargetSelector;

export class TopLevelTargetSelector implements SDK.TargetManager.Observer, UI.SoftDropDown.Delegate<SDK.Target.Target>,
                                               UI.Toolbar.Provider {
  private readonly items: UI.ListModel.ListModel<SDK.Target.Target>;
  private readonly dropDown: UI.SoftDropDown.SoftDropDown<SDK.Target.Target>;
  private readonly toolbarItemInternal: UI.Toolbar.ToolbarItem;

  constructor() {
    this.items = new UI.ListModel.ListModel();
    this.dropDown = new UI.SoftDropDown.SoftDropDown(this.items, this);
    this.dropDown.setRowHeight(36);
    this.toolbarItemInternal = new UI.Toolbar.ToolbarItem(this.dropDown.element);
    // this.toolbarItemInternal.setEnabled(false);
    this.toolbarItemInternal.setTitle(i18nString(UIStrings.targetNotSelected));
    this.items.addEventListener(
        UI.ListModel.Events.ItemsReplaced, () => this.toolbarItemInternal.setEnabled(Boolean(this.items.length)));

    this.toolbarItemInternal.element.classList.add('toolbar-has-dropdown');
    const targetManager = SDK.TargetManager.TargetManager.instance();
    targetManager.addModelListener(
        SDK.ChildTargetManager.ChildTargetManager, SDK.ChildTargetManager.Events.TargetInfoChanged,
        this.onTargetInfoChanged, this);
    targetManager.observeTargets(this);
    // targetManager.addEventListener(
    //     SDK.TargetManager.Events.NameChanged, this.onTargetNameChanged, this);

    UI.Context.Context.instance().addFlavorChangeListener(SDK.Target.Target, this.targetChanged, this);
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): TopLevelTargetSelector {
    const {forceNew} = opts;
    if (!topLevelTargetSelectorInstance || forceNew) {
      topLevelTargetSelectorInstance = new TopLevelTargetSelector();
    }

    return topLevelTargetSelectorInstance;
  }

  item(): UI.Toolbar.ToolbarItem {
    return this.toolbarItemInternal;
  }

  highlightedItemChanged(
      from: SDK.Target.Target|null, to: SDK.Target.Target|null, fromElement: Element|null,
      toElement: Element|null): void {
  }

  titleFor(target: SDK.Target.Target): string {
    if (target === SDK.TargetManager.TargetManager.instance().mainFrameTarget()) {
      return 'Main';
    }
    const url = target.targetInfo()?.url;
    if (!url) {
      return '<unknown>';
    }
    const parsedURL = Common.ParsedURL.ParsedURL.fromString(url);
    if (!parsedURL) {
      return '<unknown>';
    }
    return parsedURL.lastPathComponentWithFragment();
  }

  targetAdded(target: SDK.Target.Target): void {
    if (target.parentTarget() !== SDK.TargetManager.TargetManager.instance().mainTarget()) {
      return;
    }
    this.items.insertWithComparator(target, this.targetComparator());

    console.error('will try selection');
    if (target === UI.Context.Context.instance().flavor(SDK.Target.Target)) {
      console.error('selection');
      this.dropDown.selectItem(target);
    }
  }

  targetRemoved(target: SDK.Target.Target): void {
    const index = this.items.indexOf(target);
    if (index === -1) {
      return;
    }
    this.items.remove(index);
  }

  private targetComparator() {
    return (a: SDK.Target.Target, b: SDK.Target.Target) => {
      const aTargetInfo = a.targetInfo();
      const bTargetInfo = b.targetInfo();
      if (!aTargetInfo || !bTargetInfo) {
        return 0;
      }

      if (!aTargetInfo.subtype?.length && bTargetInfo.subtype?.length) {
        return -1;
      }
      if (aTargetInfo.subtype?.length && !bTargetInfo.subtype?.length) {
        return 1;
      }
      return aTargetInfo.url.localeCompare(bTargetInfo.url);
    };
  }

  private onTargetNameChanged(event: Common.EventTarget.EventTargetEvent<SDK.Target.Target>): void {
    const target = event.data;
    if (target.parentTarget() !== SDK.TargetManager.TargetManager.instance().mainTarget()) {
      return;
    }
    this.targetRemoved(target);
    this.targetAdded(target);
  }

  private onTargetInfoChanged(event: Common.EventTarget.EventTargetEvent<Protocol.Target.TargetInfo>): void {
    console.error('handling targetInfoChanged in TLTS ' + JSON.stringify(event.data));
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const target = targetManager.targetById(event.data.targetId);
    if (!target || target.parentTarget() != targetManager.mainTarget()) {
      return;
    }
    console.error(1);
    this.targetRemoved(target);
    this.targetAdded(target);
    // console.assert(false, 'Not implemented');
    // const executionContext = event.data;
    // if (this.items.indexOf(executionContext) === -1) {
    //   return;
    // }
    // this.executionContextDestroyed(executionContext);
    // this.executionContextCreated(executionContext);
  }

  private targetChanged({
    data: target,
  }: Common.EventTarget.EventTargetEvent<SDK.Target.Target|null>): void {
    this.dropDown.selectItem(target?.outermostTarget() || null);
  }

  private isTopContext(executionContext: SDK.RuntimeModel.ExecutionContext|null): boolean {
    if (!executionContext || !executionContext.isDefault) {
      return false;
    }
    const resourceTreeModel = executionContext.target().model(SDK.ResourceTreeModel.ResourceTreeModel);
    const frame =
        executionContext.frameId && resourceTreeModel && resourceTreeModel.frameForId(executionContext.frameId);
    if (!frame) {
      return false;
    }
    return frame.isTopFrame();
  }

  createElementForItem(item: SDK.Target.Target): Element {
    const element = document.createElement('div');
    const shadowRoot = UI.Utils.createShadowRootWithCoreStyles(
        element, {cssFile: [topLevelTargetSelectorStyles], delegatesFocus: undefined});
    const title = shadowRoot.createChild('div', 'title');
    UI.UIUtils.createTextChild(title, Platform.StringUtilities.trimEndWithMaxLength(this.titleFor(item), 100));
    const subTitle = shadowRoot.createChild('div', 'subtitle');
    UI.UIUtils.createTextChild(subTitle, this.subtitleFor(item));
    // element.style.paddingLeft = (8 + this.depthFor(item) * 15) + 'px';
    return element;
  }

  private subtitleFor(target: SDK.Target.Target): string {
    const targetInfo = target.targetInfo();
    if (!targetInfo) {
      return '';
    }
    const components = [];
    const url = Common.ParsedURL.ParsedURL.fromString(targetInfo.url);
    if (url) {
      components.push(url.domain());
    }
    if (targetInfo.subtype) {
      components.push(targetInfo.subtype);
    }
    return components.join(' ');
  }

  isItemSelectable(item: SDK.Target.Target): boolean {
    return true;
    // const callFrame = item.debuggerModel.selectedCallFrame();
    // const callFrameContext = callFrame && callFrame.script.executionContext();
    // return !callFrameContext || item === callFrameContext;
  }

  itemSelected(item: SDK.Target.Target|null): void {
    // this.toolbarItemInternal.element.classList.toggle('highlight', !this.isTopContext(item) && this.hasTopContext());
    const title =
        item ? i18nString(UIStrings.targetS, {PH1: this.titleFor(item)}) : i18nString(UIStrings.targetNotSelected);
    this.toolbarItemInternal.setTitle(title);
    if (item) {
      UI.Context.Context.instance().setFlavor(SDK.Target.Target, item);
    }
  }
}
