// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Bindings from '../../models/bindings/bindings.js';
import * as Workspace from '../../models/workspace/workspace.js';
import * as Platform from '../../core/platform/platform.js'
import * as SDK from '../../core/sdk/sdk.js';


import * as i18n from '../../core/i18n/i18n.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as Components  from './components/components.js';

const UIStrings = {
  /**
  *@description Text to indicate that there are no breakpoints
  */
  noBreakpoints: 'No breakpoints',
};

const str_ = i18n.i18n.registerUIStrings('panels/sources/BreakpointsSidebarPane.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let breakpointsSidebarPaneInstance: BreakpointsSidebarPane;

interface BreakpointLocation {
  breakpoint: Bindings.BreakpointManager.Breakpoint;
  uiLocation: Workspace.UISourceCode.UILocation;
}

export class BreakpointsSidebarPane extends UI.ThrottledWidget.ThrottledWidget implements
UI.ContextFlavorListener.ContextFlavorListener {
  readonly #breakpointView: Components.BreakpointView.BreakpointView;
  readonly #breakpointManager: Bindings.BreakpointManager.BreakpointManager;

  
  // readonly #noBreakpointsView: HTMLElement;
  #groupToMap = new Map<string, Components.BreakpointView.BreakpointGroup>();


  static instance(): BreakpointsSidebarPane {
    if (!breakpointsSidebarPaneInstance) {
      breakpointsSidebarPaneInstance = new BreakpointsSidebarPane();
    }
    return breakpointsSidebarPaneInstance;
  }

  constructor() {
    super(true);
    this.#breakpointManager = Bindings.BreakpointManager.BreakpointManager.instance();
    this.#breakpointManager.addEventListener(Bindings.BreakpointManager.Events.BreakpointAdded, this.doUpdate, this);
    this.#breakpointManager.addEventListener(Bindings.BreakpointManager.Events.BreakpointRemoved, this.doUpdate, this);


    // this.contentElement.createElement('div');

    // if (breakpoints.length === 0) {
      //     // this.#noBreakpointsView = this.contentElement.createChild('div', 'gray-info-message');
    // this.#noBreakpointsView.textContent = i18nString(UIStrings.noBreakpoints);
    // this.#noBreakpointsView.tabIndex = -1;

      //
    //} else {
    this.#breakpointView = new Components.BreakpointView.BreakpointView();
    this.#breakpointView.addEventListener(Components.BreakpointView.CheckboxToggledEvent.eventName, this.onCheckboxToggledEvent);
    this.#breakpointView.addEventListener(Components.BreakpointView.ExpandedStateChangedEvent.eventName, (e) => { this.#onExpandedStateChange(e)});
    this.#breakpointView.addEventListener(Components.BreakpointView.BreakpointSelectedEvent.eventName, (e) => { console.log('selected')});
    this.contentElement.appendChild(this.#breakpointView);
    this.doUpdate();
  //}

    // this.#noBreakpointsView = this.contentElement.createChild('div', 'gray-info-message');
    // this.#noBreakpointsView.textContent = i18nString(UIStrings.noBreakpoints);
    // this.#noBreakpointsView.tabIndex = -1;


  }

  flavorChanged(_object: Object|null): void {
    this.update();
  }

  onCheckboxToggledEvent(e: Event) {
    console.log('toggled');
  }

  #onExpandedStateChange(e: Event) {
    console.log(e);
  }

  private groupBreakpointLocationsById(breakpointLocations: BreakpointLocation[]): BreakpointLocation[][] {
    const map = new Platform.MapUtilities.Multimap<string, BreakpointLocation>();
    for (const breakpointLocation of breakpointLocations) {
      const uiLocation = breakpointLocation.uiLocation;
      map.set(uiLocation.id(), breakpointLocation);
    }
    const arr: BreakpointLocation[][] = [];
    for (const id of map.keysArray()) {
      const locations = Array.from(map.get(id));
      if (locations.length) {
        arr.push(locations);
      }
    }
    return arr;
  }

  private getLocationIdsByLineId(breakpointLocations: BreakpointLocation[]):
      Platform.MapUtilities.Multimap<string, string> {
    const result = new Platform.MapUtilities.Multimap<string, string>();

    for (const breakpointLocation of breakpointLocations) {
      const uiLocation = breakpointLocation.uiLocation;
      result.set(uiLocation.lineId(), uiLocation.id());
    }

    return result;
  }

  private getContent(locations: BreakpointLocation[][]): Promise<TextUtils.Text.Text[]> {
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

  private async getSelectedUILocation(): Promise<Workspace.UISourceCode.UILocation|null> {
    const details = UI.Context.Context.instance().flavor(SDK.DebuggerModel.DebuggerPausedDetails);
    if (details && details.callFrames.length) {
      return await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(
          details.callFrames[0].location());
    }
    return null;
  }

  #getBreakpointLocations(): BreakpointLocation[] {
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

  async doUpdate(): Promise<void> {
    const data = await this.render();
    this.#breakpointView.data = {groups: data};
  }

  async render(): Promise<Components.BreakpointView.BreakpointGroup[]> {
    // const hadFocus = this.hasFocus();
    const breakpointLocations = this.#getBreakpointLocations();
    if (!breakpointLocations.length) {
      return[];
    //   return this.didUpdateForTest();
    }

    const locationsGroupedById = this.groupBreakpointLocationsById(breakpointLocations);
    const locationIdsByLineId = this.getLocationIdsByLineId(breakpointLocations);
    const content = await this.getContent(locationsGroupedById);
    const selectedUILocation = await this.getSelectedUILocation();
    this.#groupToMap = new Map<string, Components.BreakpointView.BreakpointGroup>;

    for (let idx = 0; idx < locationsGroupedById.length; idx++) {
      const locations = locationsGroupedById[idx];
      const breakpointLocation = locations[0];
      const sourceURL = locations[0].uiLocation.uiSourceCode.url();
      const uiLocation = breakpointLocation.uiLocation;
      const isSelected = selectedUILocation !== null &&
          locations.some(location => location.uiLocation.id() === selectedUILocation.id());
      // Wasm disassembly bytecode offsets are stored as column numbers,
      // so this showColumn setting doesn't make sense for WebAssembly.
      const showColumn = uiLocation.uiSourceCode.mimeType() !== 'application/wasm' &&
          locationIdsByLineId.get(uiLocation.lineId()).size > 1;
      const text = (content[idx] as TextUtils.Text.Text);
      const codeSnippet = text.lineAt(uiLocation.lineNumber);
    //   const location = {sourceURL, line: uiLocation.lineNumber, column: uiLocation.columnNumber, snippet: text.value()} as BreakpointLocation;
      
  
      const hasEnabled = locations.some(location => location.breakpoint.enabled());
      const hasDisabled = locations.some(location => !location.breakpoint.enabled());
      let status: Components.BreakpointView.BreakpointStatus;
      if (hasEnabled) {
        if (hasDisabled) {
          status = Components.BreakpointView.BreakpointStatus.INDETERMINATE;
        } else {
          status = Components.BreakpointView.BreakpointStatus.ENABLED;
        }
      } else {
        status = Components.BreakpointView.BreakpointStatus.DISABLED;
      }
      const entry = {location: '', codeSnippet, isHit: isSelected, status} as Components.BreakpointView.BreakpointItem;
      if (this.#groupToMap.has(sourceURL)) {
        this.#groupToMap.get(sourceURL)!.breakpointEntries.push(entry);
      } else {
        const breakpoints: Components.BreakpointView.BreakpointItem[] = [entry];
        this.#groupToMap.set(sourceURL, {url: sourceURL, expanded: false, breakpointEntries: breakpoints});
      }
    }


    // if (breakpoints.some(breakpoint => breakpoint.isSelected)) {
    //   void UI.ViewManager.ViewManager.instance().showView('sources.jsBreakpoints');
    // }

    // this.list.element.classList.toggle(
    //     'breakpoints-list-deactivated', !Common.Settings.Settings.instance().moduleSetting('breakpointsActive').get());

    return Array.from(this.#groupToMap.values());

    // if (hadFocus) {
    //   this.focus();
    // }

    // return this.didUpdateForTest();
  }

}

