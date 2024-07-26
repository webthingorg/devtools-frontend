// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import * as Elements from '../../panels/elements/elements.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';

import {
  type DataDisplayDelegate,
  ProfileEvents as ProfileTypeEvents,
  type ProfileHeader,
  ProfileType,
} from './ProfileHeader.js';
import {WritableProfileHeader} from './ProfileView.js';

const UIStrings = {
  /**
   *@description Button text to obtain the detached elements retained by JS
   */
  startDetachedElements: 'Obtain Detached Elements',
  /**
   *@description Sampling category to only profile allocations happening on the heap
   */
  allocationSampling: 'Detached Elements',
  /**
   *@description The title for the collection of profiles that are gathered from various snapshots of the heap, using a sampling (e.g. every 1/100) technique.
   */
  detachedElementsTitle: 'Detached Elements',
  /**
   *@description Description in Heap Profile View of a profiler tool
   */
  detachedElementsDescription: 'Detached Elements shows objects that are retained by a JS reference.',
  /**
   *@description Name of a profile
   *@example {2} PH1
   */
  profileD: 'Detached Elements {PH1}',

  /**
   *@description Text in Detached Elements View of a profiler tool
   */
  detachedElements: 'Detached Elements',
  /**
   *@description Text in Heap Snapshot View of a profiler tool
   */
  detachedNodes: 'Detached Nodes',
  /**
   *@description Title default for nodes displayed in the grid
   */
  detachedNode: 'Detached Node',
  /**
   *@description Text in Heap Snapshot View of a profiler tool
   */
  nodeSize: 'Node Count',
  /**
   *@description Label for the detached elements table
   */
  detachedElementsList: 'Detached Elements List',
};
const str_ = i18n.i18n.registerUIStrings('panels/profiler/HeapDetachedElementsView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

type GridContainer = {
  header: HTMLDivElement,
  container: HTMLDivElement,
  grid: DataGrid.DataGridControllerIntegrator.DataGridControllerIntegrator,
};

export class DetachedElementsProfileView extends UI.View.SimpleView implements DataDisplayDelegate {
  readonly profileType: DetachedElementsProfileType;
  readonly selectedSizeText: UI.Toolbar.ToolbarText;
  readonly linkifierInternal: Components.Linkifier.Linkifier;

  profile: DetachedElementsProfileHeader;
  readonly parentDataDisplayDelegate: DataDisplayDelegate;
  readonly linkifier: Components.Linkifier.Linkifier;

  private gridsContainer: HTMLDivElement;
  private gridContainer: GridContainer;
  private nodeIDsSet: Set<number> = new Set<number>();

  constructor(dataDisplayDelegate: DataDisplayDelegate, profile: DetachedElementsProfileHeader) {
    super(i18nString(UIStrings.detachedElements));

    this.element.classList.add('detached-elements-view');
    const content = this.element.createChild('div', 'detached-elements-container');
    this.gridsContainer = content.createChild('div', 'detached-elements-nodes-container') as HTMLDivElement;
    this.gridContainer = this.initGridContainer();

    this.linkifier = new Components.Linkifier.Linkifier();

    this.profile = profile;
    this.profileType = profile.profileType();
    this.parentDataDisplayDelegate = dataDisplayDelegate;

    this.selectedSizeText = new UI.Toolbar.ToolbarText();

    this.linkifierInternal = new Components.Linkifier.Linkifier(30);
    this.populateElementsGrid(profile.detachedElements);
    this.gridContainer.grid.show(content);
  }
  showProfile(profile: ProfileHeader|null): UI.Widget.Widget|null {
    return this.parentDataDisplayDelegate.showProfile(profile);
  }
  showObject(objectId: string, perspectiveName: string): void {
    this.parentDataDisplayDelegate.showObject(objectId, perspectiveName);
  }
  async linkifyObject(): Promise<Element|null> {
    return null;
  }

  populateElementsGrid(detachedElements: Protocol.DOM.DetachedElementInfo[]|null): void {
    const sampleModels: SDK.DOMModel.DOMModel[] =
        SDK.TargetManager.TargetManager.instance().models(SDK.DOMModel.DOMModel);

    const newRows: DataGrid.DataGridUtils.Row[] = [];
    detachedElements?.forEach(detachedElementInfo => {
      // Create a row for each node
      detachedElementInfo.retainedNodeIds.forEach(nodeId => {
        this.nodeIDsSet.add(nodeId as number);
      });
      const DOMNode = SDK.DOMModel.DOMNode.create(sampleModels[0], null, false, detachedElementInfo.treeNode);
      const newRow = this.createRowForNode(DOMNode, this.getNodeSize(detachedElementInfo));
      newRows.push(newRow);
    });
    const grid = this.gridContainer.grid;
    grid.update({...grid.data(), rows: newRows});
  }
  private getNodeSize(detachedElementInfo: Protocol.DOM.DetachedElementInfo): number {
    let count: number = 1;
    const queue: Protocol.DOM.Node[] = [];
    let node: Protocol.DOM.Node|undefined;
    queue.push(detachedElementInfo.treeNode);
    while (queue.length > 0) {
      node = queue.shift();
      if (!node) {
        break;
      }
      if (node.childNodeCount) {
        count += node.childNodeCount;
      }
      node.children?.forEach((child: Protocol.DOM.Node) => {
        queue.push(child);
      });
    }

    return count;
  }

  private nodeRenderer = (node: DataGrid.DataGridUtils.CellValue): LitHtml.TemplateResult => {
    if (!node) {
      return LitHtml.html`<div></div>`;
    }
    const treeOutline = new Elements.ElementsTreeOutline.ElementsTreeOutline(
        /* omitRootDOMNode: */ false, /* selectEnabled: */ false, /* hideGutter: */ true);
    if (!treeOutline) {
      return LitHtml.html`<div></div>`;
    }
    treeOutline.rootDOMNode = node as SDK.DOMModel.DOMNode;
    const firstChild = treeOutline.firstChild();
    if (firstChild && !firstChild.isExpandable()) {
      treeOutline.element.classList.add('single-node');
    }
    treeOutline.setVisible(true);
    // @ts-ignore used in console_test_runner
    treeOutline.element.treeElementForTest = firstChild;
    treeOutline.setShowSelectionOnKeyboardFocus(/* show: */ true, /* preventTabOrder: */ true);

    const nodes: SDK.DOMModel.DOMNode[] = [];

    nodes.push(node as SDK.DOMModel.DOMNode);

    // Iterate through descendants to mark the nodes that were specifically retained in JS references.
    while (nodes.length > 0) {
      const nodeptr: SDK.DOMModel.DOMNode|undefined = nodes.shift();
      if (!nodeptr) {
        break;
      }
      nodeptr?.children()?.forEach(child => {
        nodes.push(child);
      });

      const treeElement = treeOutline.findTreeElement(nodeptr);
      // If true, this node is retained in JS, and should be marked.
      if (this.nodeIDsSet.has(nodeptr.backendNodeId() as number)) {
        const icon = new IconButton.Icon.Icon();
        icon.data = {iconName: 'small-status-dot', color: 'var(--icon-error)', width: '12px', height: '12px'};
        icon.style.setProperty('vertical-align', 'middle');
        treeElement?.setLeadingIcons([icon]);
        treeElement?.listItemNode.classList.add('detached-elements-detached-node');
        treeElement?.listItemNode.style.setProperty('display', '-webkit-box');
        treeElement?.listItemNode.setAttribute('title', 'Retained Node');
      } else {
        treeElement?.listItemNode.setAttribute('title', 'Node');
      }
    }

    treeOutline.findTreeElement(node as SDK.DOMModel.DOMNode)?.listItemNode.setAttribute('title', 'Detached Tree Node');

    return LitHtml.html`<div>${treeOutline.element}</div>`;
  };
  private createRowForNode(node: SDK.DOMModel.DOMNode, size: number): DataGrid.DataGridUtils.Row {
    return {
      cells: [
        {
          columnId: 'node',
          value: node,
          renderer: this.nodeRenderer,
          title: i18nString(UIStrings.detachedNode),
        },
        {
          columnId: 'node_count',
          value: size,
          renderer: DataGrid.DataGridRenderers.primitiveRenderer,
        },
      ],
      hidden: false,
    };
  }
  private initGridContainer(): GridContainer {
    const div = this.gridsContainer.createChild('div') as HTMLDivElement;
    div.classList.add('target-container');
    const header = div.createChild('div') as HTMLDivElement;
    header.classList.add('header');
    const gridContainer = div.createChild('div') as HTMLDivElement;
    gridContainer.classList.add('grid-container');

    const dataGridInitialData: DataGrid.DataGridController.DataGridControllerData = {
      columns: [
        {
          id: 'node',
          title: i18nString(UIStrings.detachedNodes),
          sortable: false,
          widthWeighting: 4,
          visible: true,
          hideable: false,
        },
        {
          id: 'node_count',
          title: i18nString(UIStrings.nodeSize),
          sortable: true,
          widthWeighting: 1,
          visible: true,
          hideable: false,
        },
      ],
      rows: [],
      contextMenus: {},
      label: UIStrings.detachedElementsList,
    };

    const dataGridIntegrator =
        new DataGrid.DataGridControllerIntegrator.DataGridControllerIntegrator(dataGridInitialData);
    dataGridIntegrator.show(gridContainer);
    return {container: div, header: header, grid: dataGridIntegrator};
  }

  override async toolbarItems(): Promise<UI.Toolbar.ToolbarItem[]> {
    return [...await super.toolbarItems(), this.selectedSizeText];
  }
}

export class DetachedElementsProfileType extends
    Common.ObjectWrapper.eventMixin<DetachedElementsProfileType.EventTypes, typeof ProfileType>(ProfileType) {
  recording: boolean;

  constructor(typeId?: string, description?: string) {
    super(typeId || i18nString(UIStrings.allocationSampling), description || i18nString(UIStrings.allocationSampling));
    this.recording = false;
  }

  override profileBeingRecorded(): DetachedElementsProfileHeader|null {
    return super.profileBeingRecorded() as DetachedElementsProfileHeader | null;
  }

  override get buttonTooltip(): Common.UIString.LocalizedString {
    return i18nString(UIStrings.startDetachedElements);
  }

  override buttonClicked(): boolean {
    void this.getDetachedElements();
    return false;
  }

  async getDetachedElements(): Promise<void> {
    if (this.profileBeingRecorded()) {
      return;
    }
    const heapProfilerModel = UI.Context.Context.instance().flavor(SDK.HeapProfilerModel.HeapProfilerModel);
    if (!heapProfilerModel) {
      return;
    }
    const target = heapProfilerModel.target();
    if (!target) {
      return;
    }
    const domModel = target.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return;
    }
    const data = await domModel.getDetachedDOMNodes();

    let profile: DetachedElementsProfileHeader = new DetachedElementsProfileHeader(heapProfilerModel, this, data);
    this.setProfileBeingRecorded(profile);
    this.addProfile(profile);

    profile = this.profileBeingRecorded() as DetachedElementsProfileHeader;
    if (!profile) {
      return;
    }

    this.setProfileBeingRecorded(null);
    this.dispatchEventToListeners(ProfileTypeEvents.ProfileComplete, profile);
  }

  override get treeItemTitle(): Common.UIString.LocalizedString {
    return i18nString(UIStrings.detachedElementsTitle);
  }

  override get description(): string {
    return i18nString(UIStrings.detachedElementsDescription);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  static readonly TypeId = 'DetachedElements';
}

export namespace DetachedElementsProfileType {
  export const enum Events {
    RecordingStopped = 'RecordingStopped',
    StatsUpdate = 'StatsUpdate',
    DetachedElementsObtained = 'DetachedElementsObtained',
  }

  export type EventTypes = {
    [Events.RecordingStopped]: void,
    [Events.StatsUpdate]: Protocol.HeapProfiler.SamplingHeapProfile|null,
    [Events.DetachedElementsObtained]: Protocol.DOM.DetachedElementInfo[]|null,
  };
}

export class DetachedElementsProfileHeader extends WritableProfileHeader {
  readonly heapProfilerModelInternal: SDK.HeapProfilerModel.HeapProfilerModel|null;
  readonly detachedElements: Protocol.DOM.DetachedElementInfo[]|null;
  constructor(
      heapProfilerModel: SDK.HeapProfilerModel.HeapProfilerModel|null, type: DetachedElementsProfileType,
      detachedElements: Protocol.DOM.DetachedElementInfo[]|null, title?: string) {
    super(
        heapProfilerModel && heapProfilerModel.debuggerModel(), type,
        title || i18nString(UIStrings.profileD, {PH1: type.nextProfileUid()}));
    this.detachedElements = detachedElements;
    this.heapProfilerModelInternal = heapProfilerModel;
  }

  override createView(dataDisplayDelegate: DataDisplayDelegate): DetachedElementsProfileView {
    return new DetachedElementsProfileView(dataDisplayDelegate, this);
  }

  heapProfilerModel(): SDK.HeapProfilerModel.HeapProfilerModel|null {
    return this.heapProfilerModelInternal;
  }

  override profileType(): DetachedElementsProfileType {
    return super.profileType() as DetachedElementsProfileType;
  }
}
