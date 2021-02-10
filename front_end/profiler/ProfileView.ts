// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Bindings from '../bindings/bindings.js';
import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as DataGrid from '../data_grid/data_grid.js'; // eslint-disable-line no-unused-vars
import * as Host from '../host/host.js';
import * as i18n from '../i18n/i18n.js';
import * as PerfUI from '../perf_ui/perf_ui.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js'; // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

import { BottomUpProfileDataGridTree } from './BottomUpProfileDataGrid.js';
import { CPUProfileFlameChart, ProfileFlameChartDataProvider } from './CPUProfileFlameChart.js'; // eslint-disable-line no-unused-vars
import { Formatter, ProfileDataGridNode, ProfileDataGridTree } from './ProfileDataGrid.js'; // eslint-disable-line no-unused-vars
import { DataDisplayDelegate, Events, ProfileHeader, ProfileType } from './ProfileHeader.js'; // eslint-disable-line no-unused-vars
import { ProfileSidebarTreeElement } from './ProfileSidebarTreeElement.js';
import { TopDownProfileDataGridTree } from './TopDownProfileDataGrid.js';

export const UIStrings = {
  /**
  *@description Text in Profile View of a profiler tool
  */
  profile: 'Profile',
  /**
  *@description Text in Profile View of a profiler tool
  */
  findByCostMsNameOrFile: 'Find by cost (>50ms), name or file',
  /**
  *@description Text for a programming function
  */
  function: 'Function',
  /**
  *@description Title of the Profiler tool
  */
  profiler: 'Profiler',
  /**
  *@description Aria-label for profiles view combobox in memory tool
  */
  profileViewMode: 'Profile view mode',
  /**
  *@description Tooltip text that appears when hovering over the largeicon visibility button in the Profile View of a profiler tool
  */
  focusSelectedFunction: 'Focus selected function',
  /**
  *@description Tooltip text that appears when hovering over the largeicon delete button in the Profile View of a profiler tool
  */
  excludeSelectedFunction: 'Exclude selected function',
  /**
  *@description Tooltip text that appears when hovering over the largeicon refresh button in the Profile View of a profiler tool
  */
  restoreAllFunctions: 'Restore all functions',
  /**
  *@description Text in Profile View of a profiler tool
  */
  chart: 'Chart',
  /**
  *@description Text in Profile View of a profiler tool
  */
  heavyBottomUp: 'Heavy (Bottom Up)',
  /**
  *@description Text in Profile View of a profiler tool
  */
  treeTopDown: 'Tree (Top Down)',
  /**
   *@description Name of a profile
  *@example {2} PH1
  */
  profileD: 'Profile {PH1}',
  /**
   *@description Text in Profile View of a profiler tool
  *@example {4 MB} PH1
  */
  loadingD: 'Loading… {PH1}%',
  /**
  *@description Text in Profile View of a profiler tool
  *@example {example.file} PH1
  *@example {cannot open file} PH2
  */
  fileSReadErrorS: 'File \'{PH1}\' read error: {PH2}',
  /**
  *@description Text when something is loading
  */
  loading: 'Loading…',
  /**
  *@description Text in Profile View of a profiler tool
  */
  failedToReadFile: 'Failed to read file',
  /**
  *@description Text in Profile View of a profiler tool
  */
  parsing: 'Parsing…',
  /**
  *@description Text in Profile View of a profiler tool
  */
  loaded: 'Loaded',
};
const str_ = i18n.i18n.registerUIStrings('profiler/ProfileView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
// Transformation: updatePropertyDeclarations
// Transformation: updateInterfacesImplementations
export class ProfileView extends UI.View.SimpleView implements UI.SearchableView.Searchable {
  _profile: SDK.ProfileTreeModel.ProfileTreeModel | null;
  _searchableView: UI.SearchableView.SearchableView;
  dataGrid: DataGrid.DataGrid.DataGridImpl<any>;
  viewSelectComboBox: UI.Toolbar.ToolbarComboBox;
  focusButton: UI.Toolbar.ToolbarButton;
  excludeButton: UI.Toolbar.ToolbarButton;
  resetButton: UI.Toolbar.ToolbarButton;
  _linkifier: Components.Linkifier.Linkifier;
  _nodeFormatter!: Formatter;
  _viewType!: Common.Settings.Setting<string>;
  adjustedTotal!: number;
  profileHeader!: WritableProfileHeader;
  _bottomUpProfileDataGridTree?: BottomUpProfileDataGridTree | null;
  _topDownProfileDataGridTree?: TopDownProfileDataGridTree | null;
  _currentSearchResultIndex?: number;
  _dataProvider?: ProfileFlameChartDataProvider;
  _flameChart?: CPUProfileFlameChart;
  _visibleView?: CPUProfileFlameChart | DataGrid.DataGrid.DataGridWidget<any>;
  _searchableElement?: ProfileDataGridTree | CPUProfileFlameChart;
  profileDataGridTree?: ProfileDataGridTree;
  // Transformation: updateParameters
  constructor() {
    super(i18nString(UIStrings.profile));

    this._profile = null;

    this._searchableView = new UI.SearchableView.SearchableView(this, null);
    this._searchableView.setPlaceholder(i18nString(UIStrings.findByCostMsNameOrFile));
    this._searchableView.show(this.element);

    const columns = ([] as DataGrid.DataGrid.ColumnDescriptor[]);
    columns.push({
      id: 'self',
      title: this.columnHeader('self'),
      width: '120px',
      fixedWidth: true,
      sortable: true,
      sort: DataGrid.DataGrid.Order.Descending,
      titleDOMFragment: undefined,
      align: undefined,
      editable: undefined,
      nonSelectable: undefined,
      longText: undefined,
      disclosure: undefined,
      weight: undefined,
      allowInSortByEvenWhenHidden: undefined,
      dataType: undefined,
      defaultWeight: undefined
    });
    columns.push({
      id: 'total',
      title: this.columnHeader('total'),
      width: '120px',
      fixedWidth: true,
      sortable: true,
      sort: undefined,
      titleDOMFragment: undefined,
      align: undefined,
      editable: undefined,
      nonSelectable: undefined,
      longText: undefined,
      disclosure: undefined,
      weight: undefined,
      allowInSortByEvenWhenHidden: undefined,
      dataType: undefined,
      defaultWeight: undefined
    });
    columns.push({
      id: 'function',
      title: i18nString(UIStrings.function),
      disclosure: true,
      sortable: true,
      sort: undefined,
      titleDOMFragment: undefined,
      align: undefined,
      editable: undefined,
      nonSelectable: undefined,
      longText: undefined,
      weight: undefined,
      allowInSortByEvenWhenHidden: undefined,
      dataType: undefined,
      defaultWeight: undefined,
      width: undefined,
      fixedWidth: undefined
    });

    this.dataGrid = new DataGrid.DataGrid.DataGridImpl({
      displayName: i18nString(UIStrings.profiler),
      columns,
      editCallback: undefined,
      deleteCallback: undefined,
      refreshCallback: undefined
    });
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged, this._sortProfile, this);
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SelectedNode, this._nodeSelected.bind(this, true));
    this.dataGrid.addEventListener(DataGrid.DataGrid.Events.DeselectedNode, this._nodeSelected.bind(this, false));
    this.dataGrid.setRowContextMenuCallback(this._populateContextMenu.bind(this));

    this.viewSelectComboBox =
      new UI.Toolbar.ToolbarComboBox(this._changeView.bind(this), i18nString(UIStrings.profileViewMode));

    this.focusButton =
      new UI.Toolbar.ToolbarButton(i18nString(UIStrings.focusSelectedFunction), 'largeicon-visibility');
    this.focusButton.setEnabled(false);
    this.focusButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._focusClicked, this);

    this.excludeButton =
      new UI.Toolbar.ToolbarButton(i18nString(UIStrings.excludeSelectedFunction), 'largeicon-delete');
    this.excludeButton.setEnabled(false);
    this.excludeButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._excludeClicked, this);

    this.resetButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.restoreAllFunctions), 'largeicon-refresh');
    this.resetButton.setEnabled(false);
    this.resetButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._resetClicked, this);

    this._linkifier = new Components.Linkifier.Linkifier(maxLinkLength);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  static buildPopoverTable(entryInfo: {
    title: string;
    value: string;
  }[]): Element {
    const table = document.createElement('table');
    for (const entry of entryInfo) {
      const row = table.createChild('tr');
      row.createChild('td').textContent = entry.title;
      row.createChild('td').textContent = entry.value;
    }
    return table;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setProfile(profile: SDK.ProfileTreeModel.ProfileTreeModel): void {
    this._profile = profile;
    this._bottomUpProfileDataGridTree = null;
    this._topDownProfileDataGridTree = null;
    this._changeView();
    this.refresh();
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profile(): SDK.ProfileTreeModel.ProfileTreeModel | null {
    return this._profile;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  initialize(nodeFormatter: Formatter): void {
    this._nodeFormatter = nodeFormatter;

    this._viewType = Common.Settings.Settings.instance().createSetting('profileView', ViewTypes.Heavy);
    const viewTypes = [ViewTypes.Flame, ViewTypes.Heavy, ViewTypes.Tree];

    const optionNames = new Map([
      [ViewTypes.Flame, i18nString(UIStrings.chart)],
      [ViewTypes.Heavy, i18nString(UIStrings.heavyBottomUp)],
      [ViewTypes.Tree, i18nString(UIStrings.treeTopDown)],
    ]);

    const options = new Map(viewTypes.map(
    // Transformation: updateParameters
    type => [type, this.viewSelectComboBox.createOption((optionNames.get(type) as string), type)]));
    const optionName = this._viewType.get() || viewTypes[0];
    const option = options.get(optionName) || options.get(viewTypes[0]);
    this.viewSelectComboBox.select((option as Element));

    this._changeView();
    if (this._flameChart) {
      this._flameChart.update();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  focus(): void {
    if (this._flameChart) {
      this._flameChart.focus();
    }
    else {
      super.focus();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  columnHeader(columnId: string): Common.UIString.LocalizedString {
    throw 'Not implemented';
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  selectRange(timeLeft: number, timeRight: number): void {
    if (!this._flameChart) {
      return;
    }
    this._flameChart.selectRange(timeLeft, timeRight);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async toolbarItems(): Promise<UI.Toolbar.ToolbarItem[]> {
    return [this.viewSelectComboBox, this.focusButton, this.excludeButton, this.resetButton];
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _getBottomUpProfileDataGridTree(): ProfileDataGridTree {
    if (!this._bottomUpProfileDataGridTree) {
      this._bottomUpProfileDataGridTree = new BottomUpProfileDataGridTree(this._nodeFormatter, this._searchableView, (this._profile as SDK.ProfileTreeModel.ProfileTreeModel).root, this.adjustedTotal);
    }
    return this._bottomUpProfileDataGridTree;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _getTopDownProfileDataGridTree(): ProfileDataGridTree {
    if (!this._topDownProfileDataGridTree) {
      this._topDownProfileDataGridTree = new TopDownProfileDataGridTree(this._nodeFormatter, this._searchableView, (this._profile as SDK.ProfileTreeModel.ProfileTreeModel).root, this.adjustedTotal);
    }
    return this._topDownProfileDataGridTree;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _populateContextMenu(contextMenu: UI.ContextMenu.ContextMenu, gridNode: DataGrid.DataGrid.DataGridNode<any>): void {
    const node = (gridNode as ProfileDataGridNode);
    if (node.linkElement && !contextMenu.containsTarget(node.linkElement)) {
      contextMenu.appendApplicableItems(node.linkElement);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  willHide(): void {
    this._currentSearchResultIndex = -1;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  refresh(): void {
    if (!this.profileDataGridTree) {
      return;
    }
    const selectedProfileNode = this.dataGrid.selectedNode ?
      (this.dataGrid.selectedNode as ProfileDataGridNode).profileNode :
      null;

    this.dataGrid.rootNode().removeChildren();

    const children = this.profileDataGridTree.children;
    const count = children.length;

    for (let index = 0; index < count; ++index) {
      this.dataGrid.rootNode().appendChild(children[index]);
    }

    if (selectedProfileNode) {
      // TODO(crbug.com/1011811): Cleanup the added `selected` property to this SDK class.
      // @ts-ignore
      selectedProfileNode.selected = true;
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  refreshVisibleData(): void {
    let 
    // Transformation: updateVariableDeclarations
    // Transformation: updateTypeDefinitionsForLocalTypes
    child: (DataGrid.DataGrid.DataGridNode<any> | null) = this.dataGrid.rootNode().children[0];
    while (child) {
      child.refresh();
      child = child.traverseNextNode(false, null, true);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  searchableView(): UI.SearchableView.SearchableView {
    return this._searchableView;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  supportsCaseSensitiveSearch(): boolean {
    return true;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  supportsRegexSearch(): boolean {
    return false;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  searchCanceled(): void {
    if (this._searchableElement) {
      this._searchableElement.searchCanceled();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  performSearch(searchConfig: UI.SearchableView.SearchConfig, shouldJump: boolean, jumpBackwards?: boolean): void {
    if (this._searchableElement) {
      this._searchableElement.performSearch(searchConfig, shouldJump, jumpBackwards);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  jumpToNextSearchResult(): void {
    if (this._searchableElement) {
      this._searchableElement.jumpToNextSearchResult();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  jumpToPreviousSearchResult(): void {
    if (this._searchableElement) {
      this._searchableElement.jumpToPreviousSearchResult();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  linkifier(): Components.Linkifier.Linkifier {
    return this._linkifier;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createFlameChartDataProvider(): ProfileFlameChartDataProvider {
    throw 'Not implemented';
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _ensureFlameChartCreated(): void {
    if (this._flameChart) {
      return;
    }
    this._dataProvider = this.createFlameChartDataProvider();
    this._flameChart = new CPUProfileFlameChart(this._searchableView, this._dataProvider);
    this._flameChart.addEventListener(PerfUI.FlameChart.Events.EntryInvoked, 
    // Transformation: updateParameters
    event => {
      this._onEntryInvoked(event);
    });
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async _onEntryInvoked(event: Common.EventTarget.EventTargetEvent): Promise<void> {
    if (!this._dataProvider) {
      return;
    }
    const entryIndex = event.data;
    // TODO(crbug.com/1011811): Expose `_entryNodes` on the interface, every data provider
    //                          implementation sets it.
    // @ts-ignore
    const node = this._dataProvider._entryNodes[entryIndex];
    const debuggerModel = this.profileHeader._debuggerModel;
    if (!node || !node.scriptId || !debuggerModel) {
      return;
    }
    const script = debuggerModel.scriptForId(node.scriptId);
    if (!script) {
      return;
    }
    const location = (debuggerModel.createRawLocation(script, node.lineNumber, node.columnNumber) as SDK.DebuggerModel.Location);
    const uiLocation = await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(location);
    Common.Revealer.reveal(uiLocation);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _changeView(): void {
    if (!this._profile) {
      return;
    }

    this._searchableView.closeSearch();

    if (this._visibleView) {
      this._visibleView.detach();
    }
    this._viewType.set((this.viewSelectComboBox.selectedOption() as HTMLOptionElement).value);
    switch (this._viewType.get()) {
      case ViewTypes.Flame:
        this._ensureFlameChartCreated();
        this._visibleView = this._flameChart;
        this._searchableElement = this._flameChart;
        break;
      case ViewTypes.Tree:
        this.profileDataGridTree = this._getTopDownProfileDataGridTree();
        this._sortProfile();
        this._visibleView = this.dataGrid.asWidget();
        this._searchableElement = this.profileDataGridTree;
        break;
      case ViewTypes.Heavy:
        this.profileDataGridTree = this._getBottomUpProfileDataGridTree();
        this._sortProfile();
        this._visibleView = this.dataGrid.asWidget();
        this._searchableElement = this.profileDataGridTree;
        break;
    }

    const isFlame = this._viewType.get() === ViewTypes.Flame;
    this.focusButton.setVisible(!isFlame);
    this.excludeButton.setVisible(!isFlame);
    this.resetButton.setVisible(!isFlame);

    if (this._visibleView) {
      this._visibleView.show(this._searchableView.element);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _nodeSelected(selected: boolean): void {
    this.focusButton.setEnabled(selected);
    this.excludeButton.setEnabled(selected);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _focusClicked(event: Common.EventTarget.EventTargetEvent): void {
    if (!this.dataGrid.selectedNode) {
      return;
    }

    this.resetButton.setEnabled(true);
    (this.resetButton.element as HTMLElement).focus();
    if (this.profileDataGridTree) {
      this.profileDataGridTree.focus((this.dataGrid.selectedNode as ProfileDataGridNode));
    }
    this.refresh();
    this.refreshVisibleData();
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.CpuProfileNodeFocused);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _excludeClicked(event: Common.EventTarget.EventTargetEvent): void {
    const selectedNode = this.dataGrid.selectedNode;

    if (!selectedNode) {
      return;
    }

    this.resetButton.setEnabled(true);
    (this.resetButton.element as HTMLElement).focus();

    selectedNode.deselect();

    if (this.profileDataGridTree) {
      this.profileDataGridTree.exclude((selectedNode as ProfileDataGridNode));
    }
    this.refresh();
    this.refreshVisibleData();
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.CpuProfileNodeExcluded);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _resetClicked(event: Common.EventTarget.EventTargetEvent): void {
    this.viewSelectComboBox.selectElement().focus();
    this.resetButton.setEnabled(false);
    if (this.profileDataGridTree) {
      this.profileDataGridTree.restore();
    }
    this._linkifier.reset();
    this.refresh();
    this.refreshVisibleData();
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _sortProfile(): void {
    if (!this.profileDataGridTree) {
      return;
    }
    const sortAscending = this.dataGrid.isSortOrderAscending();
    const sortColumnId = this.dataGrid.sortColumnId();
    const sortProperty = sortColumnId === 'function' ? 'functionName' : sortColumnId || '';
    this.profileDataGridTree.sort(ProfileDataGridTree.propertyComparator(sortProperty, sortAscending), false);

    this.refresh();
  }
}

export const maxLinkLength = 30;

export const enum ViewTypes {
  Flame = 'Flame',
  Tree = 'Tree',
  Heavy = 'Heavy'
}
;

// Transformation: updatePropertyDeclarations
// Transformation: updateInterfacesImplementations
export class WritableProfileHeader extends ProfileHeader implements Common.StringOutputStream.OutputStream {
  _debuggerModel: SDK.DebuggerModel.DebuggerModel | null;
  _fileName?: string;
  _jsonifiedProfile?: string | null;
  _profile?: Protocol.Profiler.Profile;
  _protocolProfile?: Protocol.Profiler.Profile;
  tempFile?: Bindings.TempFile.TempFile | null;
  // Transformation: updateParameters
  constructor(debuggerModel: SDK.DebuggerModel.DebuggerModel | null, type: ProfileType, title?: string) {
    super(type, title || i18nString(UIStrings.profileD, { PH1: type.nextProfileUid() }));
    this._debuggerModel = debuggerModel;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _onChunkTransferred(reader: Bindings.FileUtils.ChunkedReader): void {
    if (this._jsonifiedProfile) {
      this.updateStatus(i18nString(UIStrings.loadingD, { PH1: Platform.NumberUtilities.bytesToString(this._jsonifiedProfile.length) }));
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _onError(reader: Bindings.FileUtils.ChunkedReader): void {
    const error = (reader.error() as any);
    if (error) {
      this.updateStatus(i18nString(UIStrings.fileSReadErrorS, { PH1: reader.fileName(), PH2: error.message }));
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async write(text: string): Promise<void> {
    this._jsonifiedProfile += text;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async close(): Promise<void> {
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  dispose(): void {
    this.removeTempFile();
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createSidebarTreeElement(panel: DataDisplayDelegate): ProfileSidebarTreeElement {
    return new ProfileSidebarTreeElement(panel, this, 'profile-sidebar-tree-item');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  canSaveToFile(): boolean {
    return !this.fromFile() && Boolean(this._protocolProfile);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async saveToFile(): Promise<void> {
    const fileOutputStream = new Bindings.FileUtils.FileOutputStream();
    if (!this._fileName) {
      const now = Platform.DateUtilities.toISO8601Compact(new Date());
      const fileExtension = this.profileType().fileExtension();

      this._fileName = `${this.profileType().typeName()}-${now}${fileExtension}`;
    }

    const accepted = await fileOutputStream.open(this._fileName);
    if (!accepted || !this.tempFile) {
      return;
    }
    const data = await this.tempFile.read();
    if (data) {
      await fileOutputStream.write(data);
    }
    fileOutputStream.close();
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async loadFromFile(file: File): Promise<Error | null> {
    this.updateStatus(i18nString(UIStrings.loading), true);
    const fileReader = new Bindings.FileUtils.ChunkedFileReader(file, 10000000, this._onChunkTransferred.bind(this));
    this._jsonifiedProfile = '';

    const success = await fileReader.read(this);
    if (!success) {
      this._onError(fileReader);
      return new Error(i18nString(UIStrings.failedToReadFile));
    }

    this.updateStatus(i18nString(UIStrings.parsing), true);
    let 
    // Transformation: updateTypeDefinitionsForLocalTypes
    error: null = null;
    try {
      this._profile = (JSON.parse(this._jsonifiedProfile) as Protocol.Profiler.Profile);
      this.setProfile((this._profile as Protocol.Profiler.Profile));
      this.updateStatus(i18nString(UIStrings.loaded), false);
    }
    catch (e) {
      error = e;
      this.profileType().removeProfile(this);
    }
    this._jsonifiedProfile = null;

    if (this.profileType().profileBeingRecorded() === this) {
      this.profileType().setProfileBeingRecorded(null);
    }
    return error;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setProtocolProfile(profile: Protocol.Profiler.Profile): void {
    this.setProfile(profile);
    this._protocolProfile = profile;
    this.tempFile = new Bindings.TempFile.TempFile();
    this.tempFile.write([JSON.stringify(profile)]);
    if (this.canSaveToFile()) {
      this.dispatchEventToListeners(Events.ProfileReceived);
    }
  }
}
