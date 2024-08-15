// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';

import {HeapDatachedElementsDataGridNode} from './HeapDetachedElementsDataGrids.js';
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
   *@description Text in Heap Snapshot View of a profiler tool
   */
  detachedNodes: 'Detached Nodes',
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

export class DetachedElementsProfileView extends UI.View.SimpleView implements DataDisplayDelegate {
  readonly selectedSizeText: UI.Toolbar.ToolbarText;
  dataGrid: DataGrid.DataGrid.DataGridImpl<unknown>;
  profile: DetachedElementsProfileHeader;
  readonly parentDataDisplayDelegate: DataDisplayDelegate;

  constructor(dataDisplayDelegate: DataDisplayDelegate, profile: DetachedElementsProfileHeader) {
    super(i18nString(UIStrings.detachedElementsTitle));

    this.element.classList.add('detached-elements-view');

    const columns = ([] as DataGrid.DataGrid.ColumnDescriptor[]);
    columns.push({
      id: 'detached-node',
      title: i18nString(UIStrings.detachedNodes),
      sortable: false,
    });
    columns.push({
      id: 'detached-node-count',
      title: i18nString(UIStrings.nodeSize),
      sortable: false,
      disclosure: true,
    });

    this.dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: i18nString(UIStrings.detachedElementsList),
      columns,
      editCallback: undefined,
      deleteCallback: undefined,
      refreshCallback: undefined,
    });

    this.profile = profile;
    this.parentDataDisplayDelegate = dataDisplayDelegate;

    this.selectedSizeText = new UI.Toolbar.ToolbarText();

    this.populateElementsGrid(profile.detachedElements);
    this.dataGrid.asWidget().contentElement.classList.add('no-border-top-datagrid');
    this.dataGrid.setStriped(true);
    this.dataGrid.asWidget().show(this.element);
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
    if (!detachedElements) {
      return;
    }

    for (const detachedElement of detachedElements) {
      this.dataGrid.rootNode().appendChild(new HeapDatachedElementsDataGridNode(detachedElement));
    }
  }

  override async toolbarItems(): Promise<UI.Toolbar.ToolbarItem[]> {
    return [...await super.toolbarItems(), this.selectedSizeText];
  }
}

export class DetachedElementsProfileType extends
    Common.ObjectWrapper.eventMixin<DetachedElementsProfileType.EventTypes, typeof ProfileType>(ProfileType) {
  constructor(typeId?: string, description?: string) {
    super(
        typeId || i18nString(UIStrings.detachedElementsTitle),
        description || i18nString(UIStrings.detachedElementsTitle));
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
    const target = heapProfilerModel?.target();
    const domModel = target?.model(SDK.DOMModel.DOMModel);

    if (!heapProfilerModel || !target || !domModel) {
      return;
    }
    const data = await domModel.getDetachedDOMNodes();

    const profile: DetachedElementsProfileHeader = new DetachedElementsProfileHeader(heapProfilerModel, this, data);
    this.addProfile(profile);

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
