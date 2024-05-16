// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Bindings from '../../models/bindings/bindings.js';
import * as TraceEngine from '../../models/trace/trace.js';
import * as TraceBounds from '../../services/trace_bounds/trace_bounds.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';

import {CountersGraph} from './CountersGraph.js';
import {SHOULD_SHOW_EASTER_EGG} from './EasterEgg.js';
import {ExtensionDataGatherer} from './ExtensionDataGatherer.js';
import {targetForEvent} from './TargetForEvent.js';
import {TimelineDetailsView} from './TimelineDetailsView.js';
import {TimelineRegExp} from './TimelineFilters.js';
import {
  Events as TimelineFlameChartDataProviderEvents,
  TimelineFlameChartDataProvider,
} from './TimelineFlameChartDataProvider.js';
import {TimelineFlameChartNetworkDataProvider} from './TimelineFlameChartNetworkDataProvider.js';
import timelineFlameChartViewStyles from './timelineFlameChartView.css.js';
import {type TimelineModeViewDelegate} from './TimelinePanel.js';
import {TimelineSelection} from './TimelineSelection.js';
import {AggregatedTimelineTreeView} from './TimelineTreeView.js';
import {type TimelineMarkerStyle} from './TimelineUIUtils.js';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart View of the Performance panel
   *@example {Frame} PH1
   *@example {10ms} PH2
   */
  sAtS: '{PH1} at {PH2}',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/TimelineFlameChartView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const MAX_HIGHLIGHTED_SEARCH_ELEMENTS: number = 200;

interface OverlayTimingSection {
  // This would probably be a TraceBound type in reality
  start: TraceEngine.Types.Timing.MicroSeconds;
  end: TraceEngine.Types.Timing.MicroSeconds;
  label: string;
  className: string;
}

interface EntryTimingBreakdownOverlay {
  type: 'ENTRY_TIMING_BREAKDOWN';
  entry: Readonly<TraceEngine.Types.TraceEvents.SyntheticInteractionPair>;
  sections: OverlayTimingSection[];
}
type Overlay = EntryTimingBreakdownOverlay|{
  type: 'LONG_NETWORK_REQUEST',
  entry: Readonly<TraceEngine.Types.TraceEvents.SyntheticNetworkRequest>,
  label: string,
};

const elementForOverlay = new Map<Overlay, HTMLElement>();

function getOrCreateElementForOverlay(overlay: Overlay): HTMLElement {
  const existing = elementForOverlay.get(overlay);
  if (existing) {
    return existing;
  }

  const div = document.createElement('div');
  div.classList.add('overlay-item');
  div.classList.add(`overlay-type-${overlay.type.toLowerCase()}`);

  elementForOverlay.set(overlay, div);
  return div;
}

interface KnownFlameChartDimensions {
  main?: PerfUI.FlameChart.FlameChartDimensions;
  network?: PerfUI.FlameChart.FlameChartDimensions;
}

export class TimelineFlameChartView extends UI.Widget.VBox implements PerfUI.FlameChart.FlameChartDelegate,
                                                                      UI.SearchableView.Searchable {
  private readonly delegate: TimelineModeViewDelegate;
  private searchResults!: number[]|undefined;
  private eventListeners: Common.EventTarget.EventDescriptor[];
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  private readonly networkSplitWidget: UI.SplitWidget.SplitWidget;
  private mainDataProvider: TimelineFlameChartDataProvider;
  private readonly mainFlameChart: PerfUI.FlameChart.FlameChart;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly networkFlameChartGroupExpansionSetting: Common.Settings.Setting<any>;
  private networkDataProvider: TimelineFlameChartNetworkDataProvider;
  private readonly networkFlameChart: PerfUI.FlameChart.FlameChart;
  private readonly networkPane: UI.Widget.VBox;
  private readonly splitResizer: HTMLElement;
  private readonly chartSplitWidget: UI.SplitWidget.SplitWidget;
  private brickGame?: PerfUI.BrickBreaker.BrickBreaker;
  private readonly countersView: CountersGraph;
  private readonly detailsSplitWidget: UI.SplitWidget.SplitWidget;
  private readonly detailsView: TimelineDetailsView;
  private readonly onMainEntrySelected: (event: Common.EventTarget.EventTargetEvent<number>) => void;
  private readonly onNetworkEntrySelected: (event: Common.EventTarget.EventTargetEvent<number>) => void;
  readonly #boundRefreshAfterIgnoreList: () => void;
  #selectedEvents: TraceEngine.Types.TraceEvents.TraceEventData[]|null;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly groupBySetting: Common.Settings.Setting<any>;
  private searchableView!: UI.SearchableView.SearchableView;
  private needsResizeToPreferredHeights?: boolean;
  private selectedSearchResult?: number;
  private searchRegex?: RegExp;
  #traceEngineData: TraceEngine.Handlers.Types.TraceParseData|null;
  #selectedGroupName: string|null = null;
  #onTraceBoundsChangeBound = this.#onTraceBoundsChange.bind(this);
  #gameKeyMatches = 0;
  #gameTimeout = setTimeout(() => ({}), 0);
  #overlaysContainer: HTMLDivElement;
  #activeOverlays: Overlay[] = [];
  #visibleWindowMilliSeconds: Readonly<TraceEngine.Types.Timing.TraceWindowMilliSeconds>|null = null;

  #viewDimensions: KnownFlameChartDimensions = {};

  constructor(delegate: TimelineModeViewDelegate) {
    super();
    this.element.classList.add('timeline-flamechart');

    this.delegate = delegate;
    this.eventListeners = [];
    this.#traceEngineData = null;

    const flameChartsContainer = new UI.Widget.VBox();
    flameChartsContainer.element.classList.add('flame-charts-container');

    // Create main and network flamecharts.
    this.networkSplitWidget = new UI.SplitWidget.SplitWidget(false, false, 'timeline-flamechart-main-view', 150);
    this.networkSplitWidget.show(flameChartsContainer.element);

    // Ensure that the network panel & resizer appears above the main thread.
    this.networkSplitWidget.sidebarElement().style.zIndex = '120';

    this.#overlaysContainer = document.createElement('div');
    this.#overlaysContainer.classList.add('timeline-overlays-container');
    flameChartsContainer.element.appendChild(this.#overlaysContainer);

    const mainViewGroupExpansionSetting =
        Common.Settings.Settings.instance().createSetting('timeline-flamechart-main-view-group-expansion', {});
    this.mainDataProvider = new TimelineFlameChartDataProvider();
    this.mainDataProvider.addEventListener(
        TimelineFlameChartDataProviderEvents.DataChanged, () => this.mainFlameChart.scheduleUpdate());
    this.mainFlameChart =
        new PerfUI.FlameChart.FlameChart('MAIN', this.mainDataProvider, this, mainViewGroupExpansionSetting);
    this.mainFlameChart.alwaysShowVerticalScroll();
    this.mainFlameChart.enableRuler(false);

    this.networkFlameChartGroupExpansionSetting =
        Common.Settings.Settings.instance().createSetting('timeline-flamechart-network-view-group-expansion', {});
    this.networkDataProvider = new TimelineFlameChartNetworkDataProvider();
    this.networkFlameChart = new PerfUI.FlameChart.FlameChart(
        'NETWORK', this.networkDataProvider, this, this.networkFlameChartGroupExpansionSetting);
    this.networkFlameChart.alwaysShowVerticalScroll();

    this.networkPane = new UI.Widget.VBox();
    this.networkPane.setMinimumSize(23, 23);
    this.networkFlameChart.show(this.networkPane.element);
    this.splitResizer = this.networkPane.element.createChild('div', 'timeline-flamechart-resizer');
    this.networkSplitWidget.hideDefaultResizer(true);
    this.networkSplitWidget.installResizer(this.splitResizer);
    this.networkSplitWidget.setMainWidget(this.mainFlameChart);
    this.networkSplitWidget.setSidebarWidget(this.networkPane);

    // Create counters chart splitter.
    this.chartSplitWidget = new UI.SplitWidget.SplitWidget(false, true, 'timeline-counters-split-view-state');
    this.countersView = new CountersGraph(this.delegate);
    this.chartSplitWidget.setMainWidget(flameChartsContainer);
    this.chartSplitWidget.setSidebarWidget(this.countersView);
    this.chartSplitWidget.hideDefaultResizer();
    this.chartSplitWidget.installResizer((this.countersView.resizerElement() as Element));

    // Create top level properties splitter.
    this.detailsSplitWidget = new UI.SplitWidget.SplitWidget(false, true, 'timeline-panel-details-split-view-state');
    this.detailsSplitWidget.element.classList.add('timeline-details-split');
    this.detailsView = new TimelineDetailsView(delegate);
    this.detailsSplitWidget.installResizer(this.detailsView.headerElement());
    this.detailsSplitWidget.setMainWidget(this.chartSplitWidget);
    this.detailsSplitWidget.setSidebarWidget(this.detailsView);
    this.detailsSplitWidget.show(this.element);

    this.onMainEntrySelected = this.onEntrySelected.bind(this, this.mainDataProvider);
    this.onNetworkEntrySelected = this.onEntrySelected.bind(this, this.networkDataProvider);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.EntrySelected, this.onMainEntrySelected, this);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.EntryInvoked, this.onMainEntrySelected, this);
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.EntrySelected, this.onNetworkEntrySelected, this);
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.EntryInvoked, this.onNetworkEntrySelected, this);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.EntryHighlighted, this.onEntryHighlighted, this);
    this.element.addEventListener('keydown', this.#keydownHandler.bind(this));
    this.#boundRefreshAfterIgnoreList = this.#refreshAfterIgnoreList.bind(this);
    this.#selectedEvents = null;

    this.groupBySetting = Common.Settings.Settings.instance().createSetting(
        'timeline-tree-group-by', AggregatedTimelineTreeView.GroupBy.None);
    this.groupBySetting.addChangeListener(this.refreshMainFlameChart, this);
    this.refreshMainFlameChart();

    TraceBounds.TraceBounds.onChange(this.#onTraceBoundsChangeBound);
    this.element.addEventListener(
        PerfUI.FlameChart.FlameChartDrawDimensionsEvent.eventName,
        event => {
          if (event.dimensions.sourceFlameChart === 'MAIN') {
            this.#viewDimensions.main = event.dimensions;

          } else if (event.dimensions.sourceFlameChart === 'NETWORK') {
            this.#viewDimensions.network = event.dimensions;
          }
          this.#renderAndUpdateOverlays();
        },
    );
  }

  #keydownHandler(event: KeyboardEvent): void {
    const keyCombo = 'fixme';
    if (event.key === keyCombo[this.#gameKeyMatches]) {
      this.#gameKeyMatches++;
      clearTimeout(this.#gameTimeout);
      this.#gameTimeout = setTimeout(() => {
        this.#gameKeyMatches = 0;
      }, 2000);
    } else {
      this.#gameKeyMatches = 0;
      clearTimeout(this.#gameTimeout);
    }
    if (this.#gameKeyMatches !== keyCombo.length) {
      return;
    }
    this.fixMe();
  }

  fixMe(): void {
    if (!SHOULD_SHOW_EASTER_EGG) {
      return;
    }
    if ([...this.element.childNodes].find(child => child instanceof PerfUI.BrickBreaker.BrickBreaker)) {
      return;
    }
    this.brickGame = new PerfUI.BrickBreaker.BrickBreaker(this.mainFlameChart);
    this.brickGame.classList.add('brick-game');
    this.element.append(this.brickGame);
  }

  #onTraceBoundsChange(event: TraceBounds.TraceBounds.StateChangedEvent): void {
    if (event.updateType === 'MINIMAP_BOUNDS') {
      // If the update type was a changing of the minimap bounds, we do not
      // need to redraw the timeline.
      return;
    }

    const visibleWindow = event.state.milli.timelineTraceWindow;
    this.#visibleWindowMilliSeconds = visibleWindow;
    const shouldAnimate = Boolean(event.options.shouldAnimate);
    this.mainFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max, shouldAnimate);
    this.networkDataProvider.setWindowTimes(visibleWindow.min, visibleWindow.max);
    this.networkFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max, shouldAnimate);
    this.updateSearchResults(false, false);
  }

  #yStartPixelForEntryLevel(
      chart: PerfUI.FlameChart.FlameChart, provider: PerfUI.FlameChart.FlameChartDataProvider,
      entry: TraceEngine.Types.TraceEvents.TraceEventData): number {
    // TODO: we need to implement this for the network too.
    const indexForEntry = provider.getIndexForEvent(entry);
    if (!indexForEntry) {
      return -1;
    }
    const timelineData = provider.timelineData();
    if (!timelineData) {
      return -1;
    }
    const level = timelineData.entryLevels[indexForEntry];
    const offsetForLevel = chart.levelToOffset(level);
    return offsetForLevel;
  }
  #microSecondsToPixel(dimensions: PerfUI.FlameChart.FlameChartDimensions, time: TraceEngine.Types.Timing.MicroSeconds):
      number {
    const startTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(time);
    if (!this.#visibleWindowMilliSeconds) {
      return -1;
    }

    const timeFromLeft = startTime - dimensions.traceWindowLeft;
    const totalSpan = dimensions.traceWindowRight - dimensions.traceWindowLeft;
    const canvasWidthPx = dimensions.widthPixels;

    return Math.floor(
        timeFromLeft / totalSpan * canvasWidthPx,
    );
  }

  isNetworkTrackShownForTests(): boolean {
    return this.networkSplitWidget.showMode() !== UI.SplitWidget.ShowMode.OnlyMain;
  }

  getMainDataProvider(): TimelineFlameChartDataProvider {
    return this.mainDataProvider;
  }

  refreshMainFlameChart(): void {
    this.mainFlameChart.update();
  }

  windowChanged(
      windowStartTime: TraceEngine.Types.Timing.MilliSeconds, windowEndTime: TraceEngine.Types.Timing.MilliSeconds,
      animate: boolean): void {
    TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
        TraceEngine.Helpers.Timing.traceWindowFromMilliSeconds(
            windowStartTime,
            windowEndTime,
            ),
        {shouldAnimate: animate},
    );
  }

  updateRangeSelection(startTime: number, endTime: number): void {
    this.delegate.select(TimelineSelection.fromRange(startTime, endTime));
  }

  getMainFlameChart(): PerfUI.FlameChart.FlameChart {
    return this.mainFlameChart;
  }

  // This function is public for test purpose.
  getNetworkFlameChart(): PerfUI.FlameChart.FlameChart {
    return this.networkFlameChart;
  }

  updateSelectedGroup(flameChart: PerfUI.FlameChart.FlameChart, group: PerfUI.FlameChart.Group|null): void {
    if (flameChart !== this.mainFlameChart || this.#selectedGroupName === group?.name) {
      return;
    }
    this.#selectedGroupName = group?.name || null;
    this.#selectedEvents = group ? this.mainDataProvider.groupTreeEvents(group) : null;
    this.#updateDetailViews();
  }

  setModel(newTraceEngineData: TraceEngine.Handlers.Types.TraceParseData|null, isCpuProfile = false): void {
    if (newTraceEngineData === this.#traceEngineData) {
      return;
    }
    this.#selectedGroupName = null;
    this.#traceEngineData = newTraceEngineData;
    this.#makeFakeOverlaysForPrototype();
    Common.EventTarget.removeEventListeners(this.eventListeners);
    this.#selectedEvents = null;
    this.mainDataProvider.setModel(newTraceEngineData, isCpuProfile);
    this.networkDataProvider.setModel(newTraceEngineData);
    ExtensionDataGatherer.instance().modelChanged(newTraceEngineData);
    this.#reset();
    this.updateSearchResults(false, false);
    this.refreshMainFlameChart();
    this.#updateFlameCharts();
  }

  #makeFakeOverlaysForPrototype(): void {
    if (!this.#traceEngineData) {
      return;
    }
    // Get rid of any old overlays
    for (const element of elementForOverlay.values()) {
      element.parentElement?.removeChild(element);
    }
    elementForOverlay.clear();
    // TODO: do we need the separate array? Could just use keys in the map
    // (with the element set to null initially)
    this.#activeOverlays = [];

    // These overlays can come from anywhere - for the sake of this prototype
    // we make a couple based on things that might be in the trace.
    const longestInteraction = this.#traceEngineData.UserInteractions.longestInteractionEvent;
    if (longestInteraction) {
      this.#activeOverlays.push({
        type: 'ENTRY_TIMING_BREAKDOWN',
        entry: longestInteraction,
        sections: [
          {
            start: longestInteraction.ts,
            end: longestInteraction.processingStart,
            label: 'Input Delay',
            className: 'inputDelay',
          },
          {
            start: longestInteraction.processingStart,
            end: longestInteraction.processingEnd,
            label: 'Processing',
            className: 'processing',
          },
          {
            start: longestInteraction.processingEnd,
            end: TraceEngine.Types.Timing.MicroSeconds(longestInteraction.ts + longestInteraction.dur),
            label: 'Presentation delay',
            className: 'presentationDelay',
          },
        ],
      });
    }

    this.#traceEngineData.NetworkRequests.byTime.forEach(request => {
      if (request.dur > 100_000) {
        // Clearly this is not a real overlay type, but just for prototyping...highlight network reqs that take >100ms
        this.#activeOverlays.push({
          type: 'LONG_NETWORK_REQUEST',
          entry: request,
          label: 'This took a while!',
        });
      }
    });
  }

  #renderAndUpdateOverlays(): void {
    if (!this.#viewDimensions.main) {
      // Don't have the data to render yet. Once FlameChart#draw is called, we
      // will have this data and that will trigger an update.
      // Note that we don't check for network dimensions, because a trace
      // without any network requests does not have a network flame chart
      // visible.
      return;
    }

    const mainDimensions = this.#viewDimensions.main;
    // The network flame chart will be hidden if there are no requests. If this
    // happens, fallback to a stubbed version of dimensions which sets the
    // height to 0. This means we don't have to continually check for the
    // presence of the network flame chart, and all the code below can run
    // regardless of if we are actually showing the network track or not.
    const networkDimensions: PerfUI.FlameChart.FlameChartDimensions = this.#viewDimensions.network || {
      widthPixels: this.#viewDimensions.main.widthPixels,
      heightPixels: 0,
      scrollOffset: 0,
      sourceFlameChart: this.networkFlameChart.name(),
      traceWindowLeft: this.#viewDimensions.main.traceWindowLeft,
      traceWindowRight: this.#viewDimensions.main.traceWindowRight,
    };

    for (const overlay of this.#activeOverlays) {
      // A new overlay has yet to have an HTML Element created.
      const overlayIsNew = elementForOverlay.has(overlay) === false;

      const chartDimensions = TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(overlay.entry) ?
          networkDimensions :
          mainDimensions;

      const element = getOrCreateElementForOverlay(overlay);
      // If the overlay is new, append it to the container. If it's not new,
      // this will have already happened so don't do it again else we will
      // duplicate the overlay in the DOM.
      if (overlayIsNew) {
        this.#overlaysContainer.appendChild(element);
        this.#populateOverlayElement(overlay, element, chartDimensions);
      }

      const resizerVisible = networkDimensions.heightPixels > 0;

      // need to position based on the main flame chart, which means knowing
      // how high in px the network chart is in order to push the entry down
      // to align with the main flame chart
      // Add some padding for the resize element. TODO: how to get the resize element height accurately?
      const topPadding = TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(overlay.entry) ?
          0 :
          networkDimensions.heightPixels + (resizerVisible ? 8 : 0);

      // Update the positioning of each overlay.

      const provider: PerfUI.FlameChart.FlameChartDataProvider =
          TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(overlay.entry) ?
          this.networkDataProvider :
          this.mainDataProvider;

      const chart: PerfUI.FlameChart.FlameChart =
          TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(overlay.entry) ? this.networkFlameChart :
                                                                                               this.mainFlameChart;

      // First, calculate how far from the top of the chart it is, EXCLUDING the padding for the network track.
      // If this value is <0, the element is off screen, so we can just hide the element.
      const pixelTopValue =
          this.#yStartPixelForEntryLevel(chart, provider, overlay.entry) - chartDimensions.scrollOffset;

      if (pixelTopValue < 0) {
        // Element is off the top of the chart.
        element.style.visibility = 'hidden';
        continue;
      }

      if (pixelTopValue >= chartDimensions.heightPixels - 10) {
        // Element is off the bottom of the chart. Allow some padding so we
        // only draw the overlay if a decent chunk of the event is visible.
        element.style.visibility = 'hidden';
        continue;
      }

      const entryStartLeft = this.#microSecondsToPixel(chartDimensions, overlay.entry.ts);
      if (entryStartLeft > chartDimensions.widthPixels) {
        // The entry is off screen to the RHS, so hide it.
        element.style.visibility = 'hidden';
        continue;
      }
      const entryEndRight = this.#microSecondsToPixel(
          chartDimensions, TraceEngine.Types.Timing.MicroSeconds(overlay.entry.ts + overlay.entry.dur));
      if (entryEndRight < 0) {
        // The entry is off screen to the LHS, so hide it.
        element.style.visibility = 'hidden';
        continue;
      }

      // At this point we know the element is visible, so render it and add
      // the extra padding to accommodate the network chart above it.
      let topPx = pixelTopValue + topPadding;

      if (overlay.type === 'ENTRY_TIMING_BREAKDOWN') {
        // we render the timing breakdown immediately below the event, so bump
        // it down by the height of the event.
        topPx += 17;
      }
      element.style.top = topPx + 'px';
      element.style.left = entryStartLeft + 'px';
      element.style.width = (entryEndRight - entryStartLeft) + 'px';
      // TODO: set the height accordingly
      element.style.visibility = 'visible';
    }
  }

  #populateOverlayElement(overlay: Overlay, element: HTMLElement, dimensions: PerfUI.FlameChart.FlameChartDimensions):
      void {
    switch (overlay.type) {
      case 'ENTRY_TIMING_BREAKDOWN': {
        const ui = new OverlayEntryTimingBreakdownUI();
        ui.overlay = overlay;
        ui.microSecondsToPixel = (x: TraceEngine.Types.Timing.MicroSeconds) => {
          return this.#microSecondsToPixel(dimensions, x);
        };
        element.appendChild(ui);
        break;
      }

      case 'LONG_NETWORK_REQUEST':
        // Nothing to do here
        break;
    }
  }

  #reset(): void {
    if (this.networkDataProvider.isEmpty()) {
      this.mainFlameChart.enableRuler(true);
      this.networkSplitWidget.hideSidebar();
    } else {
      this.mainFlameChart.enableRuler(false);
      this.networkSplitWidget.showBoth();
      this.resizeToPreferredHeights();
    }
    this.mainFlameChart.reset();
    this.networkFlameChart.reset();
    this.updateSearchResults(false, false);

    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      throw new Error('TimelineFlameChartView could not set the window bounds.');
    }
    const visibleWindow = traceBoundsState.milli.timelineTraceWindow;
    this.mainFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max);
    this.networkDataProvider.setWindowTimes(visibleWindow.min, visibleWindow.max);
    this.networkFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max);
  }

  #refreshAfterIgnoreList(): void {
    // The ignore list will only affect Thread tracks, which will only be in main flame chart.
    // So just force recalculate and redraw the main flame chart here.
    this.mainDataProvider.timelineData(true);
    this.mainFlameChart.scheduleUpdate();
  }

  #updateDetailViews(): void {
    this.countersView.setModel(this.#traceEngineData, this.#selectedEvents);
    void this.detailsView.setModel(this.#traceEngineData, this.#selectedEvents);
  }

  #updateFlameCharts(): void {
    this.mainFlameChart.scheduleUpdate();
    this.networkFlameChart.scheduleUpdate();
  }

  private onEntryHighlighted(commonEvent: Common.EventTarget.EventTargetEvent<number>): void {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    const entryIndex = commonEvent.data;
    const event = this.mainDataProvider.eventByIndex(entryIndex);
    if (!event || !this.#traceEngineData) {
      return;
    }

    const target = targetForEvent(this.#traceEngineData, event);
    if (!target) {
      return;
    }

    const nodeIds = TraceEngine.Extras.FetchNodes.nodeIdsForEvent(this.#traceEngineData, event);
    for (const nodeId of nodeIds) {
      new SDK.DOMModel.DeferredDOMNode(target, nodeId).highlight();
    }
  }

  highlightEvent(event: TraceEngine.Types.TraceEvents.TraceEventData|null): void {
    const entryIndex =
        event ? this.mainDataProvider.entryIndexForSelection(TimelineSelection.fromTraceEvent(event)) : -1;
    if (entryIndex >= 0) {
      this.mainFlameChart.highlightEntry(entryIndex);
    } else {
      this.mainFlameChart.hideHighlight();
    }
  }

  override willHide(): void {
    this.networkFlameChartGroupExpansionSetting.removeChangeListener(this.resizeToPreferredHeights, this);
    Bindings.IgnoreListManager.IgnoreListManager.instance().removeChangeListener(this.#boundRefreshAfterIgnoreList);
  }

  override wasShown(): void {
    this.registerCSSFiles([timelineFlameChartViewStyles]);
    this.networkFlameChartGroupExpansionSetting.addChangeListener(this.resizeToPreferredHeights, this);
    Bindings.IgnoreListManager.IgnoreListManager.instance().addChangeListener(this.#boundRefreshAfterIgnoreList);
    if (this.needsResizeToPreferredHeights) {
      this.resizeToPreferredHeights();
    }
    this.#updateFlameCharts();
  }

  updateCountersGraphToggle(showMemoryGraph: boolean): void {
    if (showMemoryGraph) {
      this.chartSplitWidget.showBoth();
    } else {
      this.chartSplitWidget.hideSidebar();
    }
  }

  setSelection(selection: TimelineSelection|null): void {
    let index = this.mainDataProvider.entryIndexForSelection(selection);
    this.mainFlameChart.setSelectedEntry(index);
    index = this.networkDataProvider.entryIndexForSelection(selection);
    this.networkFlameChart.setSelectedEntry(index);
    if (this.detailsView) {
      // TODO(crbug.com/1459265):  Change to await after migration work.
      void this.detailsView.setSelection(selection);
    }
  }

  private onEntrySelected(
      dataProvider: PerfUI.FlameChart.FlameChartDataProvider,
      event: Common.EventTarget.EventTargetEvent<number>): void {
    const entryIndex = event.data;
    if (dataProvider === this.mainDataProvider) {
      if (this.mainDataProvider.buildFlowForInitiator(entryIndex)) {
        this.mainFlameChart.scheduleUpdate();
      }
    }
    this.delegate.select((dataProvider as TimelineFlameChartNetworkDataProvider | TimelineFlameChartDataProvider)
                             .createSelection(entryIndex));
  }

  resizeToPreferredHeights(): void {
    if (!this.isShowing()) {
      this.needsResizeToPreferredHeights = true;
      return;
    }
    this.needsResizeToPreferredHeights = false;
    this.networkPane.element.classList.toggle(
        'timeline-network-resizer-disabled', !this.networkDataProvider.isExpanded());
    this.networkSplitWidget.setSidebarSize(
        this.networkDataProvider.preferredHeight() + this.splitResizer.clientHeight + PerfUI.FlameChart.RulerHeight +
        2);
  }

  setSearchableView(searchableView: UI.SearchableView.SearchableView): void {
    this.searchableView = searchableView;
  }

  // UI.SearchableView.Searchable implementation

  jumpToNextSearchResult(): void {
    if (!this.searchResults || !this.searchResults.length) {
      return;
    }
    const index =
        typeof this.selectedSearchResult !== 'undefined' ? this.searchResults.indexOf(this.selectedSearchResult) : -1;
    this.selectSearchResult(Platform.NumberUtilities.mod(index + 1, this.searchResults.length));
  }

  jumpToPreviousSearchResult(): void {
    if (!this.searchResults || !this.searchResults.length) {
      return;
    }
    const index =
        typeof this.selectedSearchResult !== 'undefined' ? this.searchResults.indexOf(this.selectedSearchResult) : 0;
    this.selectSearchResult(Platform.NumberUtilities.mod(index - 1, this.searchResults.length));
  }

  supportsCaseSensitiveSearch(): boolean {
    return true;
  }

  supportsRegexSearch(): boolean {
    return true;
  }

  private selectSearchResult(index: number): void {
    this.searchableView.updateCurrentMatchIndex(index);
    if (this.searchResults) {
      this.selectedSearchResult = this.searchResults[index];
      this.delegate.select(this.mainDataProvider.createSelection(this.selectedSearchResult));
      this.mainFlameChart.showPopoverForSearchResult(this.selectedSearchResult);
    }
  }

  private updateSearchResults(shouldJump: boolean, jumpBackwards?: boolean): void {
    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      return;
    }

    const oldSelectedSearchResult = (this.selectedSearchResult as number);
    delete this.selectedSearchResult;
    this.searchResults = [];
    this.mainFlameChart.removeSearchResultHighlights();
    if (!this.searchRegex) {
      return;
    }
    const regExpFilter = new TimelineRegExp(this.searchRegex);
    const visibleWindow = traceBoundsState.milli.timelineTraceWindow;
    this.searchResults = this.mainDataProvider.search(visibleWindow.min, visibleWindow.max, regExpFilter) || [];
    this.searchableView.updateSearchMatchesCount(this.searchResults.length);
    // To avoid too many highlights when the search regex matches too many entries,
    // for example, when user only types in "e" as the search query,
    // We only highlight the search results when the number of matches is less than or equal to 200.
    if (this.searchResults.length <= MAX_HIGHLIGHTED_SEARCH_ELEMENTS) {
      this.mainFlameChart.highlightAllEntries(this.searchResults);
    }
    if (!shouldJump || !this.searchResults.length) {
      return;
    }
    let selectedIndex = this.searchResults.indexOf(oldSelectedSearchResult);
    if (selectedIndex === -1) {
      selectedIndex = jumpBackwards ? this.searchResults.length - 1 : 0;
    }
    this.selectSearchResult(selectedIndex);
  }

  /**
   * Returns the indexes of the elements that matched the most recent
   * query. Elements are indexed by the data provider and correspond
   * to their position in the data provider entry data array.
   * Public only for tests.
   */
  getSearchResults(): number[]|undefined {
    return this.searchResults;
  }

  onSearchCanceled(): void {
    if (typeof this.selectedSearchResult !== 'undefined') {
      this.delegate.select(null);
    }
    delete this.searchResults;
    delete this.selectedSearchResult;
    delete this.searchRegex;
    this.mainFlameChart.showPopoverForSearchResult(-1);
    this.mainFlameChart.removeSearchResultHighlights();
  }

  performSearch(searchConfig: UI.SearchableView.SearchConfig, shouldJump: boolean, jumpBackwards?: boolean): void {
    this.searchRegex = searchConfig.toSearchRegex().regex;
    this.updateSearchResults(shouldJump, jumpBackwards);
  }
}

export class Selection {
  timelineSelection: TimelineSelection;
  entryIndex: number;
  constructor(selection: TimelineSelection, entryIndex: number) {
    this.timelineSelection = selection;
    this.entryIndex = entryIndex;
  }
}

export const FlameChartStyle = {
  textColor: '#333',
};

export class TimelineFlameChartMarker implements PerfUI.FlameChart.FlameChartMarker {
  private readonly startTimeInternal: number;
  private readonly startOffset: number;
  private style: TimelineMarkerStyle;
  constructor(startTime: number, startOffset: number, style: TimelineMarkerStyle) {
    this.startTimeInternal = startTime;
    this.startOffset = startOffset;
    this.style = style;
  }

  startTime(): number {
    return this.startTimeInternal;
  }

  color(): string {
    return this.style.color;
  }

  title(): string|null {
    if (this.style.lowPriority) {
      return null;
    }
    const startTime = i18n.TimeUtilities.millisToString(this.startOffset);
    return i18nString(UIStrings.sAtS, {PH1: this.style.title, PH2: startTime});
  }

  draw(context: CanvasRenderingContext2D, x: number, height: number, pixelsPerMillisecond: number): void {
    const lowPriorityVisibilityThresholdInPixelsPerMs = 4;

    if (this.style.lowPriority && pixelsPerMillisecond < lowPriorityVisibilityThresholdInPixelsPerMs) {
      return;
    }

    context.save();
    if (this.style.tall) {
      context.strokeStyle = this.style.color;
      context.lineWidth = this.style.lineWidth;
      context.translate(this.style.lineWidth < 1 || (this.style.lineWidth & 1) ? 0.5 : 0, 0.5);
      context.beginPath();
      context.moveTo(x, 0);
      context.setLineDash(this.style.dashStyle);
      context.lineTo(x, context.canvas.height);
      context.stroke();
    }
    context.restore();
  }
}

export const enum ColorBy {
  URL = 'URL',
}

// This would live in timeline/components if this wasn't a prototype.
// eslint-disable-next-line rulesdir/custom_element_definitions_location
class OverlayEntryTimingBreakdownUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-overlay-entry-timings-breakdown`;
  #overlay: EntryTimingBreakdownOverlay|null = null;
  #microSecondsToPixel: ((x: TraceEngine.Types.Timing.MicroSeconds) => number)|null = null;

  set overlay(overlay: EntryTimingBreakdownOverlay) {
    if (overlay === this.#overlay) {
      return;
    }
    this.#overlay = overlay;
    this.#render();
  }

  set microSecondsToPixel(func: (x: TraceEngine.Types.Timing.MicroSeconds) => number) {
    if (this.#microSecondsToPixel === func) {
      return;
    }
    this.#microSecondsToPixel = func;
    this.#render();
  }

  #render(): void {
    if (!this.#overlay || !this.#microSecondsToPixel) {
      return;
    }

    const {entry} = this.#overlay;
    // Note: would use shadow dom in the real impl and style properly, but this will do for prototyping...
    LitHtml.render(
        // clang-format off
        LitHtml.html`<ul class="sections-time">
        ${this.#overlay.sections.map(section => {
          const sectionTimeSpan = section.end - section.start;
          const spanPercentage = sectionTimeSpan / entry.dur * 100;
          return LitHtml.html`
            <li class=${section.className} style=${LitHtml.Directives.styleMap({
              width: `${spanPercentage}%`,
            })}></li>
          `;

        })}
        </ul>
        <ul class="sections-labels">
        ${this.#overlay.sections.map(section => {
          return LitHtml.html`
            <li class=${section.className}>${section.label}</li>
          `;
        })}
        </ul>
        `,
        // clang-format on
        this, {host: this});
  }
}
customElements.define('devtools-overlay-entry-timings-breakdown', OverlayEntryTimingBreakdownUI);
declare global {
  interface HTMLElementTagNameMap {
    'devtools-overlay-entry-timings-breakdown': OverlayEntryTimingBreakdownUI;
  }
}
