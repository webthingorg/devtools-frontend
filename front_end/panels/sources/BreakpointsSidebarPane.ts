// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Bindings from '../../models/bindings/bindings.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Workspace from '../../models/workspace/workspace.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as SourcesComponents from './components/components.js';

let breakpointsSidebarPaneInstance: BreakpointsSidebarPane;
let breakpointsViewControllerInstance: BreakpointsSidebarController;

export class BreakpointsSidebarPane extends UI.ThrottledWidget.ThrottledWidget {
  readonly #breakpointsView: SourcesComponents.BreakpointsView.BreakpointsView;
  readonly #controller: BreakpointsSidebarController;

  static instance(): BreakpointsSidebarPane {
    if (!breakpointsSidebarPaneInstance) {
      breakpointsSidebarPaneInstance = new BreakpointsSidebarPane();
    }
    return breakpointsSidebarPaneInstance;
  }

  constructor() {
    super(true);
    this.#controller = BreakpointsSidebarController.instance();
    this.#breakpointsView = new SourcesComponents.BreakpointsView.BreakpointsView();
    this.#breakpointsView.addEventListener(
        SourcesComponents.BreakpointsView.CheckboxToggledEvent.eventName, (event: Event) => {
          this.#onCheckBoxToggledEvent(event);
        });
    this.#breakpointsView.addEventListener(
        SourcesComponents.BreakpointsView.BreakpointSelectedEvent.eventName, (event: Event) => {
          this.#onBreakpointSelectedEvent(event);
        });
    this.contentElement.appendChild(this.#breakpointsView);
    this.update();
  }

  async doUpdate(): Promise<void> {
    await this.#controller.update();
  }

  set data(data: SourcesComponents.BreakpointsView.BreakpointsViewData) {
    this.#breakpointsView.data = data;
  }

  #onCheckBoxToggledEvent(event: Event): void {
    const checkboxToggledEvent = event as SourcesComponents.BreakpointsView.CheckboxToggledEvent;
    const {breakpointItem, checked} = checkboxToggledEvent.data;

    this.#controller.breakpointStateChanged(breakpointItem, checked);
  }

  #onBreakpointSelectedEvent(event: Event): void {
    const breakpointSelectedEvent = event as SourcesComponents.BreakpointsView.BreakpointSelectedEvent;
    const breakpointItem = breakpointSelectedEvent.data.breakpointItem;

    void this.#controller.jumpToSource(breakpointItem);
  }
}
export class BreakpointsSidebarController implements UI.ContextFlavorListener.ContextFlavorListener {
  readonly #breakpointManager: Bindings.BreakpointManager.BreakpointManager;
  readonly #breakpointItemToLocationMap =
      new WeakMap<SourcesComponents.BreakpointsView.BreakpointItem, Bindings.BreakpointManager.BreakpointLocation[]>();

  constructor() {
    this.#breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance();
    this.#breakpointManager.addEventListener(Bindings.BreakpointManager.Events.BreakpointAdded, this.update, this);
    this.#breakpointManager.addEventListener(Bindings.BreakpointManager.Events.BreakpointRemoved, this.update, this);
  }

  static instance(opts: {forceNew: boolean|null} = {forceNew: null}): BreakpointsSidebarController {
    if (!breakpointsViewControllerInstance || opts.forceNew) {
      breakpointsViewControllerInstance = new BreakpointsSidebarController();
    }
    return breakpointsViewControllerInstance;
  }

  flavorChanged(_object: Object|null): void {
    void this.update();
  }

  breakpointStateChanged(breakpointItem: SourcesComponents.BreakpointsView.BreakpointItem, checked: boolean): void {
    const locations = this.#getLocationsForBreakpointItem(breakpointItem);
    if (!locations) {
      return;
    }
    locations.forEach((value: Bindings.BreakpointManager.BreakpointLocation) => {
      const breakpoint = value.breakpoint;
      breakpoint.setEnabled(checked);
    });
  }

  async jumpToSource(breakpointItem: SourcesComponents.BreakpointsView.BreakpointItem): Promise<void> {
    const uiLocations = this.#getLocationsForBreakpointItem(breakpointItem)?.map(location => location.uiLocation);
    if (!uiLocations) {
      return;
    }

    let uiLocation: Workspace.UISourceCode.UILocation|undefined;
    for (const uiLocationCandidate of uiLocations) {
      if (!uiLocation || uiLocationCandidate.compareTo(uiLocation) < 0) {
        uiLocation = uiLocationCandidate;
      }
    }
    if (uiLocation) {
      await Common.Revealer.reveal(uiLocation);
    }
  }

  async update(): Promise<void> {
    const data = await this.getUpdatedBreakpointViewData();
    BreakpointsSidebarPane.instance().data = data;
  }

  async getUpdatedBreakpointViewData(): Promise<SourcesComponents.BreakpointsView.BreakpointsViewData> {
    const breakpointLocations = this.#getBreakpointLocations();
    if (!breakpointLocations.length) {
      return {groups: []};
    }

    const locationsGroupedById = this.#groupBreakpointLocationsById(breakpointLocations);
    const locationIdsByLineId = this.#getLocationIdsByLineId(breakpointLocations);

    const content = await this.#getContent(locationsGroupedById);
    const selectedUILocation = await this.#getHitUILocation();

    const urlToGroup = new Map<Platform.DevToolsPath.UrlString, SourcesComponents.BreakpointsView.BreakpointGroup>();

    for (let idx = 0; idx < locationsGroupedById.length; idx++) {
      const locations = locationsGroupedById[idx];
      const fstLocation = locations[0];
      const sourceURL = fstLocation.uiLocation.uiSourceCode.url();
      const uiLocation = fstLocation.uiLocation;

      const isHit = selectedUILocation !== null &&
          locations.some(location => location.uiLocation.id() === selectedUILocation.id());

      const numBreakpointsOnLine = locationIdsByLineId.get(uiLocation.lineId()).size;
      const showColumn = numBreakpointsOnLine > 1;
      const locationText = uiLocation.lineAndColumnText(showColumn);

      const text = (content[idx] as TextUtils.Text.Text);
      const codeSnippet = text.lineAt(uiLocation.lineNumber);

      const status: SourcesComponents.BreakpointsView.BreakpointStatus = this.#getBreakpointState(locations);
      const item = {location: locationText, codeSnippet, isHit, status} as
          SourcesComponents.BreakpointsView.BreakpointItem;
      this.#breakpointItemToLocationMap.set(item, locations);

      let group = urlToGroup.get(sourceURL);
      if (group) {
        group.breakpointItems.push(item);
      } else {
        group =
            {url: sourceURL, name: uiLocation.uiSourceCode.displayName(), expanded: true, breakpointItems: [item]} as
            SourcesComponents.BreakpointsView.BreakpointGroup;
        urlToGroup.set(sourceURL, group);
      }
    }
    return {groups: Array.from(urlToGroup.values())};
  }

  #getLocationsForBreakpointItem(breakpointItem: SourcesComponents.BreakpointsView.BreakpointItem):
      Bindings.BreakpointManager.BreakpointLocation[]|undefined {
    const locations = this.#breakpointItemToLocationMap.get(breakpointItem);
    if (!locations) {
      console.error(
          `Expected to have a location stored for the breakpoint item at location: ${breakpointItem.location}`);
    }
    return locations;
  }

  async #getHitUILocation(): Promise<Workspace.UISourceCode.UILocation|null> {
    const details = UI.Context.Context.instance().flavor(SDK.DebuggerModel.DebuggerPausedDetails);
    if (details && details.callFrames.length) {
      return await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(
          details.callFrames[0].location());
    }
    return null;
  }

  #getBreakpointLocations(): Bindings.BreakpointManager.BreakpointLocation[] {
    const locations = this.#breakpointManager.allBreakpointLocations().filter(
        breakpointLocation =>
            breakpointLocation.uiLocation.uiSourceCode.project().type() !== Workspace.Workspace.projectTypes.Debugger);

    locations.sort((item1, item2) => item1.uiLocation.compareTo(item2.uiLocation));

    const result = [];
    let lastBreakpoint: Bindings.BreakpointManager.Breakpoint|null = null;
    let lastLocation: Workspace.UISourceCode.UILocation|null = null;
    for (const location of locations) {
      if (location.breakpoint !== lastBreakpoint || (lastLocation && location.uiLocation.compareTo(lastLocation))) {
        result.push(location);
        lastBreakpoint = location.breakpoint;
        lastLocation = location.uiLocation;
      }
    }
    return result;
  }

  #groupBreakpointLocationsById(breakpointLocations: Bindings.BreakpointManager.BreakpointLocation[]):
      Bindings.BreakpointManager.BreakpointLocation[][] {
    const map = new Platform.MapUtilities.Multimap<string, Bindings.BreakpointManager.BreakpointLocation>();
    for (const breakpointLocation of breakpointLocations) {
      const uiLocation = breakpointLocation.uiLocation;
      map.set(uiLocation.id(), breakpointLocation);
    }
    const arr: Bindings.BreakpointManager.BreakpointLocation[][] = [];
    for (const id of map.keysArray()) {
      const locations = Array.from(map.get(id));
      if (locations.length) {
        arr.push(locations);
      }
    }
    return arr;
  }

  #getLocationIdsByLineId(breakpointLocations: Bindings.BreakpointManager.BreakpointLocation[]):
      Platform.MapUtilities.Multimap<string, string> {
    const result = new Platform.MapUtilities.Multimap<string, string>();

    for (const breakpointLocation of breakpointLocations) {
      const uiLocation = breakpointLocation.uiLocation;
      result.set(uiLocation.lineId(), uiLocation.id());
    }

    return result;
  }

  #getBreakpointState(locations: Bindings.BreakpointManager.BreakpointLocation[]):
      SourcesComponents.BreakpointsView.BreakpointStatus {
    const hasEnabled = locations.some(location => location.breakpoint.enabled());
    const hasDisabled = locations.some(location => !location.breakpoint.enabled());
    let status: SourcesComponents.BreakpointsView.BreakpointStatus;
    if (hasEnabled) {
      status = hasDisabled ? SourcesComponents.BreakpointsView.BreakpointStatus.INDETERMINATE :
                             SourcesComponents.BreakpointsView.BreakpointStatus.ENABLED;
    } else {
      status = SourcesComponents.BreakpointsView.BreakpointStatus.DISABLED;
    }
    return status;
  }

  #getContent(locations: Bindings.BreakpointManager.BreakpointLocation[][]): Promise<TextUtils.Text.Text[]> {
    // Use a cache to share the Text objects between all breakpoints. This way
    // we share the cached line ending information that Text calculates. This
    // was very slow to calculate with a lot of breakpoints in the same very
    // large source file.
    const contentToTextMap = new Map<string, TextUtils.Text.Text>();

    return Promise.all(locations.map(async ([{uiLocation: {uiSourceCode}}]) => {
      if (uiSourceCode.mimeType() === 'application/wasm') {
        // We could mirror the logic from `SourceFrame._ensureContentLoaded()` here
        // (and if so, ideally share that code somewhere), but that's quite heavy
        // logic just to display a single Wasm instruction. Also not really clear
        // how much value this would add. So let's keep it simple for now and don't
        // display anything additional for Wasm breakpoints, and if there's demand
        // to display some text preview, we could look into selectively disassemb-
        // ling the part of the text that we need here.
        // Relevant crbug: https://crbug.com/1090256
        return new TextUtils.Text.Text('');
      }
      const {content} = await uiSourceCode.requestContent();
      const contentText = content || '';
      if (contentToTextMap.has(contentText)) {
        return contentToTextMap.get(contentText) as TextUtils.Text.Text;
      }
      const text = new TextUtils.Text.Text(contentText);
      contentToTextMap.set(contentText, text);
      return text;
    }));
  }
}
