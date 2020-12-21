// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {ElementsPanel} from './ElementsPanel.js';
import {LayoutElement, LayoutPane} from './LayoutPane.js';  // eslint-disable-line no-unused-vars

const nodeToLayoutElement = (node: SDK.DOMModel.DOMNode): LayoutElement => {
  const className = node.getAttribute('class');
  const nodeId = node.id;
  return {
    id: nodeId,
    color: '#000',
    name: node.localName(),
    domId: node.getAttribute('id'),
    domClasses: className ? className.split(/\s+/).filter((s: string) => !!s) : undefined,
    enabled: false,
    reveal: () => {
      ElementsPanel.instance().revealAndSelectNode(node, true, true);
      node.scrollIntoView();
    },
    highlight: () => {
      node.highlight();
    },
    hideHighlight: () => {
      SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    },
    toggle: (value: boolean) => {
      throw new Error('Not implemented');
    },
    setColor(value: string) {
      throw new Error('Not implemented');
    },
  };
};

const gridNodesToElements = (nodes: SDK.DOMModel.DOMNode[]): LayoutElement[] => {
  return nodes.map((node: SDK.DOMModel.DOMNode) => {
    const layoutElement = nodeToLayoutElement(node);
    const nodeId = node.id;
    return {
      ...layoutElement,
      color: node.domModel().overlayModel().colorOfGridInPersistentOverlay(nodeId) || '#000',
      enabled: node.domModel().overlayModel().isHighlightedGridInPersistentOverlay(nodeId),
      toggle: (value: boolean) => {
        if (value) {
          node.domModel().overlayModel().highlightGridInPersistentOverlay(nodeId);
        } else {
          node.domModel().overlayModel().hideGridInPersistentOverlay(nodeId);
        }
      },
      setColor(value: string) {
        this.color = value;
        node.domModel().overlayModel().setColorOfGridInPersistentOverlay(nodeId, value);
      },
    };
  });
};

/** @type {!LayoutSidebarPane} */
let layoutSidebarPaneInstance;

const flexContainerNodesToElements = (nodes: SDK.DOMModel.DOMNode[]): LayoutElement[] => {
  return nodes.map((node: SDK.DOMModel.DOMNode) => {
    const layoutElement = nodeToLayoutElement(node);
    const nodeId = node.id;
    return {
      ...layoutElement,
      color: node.domModel().overlayModel().colorOfFlexInPersistentOverlay(nodeId) || '#000',
      enabled: node.domModel().overlayModel().isHighlightedFlexContainerInPersistentOverlay(nodeId),
      toggle: (value: boolean) => {
        if (value) {
          node.domModel().overlayModel().highlightFlexContainerInPersistentOverlay(nodeId);
        } else {
          node.domModel().overlayModel().hideFlexContainerInPersistentOverlay(nodeId);
        }
      },
      setColor(value: string) {
        this.color = value;
        node.domModel().overlayModel().setColorOfFlexInPersistentOverlay(nodeId, value);
      },
    };
  });
};

export class LayoutSidebarPane extends UI.ThrottledWidget.ThrottledWidget {
  _layoutPane: LayoutPane;
  _settings: string[];
  _uaShadowDOMSetting: Common.Settings.Setting<any>;
  _boundOnSettingChanged: (event: any) => void;
  _domModels: SDK.DOMModel.DOMModel[];
  constructor() {
    super(true /* isWebComponent */);
    this._layoutPane = new LayoutPane();
    this.contentElement.appendChild(this._layoutPane);
    this._settings = ['showGridLineLabels', 'showGridTrackSizes', 'showGridAreas', 'extendGridLines'];
    this._uaShadowDOMSetting = Common.Settings.Settings.instance().moduleSetting('showUAShadowDOM');
    this._boundOnSettingChanged = this.onSettingChanged.bind(this);
    this._domModels = [];
  }

  static instance(opts: {forceNew: boolean|null;}|undefined = {forceNew: null}): LayoutSidebarPane {
    const {forceNew} = opts;
    if (!layoutSidebarPaneInstance || forceNew) {
      layoutSidebarPaneInstance = new LayoutSidebarPane();
    }

    return layoutSidebarPaneInstance;
  }

  modelAdded(domModel: SDK.DOMModel.DOMModel) {
    const overlayModel = domModel.overlayModel();
    overlayModel.addEventListener(SDK.OverlayModel.Events.PersistentGridOverlayStateChanged, this.update, this);
    overlayModel.addEventListener(
        SDK.OverlayModel.Events.PersistentFlexContainerOverlayStateChanged, this.update, this);
    this._domModels.push(domModel);
  }

  modelRemoved(domModel: SDK.DOMModel.DOMModel) {
    const overlayModel = domModel.overlayModel();
    overlayModel.removeEventListener(SDK.OverlayModel.Events.PersistentGridOverlayStateChanged, this.update, this);
    overlayModel.removeEventListener(
        SDK.OverlayModel.Events.PersistentFlexContainerOverlayStateChanged, this.update, this);
    this._domModels = this._domModels.filter((model: SDK.DOMModel.DOMModel) => model !== domModel);
  }

  async _fetchNodesByStyle(style: {name: string; value: string;}[]) {
    const showUAShadowDOM = this._uaShadowDOMSetting.get();

    const nodes = [];
    for (const domModel of this._domModels) {
      const nodeIds = await domModel.getNodesByStyle(style, true /* pierce */);
      for (const nodeId of nodeIds) {
        const node = domModel.nodeForId(nodeId);
        if (node !== null && (showUAShadowDOM || !node.ancestorUserAgentShadowRoot())) {
          nodes.push(node);
        }
      }
    }

    return nodes;
  }

  async _fetchGridNodes() {
    return await this._fetchNodesByStyle([{name: 'display', value: 'grid'}, {name: 'display', value: 'inline-grid'}]);
  }

  async _fetchFlexContainerNodes() {
    return await this._fetchNodesByStyle([{name: 'display', value: 'flex'}, {name: 'display', value: 'inline-flex'}]);
  }

  _mapSettings() {
    const settings = [];
    for (const settingName of this._settings) {
      const setting = Common.Settings.Settings.instance().moduleSetting(settingName);
      const settingValue = setting.get();
      const mappedSetting = {
        type: (setting.type() as any),
        name: setting.name,
        title: setting.title(),
      };
      if (typeof settingValue === 'boolean') {
        settings.push({
          ...mappedSetting,
          value: settingValue,
          options: setting.options().map((opt: Common.Settings.SettingExtensionOption) => ({
                                           ...opt,
                                           value: (opt.value as boolean),
                                         })),
        });
      } else if (typeof settingValue === 'string') {
        settings.push({
          ...mappedSetting,
          value: settingValue,
          options: setting.options().map((opt: Common.Settings.SettingExtensionOption) => ({
                                           ...opt,
                                           value: (opt.value as string),
                                         })),
        });
      }
    }
    return settings;
  }

  /**
   * @protected
   */
  async doUpdate(): Promise<void> {
    this._layoutPane.data = {
      gridElements: gridNodesToElements(await this._fetchGridNodes()),
      flexContainerElements: Root.Runtime.experiments.isEnabled('cssFlexboxFeatures') ?
          flexContainerNodesToElements(await this._fetchFlexContainerNodes()) :
          undefined,
      settings: this._mapSettings(),
    };
  }

  onSettingChanged(event: any) {
    Common.Settings.Settings.instance().moduleSetting(event.data.setting).set(event.data.value);
  }

  wasShown() {
    for (const setting of this._settings) {
      Common.Settings.Settings.instance().moduleSetting(setting).addChangeListener(this.update, this);
    }
    this._layoutPane.addEventListener('setting-changed', this._boundOnSettingChanged);
    for (const domModel of this._domModels) {
      this.modelRemoved(domModel);
    }
    this._domModels = [];
    SDK.SDKModel.TargetManager.instance().observeModels(SDK.DOMModel.DOMModel, this);
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this.update, this);
    this._uaShadowDOMSetting.addChangeListener(this.update, this);
    this.update();
  }

  willHide() {
    for (const setting of this._settings) {
      Common.Settings.Settings.instance().moduleSetting(setting).removeChangeListener(this.update, this);
    }
    this._layoutPane.removeEventListener('setting-changed', this._boundOnSettingChanged);
    SDK.SDKModel.TargetManager.instance().unobserveModels(SDK.DOMModel.DOMModel, this);
    UI.Context.Context.instance().removeFlavorChangeListener(SDK.DOMModel.DOMNode, this.update, this);
    this._uaShadowDOMSetting.removeChangeListener(this.update, this);
  }
}
