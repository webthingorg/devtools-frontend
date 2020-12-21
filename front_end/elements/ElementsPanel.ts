// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as Extensions from '../extensions/extensions.js';
import * as Host from '../host/host.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {ComputedStyleWidget} from './ComputedStyleWidget.js';
import {DOMNode, ElementsBreadcrumbs} from './ElementsBreadcrumbs.js';  // eslint-disable-line no-unused-vars
import {ElementsTreeElement} from './ElementsTreeElement.js';           // eslint-disable-line no-unused-vars
import {ElementsTreeElementHighlighter} from './ElementsTreeElementHighlighter.js';
import {ElementsTreeOutline} from './ElementsTreeOutline.js';
import {MarkerDecorator} from './MarkerDecorator.js';  // eslint-disable-line no-unused-vars
import {MetricsSidebarPane} from './MetricsSidebarPane.js';
import {Events as StylesSidebarPaneEvents, StylesSidebarPane} from './StylesSidebarPane.js';

const legacyNodeToNewBreadcrumbsNode = (node: SDK.DOMModel.DOMNode): DOMNode => {
  return {
    parentNode: node.parentNode ? legacyNodeToNewBreadcrumbsNode(node.parentNode) : null,
    id: (node.id as number),
    nodeType: node.nodeType(),
    pseudoType: node.pseudoType(),
    shadowRootType: node.shadowRootType(),
    nodeName: node.nodeName(),
    nodeNameNicelyCased: node.nodeNameInCorrectCase(),
    legacyDomNode: node,
    highlightNode: () => node.highlight(),
    clearHighlight: () => SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight(),
    getAttribute: node.getAttribute.bind(node),
  };
};

/** @type {!ElementsPanel} */
let elementsPanelInstance;

export class ElementsPanel extends UI.Panel.Panel implements UI.SearchableView.Searchable,
                                                             SDK.SDKModel.SDKModelObserver,
                                                             UI.View.ViewLocationResolver {
  _splitWidget: UI.SplitWidget.SplitWidget;
  _searchableView: UI.SearchableView.SearchableView;
  _contentElement: HTMLDivElement;
  _splitMode: _splitMode|null;
  _breadcrumbs: ElementsBreadcrumbs;
  _stylesWidget: StylesSidebarPane;
  _computedStyleWidget: ComputedStyleWidget;
  _metricsWidget: MetricsSidebarPane;
  _treeOutlines: Set<ElementsTreeOutline>;
  _treeOutlineHeaders: Map<ElementsTreeOutline, Element>;
  _gridStyleTrackerByCSSModel: Map<SDK.CSSModel.CSSModel, SDK.CSSModel.CSSPropertyTracker>;
  _searchResults: ({
    domModel: SDK.DOMModel.DOMModel;
    index: number;
    node: ((SDK.DOMModel.DOMNode | undefined)|null);
  }[]|undefined)|undefined;
  _currentSearchResultIndex: number;
  _pendingNodeReveal: boolean;
  _selectedNodeOnReset: (SDK.DOMModel.DOMNode|undefined)|undefined;
  _hasNonDefaultSelectedNode: (boolean|undefined)|undefined;
  _searchConfig: (UI.SearchableView.SearchConfig|undefined)|undefined;
  _omitDefaultSelection: (boolean|undefined)|undefined;
  _notFirstInspectElement: (boolean|undefined)|undefined;
  sidebarPaneView: (UI.View.TabbedViewLocation|undefined)|undefined;
  _stylesViewToReveal: (UI.View.SimpleView|undefined)|undefined;
  constructor() {
    super('elements');
    this.registerRequiredCSS('elements/elementsPanel.css', {enableLegacyPatching: true});
    this._splitWidget = new UI.SplitWidget.SplitWidget(true, true, 'elementsPanelSplitViewState', 325, 325);
    this._splitWidget.addEventListener(
        UI.SplitWidget.Events.SidebarSizeChanged, this._updateTreeOutlineVisibleWidth.bind(this));
    this._splitWidget.show(this.element);

    this._searchableView = new UI.SearchableView.SearchableView(this, null);
    this._searchableView.setMinimumSize(25, 28);
    this._searchableView.setPlaceholder(Common.UIString.UIString('Find by string, selector, or XPath'));
    const stackElement = this._searchableView.element;

    this._contentElement = document.createElement('div');
    const crumbsContainer = document.createElement('div');
    stackElement.appendChild(this._contentElement);
    stackElement.appendChild(crumbsContainer);

    this._splitWidget.setMainWidget(this._searchableView);
    this._splitMode = null;

    this._contentElement.id = 'elements-content';
    // FIXME: crbug.com/425984
    if (Common.Settings.Settings.instance().moduleSetting('domWordWrap').get()) {
      this._contentElement.classList.add('elements-wrap');
    }
    Common.Settings.Settings.instance()
        .moduleSetting('domWordWrap')
        .addChangeListener(this._domWordWrapSettingChanged.bind(this));

    crumbsContainer.id = 'elements-crumbs';

    this._breadcrumbs = new ElementsBreadcrumbs();
    this._breadcrumbs.addEventListener(
        'node-selected', /** @param {!Event} event */ /** @param {!Event} event */
        (/** @param {!Event} event */ /** @param {!Event} event */ event: Event) => {
          this._crumbNodeSelected((event as any));
        });

    crumbsContainer.appendChild(this._breadcrumbs);

    this._stylesWidget = StylesSidebarPane.instance();
    this._computedStyleWidget = new ComputedStyleWidget();
    this._metricsWidget = new MetricsSidebarPane();

    Common.Settings.Settings.instance()
        .moduleSetting('sidebarPosition')
        .addChangeListener(this._updateSidebarPosition.bind(this));
    this._updateSidebarPosition();

    this._treeOutlines = new Set();
    this._treeOutlineHeaders = new Map();
    this._gridStyleTrackerByCSSModel = new Map();
    SDK.SDKModel.TargetManager.instance().observeModels(SDK.DOMModel.DOMModel, this);
    SDK.SDKModel.TargetManager.instance().addEventListener(
        SDK.SDKModel.Events.NameChanged,
        (event: Common.EventTarget.EventTargetEvent) => this._targetNameChanged((event.data as SDK.SDKModel.Target)));
    Common.Settings.Settings.instance()
        .moduleSetting('showUAShadowDOM')
        .addChangeListener(this._showUAShadowDOMChanged.bind(this));
    SDK.SDKModel.TargetManager.instance().addModelListener(
        SDK.DOMModel.DOMModel, SDK.DOMModel.Events.DocumentUpdated, this._documentUpdatedEvent, this);
    Extensions.ExtensionServer.ExtensionServer.instance().addEventListener(
        Extensions.ExtensionServer.Events.SidebarPaneAdded, this._extensionSidebarPaneAdded, this);
    this._currentSearchResultIndex = -1;  // -1 represents the initial invalid state

    this._pendingNodeReveal = false;
  }

  static instance(opts: {forceNew: boolean|null;}|undefined = {forceNew: null}): ElementsPanel {
    const {forceNew} = opts;
    if (!elementsPanelInstance || forceNew) {
      elementsPanelInstance = new ElementsPanel();
    }

    return elementsPanelInstance;
  }

  _revealProperty(cssProperty: SDK.CSSProperty.CSSProperty) {
    if (!this.sidebarPaneView || !this._stylesViewToReveal) {
      return Promise.resolve();
    }

    return this.sidebarPaneView.showView(this._stylesViewToReveal).then(() => {
      this._stylesWidget.revealProperty((cssProperty as SDK.CSSProperty.CSSProperty));
    });
  }

  resolveLocation(locationName: string): UI.View.ViewLocation|null {
    return this.sidebarPaneView || null;
  }

  showToolbarPane(widget: UI.Widget.Widget|null, toggle: UI.Toolbar.ToolbarToggle|null) {
    // TODO(luoe): remove this function once its providers have an alternative way to reveal their views.
    this._stylesWidget.showToolbarPane(widget, toggle);
  }

  /**
   * @override
   */
  modelAdded(domModel: SDK.DOMModel.DOMModel) {
    const parentModel = domModel.parentModel();
    let treeOutline: ElementsTreeOutline|(ElementsTreeOutline | null) =
        parentModel ? ElementsTreeOutline.forDOMModel(parentModel) : null;
    if (!treeOutline) {
      treeOutline = new ElementsTreeOutline(true, true);
      treeOutline.setWordWrap(Common.Settings.Settings.instance().moduleSetting('domWordWrap').get());
      treeOutline.addEventListener(ElementsTreeOutline.Events.SelectedNodeChanged, this._selectedNodeChanged, this);
      treeOutline.addEventListener(
          ElementsTreeOutline.Events.ElementsTreeUpdated, this._updateBreadcrumbIfNeeded, this);
      new ElementsTreeElementHighlighter(treeOutline);
      this._treeOutlines.add(treeOutline);
      if (domModel.target().parentTarget()) {
        const element = document.createElement('div');
        element.classList.add('elements-tree-header');
        this._treeOutlineHeaders.set(treeOutline, element);
        this._targetNameChanged(domModel.target());
      }
    }
    treeOutline.wireToDOMModel(domModel);

    this._setupStyleTracking(domModel.cssModel());

    // Perform attach if necessary.
    if (this.isShowing()) {
      this.wasShown();
    }
  }

  modelRemoved(domModel: SDK.DOMModel.DOMModel) {
    const treeOutline = ElementsTreeOutline.forDOMModel(domModel);
    if (!treeOutline) {
      return;
    }

    treeOutline.unwireFromDOMModel(domModel);
    if (domModel.parentModel()) {
      return;
    }
    this._treeOutlines.delete(treeOutline);
    const header = this._treeOutlineHeaders.get(treeOutline);
    if (header) {
      header.remove();
    }
    this._treeOutlineHeaders.delete(treeOutline);
    treeOutline.element.remove();

    this._removeStyleTracking(domModel.cssModel());
  }

  _targetNameChanged(target: SDK.SDKModel.Target) {
    const domModel = target.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return;
    }
    const treeOutline = ElementsTreeOutline.forDOMModel(domModel);
    if (!treeOutline) {
      return;
    }
    const header = this._treeOutlineHeaders.get(treeOutline);
    if (!header) {
      return;
    }
    header.removeChildren();
    header.createChild('div', 'elements-tree-header-frame').textContent = Common.UIString.UIString('Frame');
    header.appendChild(Components.Linkifier.Linkifier.linkifyURL(
        target.inspectedURL(), ({text: target.name()} as Components.Linkifier.LinkifyURLOptions)));
  }

  _updateTreeOutlineVisibleWidth() {
    if (!this._treeOutlines.size) {
      return;
    }

    let width = this._splitWidget.element.offsetWidth;
    if (this._splitWidget.isVertical()) {
      width -= this._splitWidget.sidebarSize();
    }
    for (const treeOutline of this._treeOutlines) {
      treeOutline.setVisibleWidth(width);
    }
  }

  focus() {
    if (this._treeOutlines.size) {
      this._treeOutlines.values().next().value.focus();
    }
  }

  searchableView(): UI.SearchableView.SearchableView {
    return this._searchableView;
  }

  wasShown() {
    UI.Context.Context.instance().setFlavor(ElementsPanel, this);

    for (const treeOutline of this._treeOutlines) {
      // Attach heavy component lazily
      if (treeOutline.element.parentElement !== this._contentElement) {
        const header = this._treeOutlineHeaders.get(treeOutline);
        if (header) {
          this._contentElement.appendChild(header);
        }
        this._contentElement.appendChild(treeOutline.element);
      }
    }
    super.wasShown();

    const domModels = SDK.SDKModel.TargetManager.instance().models(SDK.DOMModel.DOMModel);
    for (const domModel of domModels) {
      if (domModel.parentModel()) {
        continue;
      }
      const treeOutline = ElementsTreeOutline.forDOMModel(domModel);
      if (!treeOutline) {
        continue;
      }
      treeOutline.setVisible(true);

      if (!treeOutline.rootDOMNode) {
        if (domModel.existingDocument()) {
          treeOutline.rootDOMNode = domModel.existingDocument();
          this._documentUpdated(domModel);
        } else {
          domModel.requestDocument();
        }
      }
    }
  }

  willHide() {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    for (const treeOutline of this._treeOutlines) {
      treeOutline.setVisible(false);
      // Detach heavy component on hide
      this._contentElement.removeChild(treeOutline.element);
      const header = this._treeOutlineHeaders.get(treeOutline);
      if (header) {
        this._contentElement.removeChild(header);
      }
    }
    super.willHide();
    UI.Context.Context.instance().setFlavor(ElementsPanel, null);
  }

  onResize() {
    this.element.window().requestAnimationFrame(this._updateSidebarPosition.bind(this));  // Do not force layout.
    this._updateTreeOutlineVisibleWidth();
  }

  _selectedNodeChanged(event: Common.EventTarget.EventTargetEvent) {
    let selectedNode = (event.data.node as SDK.DOMModel.DOMNode | null);

    // If the selectedNode is a pseudoNode, we want to ensure that it has a valid parentNode
    if (selectedNode && (selectedNode.pseudoType() && !selectedNode.parentNode)) {
      selectedNode = null;
    }
    const focus: boolean = (event.data.focus as boolean);
    for (const treeOutline of this._treeOutlines) {
      if (!selectedNode || ElementsTreeOutline.forDOMModel(selectedNode.domModel()) !== treeOutline) {
        treeOutline.selectDOMNode(null);
      }
    }

    if (selectedNode) {
      const activeNode = legacyNodeToNewBreadcrumbsNode(selectedNode);
      const crumbs = [activeNode];

      for (let current: (SDK.DOMModel.DOMNode|null) = selectedNode.parentNode; current; current = current.parentNode) {
        crumbs.push(legacyNodeToNewBreadcrumbsNode(current));
      }

      this._breadcrumbs.data = {
        crumbs,
        selectedNode: legacyNodeToNewBreadcrumbsNode(selectedNode),
      };
    } else {
      this._breadcrumbs.data = {crumbs: [], selectedNode: null};
    }

    UI.Context.Context.instance().setFlavor(SDK.DOMModel.DOMNode, selectedNode);

    if (!selectedNode) {
      return;
    }
    selectedNode.setAsInspectedNode();
    if (focus) {
      this._selectedNodeOnReset = selectedNode;
      this._hasNonDefaultSelectedNode = true;
    }

    const executionContexts = selectedNode.domModel().runtimeModel().executionContexts();
    const nodeFrameId = selectedNode.frameId();
    for (const context of executionContexts) {
      if (context.frameId === nodeFrameId) {
        UI.Context.Context.instance().setFlavor(SDK.RuntimeModel.ExecutionContext, context);
        break;
      }
    }
  }

  _documentUpdatedEvent(event: Common.EventTarget.EventTargetEvent) {
    const domModel = (event.data as SDK.DOMModel.DOMModel);
    this._documentUpdated(domModel);
    this._removeStyleTracking(domModel.cssModel());
    this._setupStyleTracking(domModel.cssModel());
  }

  _documentUpdated(domModel: SDK.DOMModel.DOMModel) {
    this._searchableView.resetSearch();

    if (!domModel.existingDocument()) {
      if (this.isShowing()) {
        domModel.requestDocument();
      }
      return;
    }

    this._hasNonDefaultSelectedNode = false;

    if (this._omitDefaultSelection) {
      return;
    }

    const savedSelectedNodeOnReset = this._selectedNodeOnReset;
    restoreNode.call(this, domModel, this._selectedNodeOnReset || null);

    async function restoreNode(
        this: ElementsPanel, domModel: SDK.DOMModel.DOMModel, staleNode: SDK.DOMModel.DOMNode|null) {
      const nodePath = staleNode ? staleNode.path() : null;
      const restoredNodeId = nodePath ? await domModel.pushNodeByPathToFrontend(nodePath) : null;

      if (savedSelectedNodeOnReset !== this._selectedNodeOnReset) {
        return;
      }
      let node: (SDK.DOMModel.DOMNode|null) = restoredNodeId ? domModel.nodeForId(restoredNodeId) : null;
      if (!node) {
        const inspectedDocument = domModel.existingDocument();
        node = inspectedDocument ? inspectedDocument.body || inspectedDocument.documentElement : null;
      }
      // If `node` is null here, the document hasn't been transmitted from the backend yet
      // and isn't in a valid state to have a default-selected node. Another document update
      // should be forthcoming. In the meantime, don't set the default-selected node or notify
      // the test that it's ready, because it isn't.
      if (node) {
        this._setDefaultSelectedNode(node);
        this._lastSelectedNodeSelectedForTest();
      }
    }
  }

  _lastSelectedNodeSelectedForTest() {
  }

  _setDefaultSelectedNode(node: SDK.DOMModel.DOMNode|null) {
    if (!node || this._hasNonDefaultSelectedNode || this._pendingNodeReveal) {
      return;
    }
    const treeOutline = ElementsTreeOutline.forDOMModel(node.domModel());
    if (!treeOutline) {
      return;
    }
    this.selectDOMNode(node);
    if (treeOutline.selectedTreeElement) {
      treeOutline.selectedTreeElement.expand();
    }
  }

  searchCanceled() {
    this._searchConfig = undefined;
    this._hideSearchHighlights();

    this._searchableView.updateSearchMatchesCount(0);

    this._currentSearchResultIndex = -1;
    delete this._searchResults;

    SDK.DOMModel.DOMModel.cancelSearch();
  }

  /**
   * @override
   */
  performSearch(searchConfig: UI.SearchableView.SearchConfig, shouldJump: boolean, jumpBackwards?: boolean|undefined) {
    const query = searchConfig.query;

    const whitespaceTrimmedQuery = query.trim();
    if (!whitespaceTrimmedQuery.length) {
      return;
    }

    if (!this._searchConfig || this._searchConfig.query !== query) {
      this.searchCanceled();
    } else {
      this._hideSearchHighlights();
    }

    this._searchConfig = searchConfig;

    const showUAShadowDOM = Common.Settings.Settings.instance().moduleSetting('showUAShadowDOM').get();
    const domModels = SDK.SDKModel.TargetManager.instance().models(SDK.DOMModel.DOMModel);
    const promises = domModels.map(
        (domModel: SDK.DOMModel.DOMModel) => domModel.performSearch(whitespaceTrimmedQuery, showUAShadowDOM));
    Promise.all(promises).then((resultCounts: number[]) => {
      this._searchResults = [];
      for (let i = 0; i < resultCounts.length; ++i) {
        const resultCount = resultCounts[i];
        for (let j = 0; j < resultCount; ++j) {
          this._searchResults.push({domModel: domModels[i], index: j, node: undefined});
        }
      }
      this._searchableView.updateSearchMatchesCount(this._searchResults.length);
      if (!this._searchResults.length) {
        return;
      }
      if (this._currentSearchResultIndex >= this._searchResults.length) {
        this._currentSearchResultIndex = -1;
      }

      let index: (0|- 1)|number = this._currentSearchResultIndex;

      if (shouldJump) {
        if (this._currentSearchResultIndex === -1) {
          index = jumpBackwards ? -1 : 0;
        } else {
          index = jumpBackwards ? index - 1 : index + 1;
        }
        this._jumpToSearchResult(index);
      }
    });
  }

  _domWordWrapSettingChanged(event: Common.EventTarget.EventTargetEvent) {
    this._contentElement.classList.toggle('elements-wrap', (event.data as boolean));
    for (const treeOutline of this._treeOutlines) {
      treeOutline.setWordWrap((event.data as boolean));
    }
  }

  switchToAndFocus(node: SDK.DOMModel.DOMNode) {
    // Reset search restore.
    this._searchableView.cancelSearch();
    UI.ViewManager.ViewManager.instance().showView('elements').then(() => this.selectDOMNode(node, true));
  }

  _jumpToSearchResult(index: number) {
    if (!this._searchResults) {
      return;
    }

    this._currentSearchResultIndex = (index + this._searchResults.length) % this._searchResults.length;
    this._highlightCurrentSearchResult();
  }

  jumpToNextSearchResult() {
    if (!this._searchResults || !this._searchConfig) {
      return;
    }
    this.performSearch(this._searchConfig, true);
  }

  jumpToPreviousSearchResult() {
    if (!this._searchResults || !this._searchConfig) {
      return;
    }
    this.performSearch(this._searchConfig, true, true);
  }

  supportsCaseSensitiveSearch(): boolean {
    return false;
  }

  supportsRegexSearch(): boolean {
    return false;
  }

  _highlightCurrentSearchResult() {
    const index = this._currentSearchResultIndex;
    const searchResults = this._searchResults;
    if (!searchResults) {
      return;
    }
    const searchResult = searchResults[index];

    this._searchableView.updateCurrentMatchIndex(index);
    if (searchResult.node === null) {
      return;
    }

    if (typeof searchResult.node === 'undefined') {
      // No data for slot, request it.
      searchResult.domModel.searchResult(searchResult.index).then((node: SDK.DOMModel.DOMNode|null) => {
        searchResult.node = node;

        // If any of these properties are undefined or reset to an invalid value,
        // this means the search/highlight request is outdated.
        const highlightRequestValid =
            this._searchConfig && this._searchResults && (this._currentSearchResultIndex !== -1);
        if (highlightRequestValid) {
          this._highlightCurrentSearchResult();
        }
      });
      return;
    }

    const treeElement = this._treeElementForNode(searchResult.node);
    searchResult.node.scrollIntoView();
    if (treeElement) {
      this._searchConfig && treeElement.highlightSearchResults(this._searchConfig.query);
      treeElement.reveal();
      const matches = treeElement.listItemElement.getElementsByClassName(UI.UIUtils.highlightedSearchResultClassName);
      if (matches.length) {
        matches[0].scrollIntoViewIfNeeded(false);
      }
    }
  }

  _hideSearchHighlights() {
    if (!this._searchResults || !this._searchResults.length || this._currentSearchResultIndex === -1) {
      return;
    }
    const searchResult = this._searchResults[this._currentSearchResultIndex];
    if (!searchResult.node) {
      return;
    }
    const treeElement = this._treeElementForNode(searchResult.node);
    if (treeElement) {
      treeElement.hideSearchHighlights();
    }
  }

  selectedDOMNode(): SDK.DOMModel.DOMNode|null {
    for (const treeOutline of this._treeOutlines) {
      if (treeOutline.selectedDOMNode()) {
        return treeOutline.selectedDOMNode();
      }
    }
    return null;
  }

  selectDOMNode(node: SDK.DOMModel.DOMNode, focus?: boolean|undefined) {
    for (const treeOutline of this._treeOutlines) {
      const outline = ElementsTreeOutline.forDOMModel(node.domModel());
      if (outline === treeOutline) {
        treeOutline.selectDOMNode(node, focus);
      } else {
        treeOutline.selectDOMNode(null);
      }
    }
  }

  _updateBreadcrumbIfNeeded(event: Common.EventTarget.EventTargetEvent) {
    const nodes = (event.data as SDK.DOMModel.DOMNode[]);
    /* If we don't have a selected node then we can tell the breadcrumbs that & bail. */
    const selectedNode = this.selectedDOMNode();
    if (!selectedNode) {
      this._breadcrumbs.data = {
        crumbs: [],
        selectedNode: null,
      };
      return;
    }

    /* This function gets called whenever the tree outline is updated
     * and contains any nodes that have changed.
     * What we need to do is construct the new set of breadcrumb nodes, combining the Nodes
     * that we had before with the new nodes, and pass them into the breadcrumbs component.
     */

    // Get the current set of active crumbs
    const activeNode = legacyNodeToNewBreadcrumbsNode(selectedNode);
    const existingCrumbs = [activeNode];
    for (let current: (SDK.DOMModel.DOMNode|null) = selectedNode.parentNode; current; current = current.parentNode) {
      existingCrumbs.push(legacyNodeToNewBreadcrumbsNode(current));
    }

    /* Get the change nodes from the event & convert them to breadcrumb nodes */
    const newNodes = nodes.map(legacyNodeToNewBreadcrumbsNode);
    const nodesThatHaveChangedMap = new Map<number, DOMNode>();
    newNodes.forEach((crumb: DOMNode) => nodesThatHaveChangedMap.set(crumb.id, crumb));

    /* Loop over our existing crumbs, and if any have an ID that matches an ID from the new nodes
     * that we have, use the new node, rather than the one we had, because it's changed.
     */
    const newSetOfCrumbs = existingCrumbs.map((crumb: DOMNode) => {
      const replacement = nodesThatHaveChangedMap.get(crumb.id);
      return replacement || crumb;
    });

    this._breadcrumbs.data = {
      crumbs: newSetOfCrumbs,
      selectedNode: activeNode,
    };
  }

  _crumbNodeSelected(event: Common.EventTarget.EventTargetEvent) {
    const node = (event.data as SDK.DOMModel.DOMNode);
    this.selectDOMNode(node, true);
  }

  _treeOutlineForNode(node: SDK.DOMModel.DOMNode|null): ElementsTreeOutline|null {
    if (!node) {
      return null;
    }
    return ElementsTreeOutline.forDOMModel(node.domModel());
  }

  _treeElementForNode(node: SDK.DOMModel.DOMNode): ElementsTreeElement|null {
    const treeOutline = this._treeOutlineForNode(node);
    if (!treeOutline) {
      return null;
    }
    return /** @type {?ElementsTreeElement} */ treeOutline.findTreeElement(node) as ElementsTreeElement | null;
  }

  _leaveUserAgentShadowDOM(node: SDK.DOMModel.DOMNode): SDK.DOMModel.DOMNode {
    let userAgentShadowRoot;
    while ((userAgentShadowRoot = node.ancestorUserAgentShadowRoot()) && userAgentShadowRoot.parentNode) {
      node = userAgentShadowRoot.parentNode;
    }
    return node;
  }

  revealAndSelectNode(node: SDK.DOMModel.DOMNode, focus: boolean, omitHighlight?: boolean|undefined): Promise<void> {
    this._omitDefaultSelection = true;

    node = Common.Settings.Settings.instance().moduleSetting('showUAShadowDOM').get() ?
        node :
        this._leaveUserAgentShadowDOM(node);
    if (!omitHighlight) {
      node.highlightForTwoSeconds();
    }

    return UI.ViewManager.ViewManager.instance().showView('elements', false, !focus).then(() => {
      this.selectDOMNode(node, focus);
      delete this._omitDefaultSelection;

      if (!this._notFirstInspectElement) {
        ElementsPanel._firstInspectElementNodeNameForTest = node.nodeName();
        ElementsPanel._firstInspectElementCompletedForTest();
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.inspectElementCompleted();
      }
      this._notFirstInspectElement = true;
    });
  }

  _showUAShadowDOMChanged() {
    for (const treeOutline of this._treeOutlines) {
      treeOutline.update();
    }
  }

  _setupTextSelectionHack(stylePaneWrapperElement: HTMLElement) {
    // We "extend" the sidebar area when dragging, in order to keep smooth text
    // selection. It should be replaced by 'user-select: contain' in the future.
    const uninstallHackBound = uninstallHack.bind(this);

    // Fallback to cover unforeseen cases where text selection has ended.
    const uninstallHackOnMousemove = /** @param {!Event} event */ /** @param {!Event} event */ (
        /** @param {!Event} event */ /** @param {!Event} event */ event: Event) => {
      if (/** @type {!MouseEvent} */ (event as MouseEvent).buttons === 0) {
        uninstallHack.call(this);
      }
    };

    stylePaneWrapperElement.addEventListener(
        'mousedown', /** @param {!Event} event */ /** @param {!Event} event */
        (/** @param {!Event} event */ /** @param {!Event} event */ event: Event) => {
          if (/** @type {!MouseEvent} */ (event as MouseEvent).button !== 0 /* left or main button */) {
            return;
          }
          this._splitWidget.element.classList.add('disable-resizer-for-elements-hack');
          stylePaneWrapperElement.style.setProperty('height', `${stylePaneWrapperElement.offsetHeight}px`);
          const largeLength = 1000000;
          stylePaneWrapperElement.style.setProperty('left', `${- 1 * largeLength}px`);
          stylePaneWrapperElement.style.setProperty('padding-left', `${largeLength}px`);
          stylePaneWrapperElement.style.setProperty('width', `calc(100% + ${largeLength}px)`);
          stylePaneWrapperElement.style.setProperty('position', 'fixed');

          stylePaneWrapperElement.window().addEventListener('blur', uninstallHackBound);
          stylePaneWrapperElement.window().addEventListener('contextmenu', uninstallHackBound, true);
          stylePaneWrapperElement.window().addEventListener('dragstart', uninstallHackBound, true);
          stylePaneWrapperElement.window().addEventListener('mousemove', uninstallHackOnMousemove, true);
          stylePaneWrapperElement.window().addEventListener('mouseup', uninstallHackBound, true);
          stylePaneWrapperElement.window().addEventListener('visibilitychange', uninstallHackBound);
        },
        true);

    function uninstallHack(this: !ElementsPanel) {
      this._splitWidget.element.classList.remove('disable-resizer-for-elements-hack');
      stylePaneWrapperElement.style.removeProperty('left');
      stylePaneWrapperElement.style.removeProperty('padding-left');
      stylePaneWrapperElement.style.removeProperty('width');
      stylePaneWrapperElement.style.removeProperty('position');

      stylePaneWrapperElement.window().removeEventListener('blur', uninstallHackBound);
      stylePaneWrapperElement.window().removeEventListener('contextmenu', uninstallHackBound, true);
      stylePaneWrapperElement.window().removeEventListener('dragstart', uninstallHackBound, true);
      stylePaneWrapperElement.window().removeEventListener('mousemove', uninstallHackOnMousemove, true);
      stylePaneWrapperElement.window().removeEventListener('mouseup', uninstallHackBound, true);
      stylePaneWrapperElement.window().removeEventListener('visibilitychange', uninstallHackBound);
    }
  }

  _initializeSidebarPanes(splitMode: _splitMode) {
    this._splitWidget.setVertical(splitMode === _splitMode.Vertical);
    this.showToolbarPane(null /* widget */, null /* toggle */);

    const matchedStylePanesWrapper = new UI.Widget.VBox();
    matchedStylePanesWrapper.element.classList.add('style-panes-wrapper');
    this._stylesWidget.show(matchedStylePanesWrapper.element);
    this._setupTextSelectionHack(matchedStylePanesWrapper.element);

    const computedStylePanesWrapper = new UI.Widget.VBox();
    computedStylePanesWrapper.element.classList.add('style-panes-wrapper');
    this._computedStyleWidget.show(computedStylePanesWrapper.element);

    const stylesSplitWidget = new UI.SplitWidget.SplitWidget(
        true /* isVertical */, true /* secondIsSidebar */, 'elements.styles.sidebar.width', 100);
    stylesSplitWidget.setMainWidget(matchedStylePanesWrapper);
    stylesSplitWidget.hideSidebar();
    stylesSplitWidget.enableShowModeSaving();
    stylesSplitWidget.addEventListener(UI.SplitWidget.Events.ShowModeChanged, () => {
      showMetricsWidgetInStylesPane();
    });
    this._stylesWidget.addEventListener(StylesSidebarPaneEvents.InitialUpdateCompleted, () => {
      this._stylesWidget.appendToolbarItem(stylesSplitWidget.createShowHideSidebarButton(ls`Computed Styles sidebar`));
    });

    const showMetricsWidgetInComputedPane = () => {
      this._metricsWidget.show(computedStylePanesWrapper.element, this._computedStyleWidget.element);
      this._metricsWidget.toggleVisibility(true /* visible */);
      this._stylesWidget.removeEventListener(StylesSidebarPaneEvents.StylesUpdateCompleted, toggleMetricsWidget);
    };

    const showMetricsWidgetInStylesPane = () => {
      const showMergedComputedPane = stylesSplitWidget.showMode() === UI.SplitWidget.ShowMode.Both;
      if (showMergedComputedPane) {
        showMetricsWidgetInComputedPane();
      } else {
        this._metricsWidget.show(matchedStylePanesWrapper.element);
        if (!this._stylesWidget.hasMatchedStyles) {
          this._metricsWidget.toggleVisibility(false /* invisible */);
        }
        this._stylesWidget.addEventListener(StylesSidebarPaneEvents.StylesUpdateCompleted, toggleMetricsWidget);
      }
    };

    let skippedInitialTabSelectedEvent: true|false = false;

    const toggleMetricsWidget = (event: Common.EventTarget.EventTargetEvent) => {
      this._metricsWidget.toggleVisibility(event.data.hasMatchedStyles);
    };

    const tabSelected = (event: Common.EventTarget.EventTargetEvent) => {
      const tabId: string = (event.data.tabId as string);
      if (tabId === Common.UIString.UIString('Computed')) {
        computedStylePanesWrapper.show(computedView.element);
        showMetricsWidgetInComputedPane();
      } else if (tabId === Common.UIString.UIString('Styles')) {
        stylesSplitWidget.setSidebarWidget(computedStylePanesWrapper);
        showMetricsWidgetInStylesPane();
      }

      if (skippedInitialTabSelectedEvent) {
        // We don't log the initially selected sidebar pane to UMA because
        // it will skew the histogram heavily toward the Styles pane
        Host.userMetrics.sidebarPaneShown(tabId);
      } else {
        skippedInitialTabSelectedEvent = true;
      }
    };

    this.sidebarPaneView = UI.ViewManager.ViewManager.instance().createTabbedLocation(
        () => UI.ViewManager.ViewManager.instance().showView('elements'));
    const tabbedPane = this.sidebarPaneView.tabbedPane();
    if (this._splitMode !== _splitMode.Vertical) {
      this._splitWidget.installResizer(tabbedPane.headerElement());
    }

    const stylesView = new UI.View.SimpleView(Common.UIString.UIString('Styles'));
    this.sidebarPaneView.appendView(stylesView);
    stylesView.element.classList.add('flex-auto');
    stylesSplitWidget.show(stylesView.element);

    const computedView = new UI.View.SimpleView(Common.UIString.UIString('Computed'));
    computedView.element.classList.add('composite', 'fill');

    tabbedPane.addEventListener(UI.TabbedPane.Events.TabSelected, tabSelected, this);
    this.sidebarPaneView.appendView(computedView);
    this._stylesViewToReveal = stylesView;

    this.sidebarPaneView.appendApplicableItems('elements-sidebar');
    const extensionSidebarPanes = Extensions.ExtensionServer.ExtensionServer.instance().sidebarPanes();
    for (let i = 0; i < extensionSidebarPanes.length; ++i) {
      this._addExtensionSidebarPane(extensionSidebarPanes[i]);
    }

    this._splitWidget.setSidebarWidget(this.sidebarPaneView.tabbedPane());
  }

  _updateSidebarPosition() {
    if (this.sidebarPaneView && this.sidebarPaneView.tabbedPane().shouldHideOnDetach()) {
      return;
    }  // We can't reparent extension iframes.

    const position = Common.Settings.Settings.instance().moduleSetting('sidebarPosition').get();
    let splitMode: _splitMode.Vertical|_splitMode.Horizontal = _splitMode.Horizontal;
    if (position === 'right' ||
        (position === 'auto' && UI.InspectorView.InspectorView.instance().element.offsetWidth > 680)) {
      splitMode = _splitMode.Vertical;
    }
    if (!this.sidebarPaneView) {
      this._initializeSidebarPanes(splitMode);
      return;
    }
    if (splitMode === this._splitMode) {
      return;
    }
    this._splitMode = splitMode;

    const tabbedPane = this.sidebarPaneView.tabbedPane();
    this._splitWidget.uninstallResizer(tabbedPane.headerElement());

    this._splitWidget.setVertical(this._splitMode === _splitMode.Vertical);
    this.showToolbarPane(null /* widget */, null /* toggle */);

    if (this._splitMode !== _splitMode.Vertical) {
      this._splitWidget.installResizer(tabbedPane.headerElement());
    }
  }

  _extensionSidebarPaneAdded(event: Common.EventTarget.EventTargetEvent) {
    const pane = (event.data as Extensions.ExtensionPanel.ExtensionSidebarPane);
    this._addExtensionSidebarPane(pane);
  }

  _addExtensionSidebarPane(pane: Extensions.ExtensionPanel.ExtensionSidebarPane) {
    if (this.sidebarPaneView && pane.panelName() === this.name) {
      this.sidebarPaneView.appendView(pane);
    }
  }

  _setupStyleTracking(cssModel: SDK.CSSModel.CSSModel) {
    if (Root.Runtime.experiments.isEnabled('cssGridFeatures')) {
      // Style tracking is conditional on enabling experimental Grid features
      // because it's the only use case for now.
      const gridStyleTracker = cssModel.createCSSPropertyTracker(TrackedCSSGridProperties);
      gridStyleTracker.start();
      this._gridStyleTrackerByCSSModel.set(cssModel, gridStyleTracker);
      gridStyleTracker.addEventListener(
          SDK.CSSModel.CSSPropertyTrackerEvents.TrackedCSSPropertiesUpdated, this._trackedCSSPropertiesUpdated, this);
    }
  }

  _removeStyleTracking(cssModel: SDK.CSSModel.CSSModel) {
    const gridStyleTracker = this._gridStyleTrackerByCSSModel.get(cssModel);
    if (!gridStyleTracker) {
      return;
    }

    gridStyleTracker.stop();
    this._gridStyleTrackerByCSSModel.delete(cssModel);
    gridStyleTracker.removeEventListener(
        SDK.CSSModel.CSSPropertyTrackerEvents.TrackedCSSPropertiesUpdated, this._trackedCSSPropertiesUpdated, this);
  }

  _trackedCSSPropertiesUpdated(event: Common.EventTarget.EventTargetEvent) {
    const domNodes = (event.data.domNodes as (SDK.DOMModel.DOMNode | null)[]);

    for (const domNode of domNodes) {
      if (!domNode) {
        continue;
      }
      const treeElement = this._treeElementForNode(domNode);
      if (treeElement) {
        treeElement.updateStyleAdorners();
      }
    }
  }
}

ElementsPanel._firstInspectElementCompletedForTest = function() {};
ElementsPanel._firstInspectElementNodeNameForTest = '';

export const enum _splitMode {
  Vertical = 'Vertical',
  Horizontal = 'Horizontal'
}


const TrackedCSSGridProperties = [
  {
    name: 'display',
    value: 'grid',
  },
  {
    name: 'display',
    value: 'inline-grid',
  },
  {
    name: 'display',
    value: 'flex',
  },
  {
    name: 'display',
    value: 'inline-flex',
  },
];

/** @type {!ContextMenuProvider} */
let contextMenuProviderInstance;

export class ContextMenuProvider implements UI.ContextMenu.Provider {
  /**
   * @override
   */
  appendApplicableItems(event: Event, contextMenu: UI.ContextMenu.ContextMenu, object: Object) {
    if (!(object instanceof SDK.RemoteObject.RemoteObject && (object as SDK.RemoteObject.RemoteObject).isNode()) &&
        !(object instanceof SDK.DOMModel.DOMNode) && !(object instanceof SDK.DOMModel.DeferredDOMNode)) {
      return;
    }

    // Skip adding "Reveal..." menu item for our own tree outline.
    if (ElementsPanel.instance().element.isAncestor((event.target as Node))) {
      return;
    }
    /** @type {function():*} */
    const commandCallback = Common.Revealer.reveal.bind(Common.Revealer.Revealer, object);
    contextMenu.revealSection().appendItem(Common.UIString.UIString('Reveal in Elements panel'), commandCallback);
  }

  static instance() {
    if (!contextMenuProviderInstance) {
      contextMenuProviderInstance = new ContextMenuProvider();
    }
    return contextMenuProviderInstance;
  }
}

export class DOMNodeRevealer implements Common.Revealer.Revealer {
  /**
   * @override
   */
  reveal(node: Object, omitFocus?: boolean|undefined): Promise<void> {
    const panel = ElementsPanel.instance();
    panel._pendingNodeReveal = true;

    return new Promise(revealPromise);

    function revealPromise(resolve: () => void, reject: (arg0: Error) => void) {
      if (node instanceof SDK.DOMModel.DOMNode) {
        onNodeResolved((node as SDK.DOMModel.DOMNode));
      } else if (node instanceof SDK.DOMModel.DeferredDOMNode) {
        (/** @type {!SDK.DOMModel.DeferredDOMNode} */ node as SDK.DOMModel.DeferredDOMNode)
            .resolve(checkDeferredDOMNodeThenReveal);
      } else if (node instanceof SDK.RemoteObject.RemoteObject) {
        const domModel = (node as SDK.RemoteObject.RemoteObject).runtimeModel().target().model(SDK.DOMModel.DOMModel);
        if (domModel) {
          domModel.pushObjectAsNodeToFrontend(node).then(checkRemoteObjectThenReveal);
        } else {
          reject(new Error('Could not resolve a node to reveal.'));
        }
      } else {
        reject(new Error('Can\'t reveal a non-node.'));
        panel._pendingNodeReveal = false;
      }

      function onNodeResolved(resolvedNode: SDK.DOMModel.DOMNode) {
        panel._pendingNodeReveal = false;

        // A detached node could still have a parent and ownerDocument
        // properties, which means stepping up through the hierarchy to ensure
        // that the root node is the document itself. Any break implies
        // detachment.
        let currentNode: SDK.DOMModel.DOMNode = resolvedNode;
        while (currentNode.parentNode) {
          currentNode = currentNode.parentNode;
        }
        const isDetached = !(currentNode instanceof SDK.DOMModel.DOMDocument);

        const isDocument = node instanceof SDK.DOMModel.DOMDocument;
        if (!isDocument && isDetached) {
          const msg = ls`Node cannot be found in the current page.`;
          Common.Console.Console.instance().warn(msg);
          reject(new Error(msg));
          return;
        }

        if (resolvedNode) {
          panel.revealAndSelectNode(resolvedNode, !omitFocus).then(resolve);
          return;
        }
        reject(new Error('Could not resolve node to reveal.'));
      }

      function checkRemoteObjectThenReveal(resolvedNode: SDK.DOMModel.DOMNode|null) {
        if (!resolvedNode) {
          const msg = ls`The remote object could not be resolved into a valid node.`;
          Common.Console.Console.instance().warn(msg);
          reject(new Error(msg));
          return;
        }
        onNodeResolved(resolvedNode);
      }

      function checkDeferredDOMNodeThenReveal(resolvedNode: SDK.DOMModel.DOMNode|null) {
        if (!resolvedNode) {
          const msg = ls`The deferred DOM Node could not be resolved into a valid node.`;
          Common.Console.Console.instance().warn(msg);
          reject(new Error(msg));
          return;
        }
        onNodeResolved(resolvedNode);
      }
    }
  }
}

export class CSSPropertyRevealer implements Common.Revealer.Revealer {
  /**
   * @override
   */
  reveal(property: Object): Promise<void> {
    const panel = ElementsPanel.instance();
    return panel._revealProperty((property as SDK.CSSProperty.CSSProperty));
  }
}

/** @type {!ElementsActionDelegate} */
let elementsActionDelegateInstance;

export class ElementsActionDelegate implements UI.ActionRegistration.ActionDelegate {
  handleAction(context: UI.Context.Context, actionId: string): boolean {
    const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!node) {
      return true;
    }
    const treeOutline = ElementsTreeOutline.forDOMModel(node.domModel());
    if (!treeOutline) {
      return true;
    }

    switch (actionId) {
      case 'elements.hide-element':
        treeOutline.toggleHideElement(node);
        return true;
      case 'elements.edit-as-html':
        treeOutline.toggleEditAsHTML(node);
        return true;
      case 'elements.duplicate-element':
        treeOutline.duplicateNode(node);
        return true;
      case 'elements.undo':
        SDK.DOMModel.DOMModelUndoStack.instance().undo();
        ElementsPanel.instance()._stylesWidget.forceUpdate();
        return true;
      case 'elements.redo':
        SDK.DOMModel.DOMModelUndoStack.instance().redo();
        ElementsPanel.instance()._stylesWidget.forceUpdate();
        return true;
    }
    return false;
  }

  static instance(opts: {forceNew: boolean|null;}|undefined = {forceNew: null}): ElementsActionDelegate {
    const {forceNew} = opts;
    if (!elementsActionDelegateInstance || forceNew) {
      elementsActionDelegateInstance = new ElementsActionDelegate();
    }

    return elementsActionDelegateInstance;
  }
}

export class PseudoStateMarkerDecorator implements MarkerDecorator {
  decorate(node: SDK.DOMModel.DOMNode): {title: string; color: string;}|null {
    const pseudoState = node.domModel().cssModel().pseudoState(node);
    if (!pseudoState) {
      return null;
    }

    return {color: 'orange', title: Common.UIString.UIString('Element state: %s', ':' + pseudoState.join(', :'))};
  }
}
