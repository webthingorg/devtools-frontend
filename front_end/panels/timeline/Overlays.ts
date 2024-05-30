// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {type TimelineFlameChartDataProvider} from './TimelineFlameChartDataProvider.js';
import {type TimelineFlameChartNetworkDataProvider} from './TimelineFlameChartNetworkDataProvider.js';

const NETWORK_RESIZE_ELEM_HEIGHT_PX = 8;

export type EntryChartLocation = 'main'|'network';
/**
 * Represents when a user has selected an entry in the timeline
 */
export interface EntrySelected {
  type: 'ENTRY_SELECTED';
  entry: TraceEngine.Types.TraceEvents.TraceEventData;
  entryChart: EntryChartLocation;
}

/**
 * All supported overlay types. Expected to grow in time!
 */
export type TimelineOverlay = EntrySelected;

/**
 * To be able to draw overlays accurately at the correct pixel position, we
 * need a variety of pixel values from both flame charts (Network and "Rest").
 * As each FlameChart draws, it emits an event with its latest set of
 * dimensions. That updates the Overlays and causes them to redraw.
 */
interface ActiveDimensions {
  trace: {
    visibleWindow: TraceEngine.Types.Timing.TraceWindowMicroSeconds|null,
  };
  charts: {
    main: FlameChartDimensions|null,
    network: FlameChartDimensions|null,
  };
}

interface FlameChartDimensions {
  widthPixels: number;
  heightPixels: number;
  scrollOffsetPixels: number;
}

export interface TimelineCharts {
  mainChart: PerfUI.FlameChart.FlameChart;
  mainProvider: TimelineFlameChartDataProvider;
  networkChart: PerfUI.FlameChart.FlameChart;
  networkProvider: TimelineFlameChartNetworkDataProvider;
}

export class Overlays {
  /**
   * The list of active overlays. Overlays can't be marked as visible or
   * hidden; every overlay in this list is rendered.
   * We track each overlay against the HTML Element we have rendered. This is
   * because on first render of a new overlay, we create it, but then on
   * subsequent renders we do not destroy and recreate it, instead we update it
   * based on the new position of the timeline.
   */
  #elementForOverlay: Map<TimelineOverlay, HTMLElement|null> = new Map();

  #dimensions: ActiveDimensions = {
    trace: {
      visibleWindow: null,
    },
    charts: {
      main: null,
      network: null,
    },
  };

  /**
   * To calculate the Y pixel value for an event we need access to the chart
   * and data provider in order to find out what level the event is on, and from
   * there calculate the pixel value for that level.
   */
  #charts: TimelineCharts;

  /**
   * The Overlays class will take each overlay, generate its HTML, and add it
   * to the container. This container is provided for us when the class is
   * created so we can manage its contents as overlays come and go.
   */
  #overlaysContainer: HTMLElement;

  constructor(init: {
    container: HTMLElement,
    charts: TimelineCharts,
  }) {
    this.#overlaysContainer = init.container;
    this.#charts = init.charts;
  }

  /**
   * Add a new overlay to the view.
   */
  addOverlay(overlay: TimelineOverlay): void {
    if (this.#elementForOverlay.has(overlay)) {
      return;
    }

    // By setting the value to null, we ensure that on the next render that the
    // overlay will have a new HTML element created for it.
    this.#elementForOverlay.set(overlay, null);
  }

  overlaysForEntry(entry: TraceEngine.Types.TraceEvents.TraceEventData): TimelineOverlay[] {
    const matches: TimelineOverlay[] = [];
    for (const [overlay] of this.#elementForOverlay) {
      if (overlay.entry === entry) {
        matches.push(overlay);
      }
    }
    return matches;
  }

  removeOverlaysOfType(type: TimelineOverlay['type']): void {
    const overlaysToRemove = Array.from(this.#elementForOverlay.keys()).filter(overlay => {
      return overlay.type === type;
    });
    for (const overlay of overlaysToRemove) {
      const htmlElement = this.#elementForOverlay.get(overlay);
      if (htmlElement && this.#overlaysContainer) {
        this.#overlaysContainer.removeChild(htmlElement);
      }
      this.#elementForOverlay.delete(overlay);
    }
  }

  /**
   * Update the dimenions of a chart.
   * IMPORTANT: this does not trigger a re-draw. You must call the render() method manually.
   */
  updateChartDimensions(chart: 'main'|'network', dimensions: FlameChartDimensions): void {
    this.#dimensions.charts[chart] = dimensions;
  }

  /**
   * Update the visible window of the UI.
   * IMPORTANT: this does not trigger a re-draw. You must call the render() method manually.
   */
  updateVisibleWindow(visibleWindow: TraceEngine.Types.Timing.TraceWindowMicroSeconds): void {
    this.#dimensions.trace.visibleWindow = visibleWindow;
  }

  /**
   * Clears all overlays and all data. Call this when the trace is changing
   * (e.g. the user has imported/recorded a new trace) and we need to start from
   * scratch and remove all overlays relating to the preivous trace.
   */
  reset(): void {
    if (this.#overlaysContainer) {
      this.#overlaysContainer.innerHTML = '';
    }
    this.#elementForOverlay.clear();

    // Clear out dimensions from the old Flame Charts.
    this.#dimensions.trace.visibleWindow = null;
    this.#dimensions.charts.main = null;
    this.#dimensions.charts.network = null;
  }

  update(): void {
    for (const [overlay, existingElement] of this.#elementForOverlay) {
      const element = existingElement || this.#createElementForNewOverlay(overlay);
      if (!existingElement) {
        this.#elementForOverlay.set(overlay, element);
        this.#overlaysContainer.appendChild(element);
      }
      this.#positionOverlay(overlay, element);
    }
  }

  #positionOverlay(overlay: TimelineOverlay, element: HTMLElement): void {
    switch (overlay.type) {
      case 'ENTRY_SELECTED': {
        if (this.entryIsVisibleOnChart(overlay.entryChart, overlay.entry)) {
          element.style.visibility = 'visible';
          this.#positionEntrySelectedOverlay(overlay, element);
        } else {
          element.style.visibility = 'hidden';
        }
        break;
      }
      default: {
        console.error(`Unknown overlay type: ${overlay.type}`);
      }
    }
  }

  #positionEntrySelectedOverlay(overlay: EntrySelected, element: HTMLElement): void {
    let x = this.xPixelForEventOnChart(overlay.entryChart, overlay.entry);
    let y = this.yPixelForEventOnChart(overlay.entryChart, overlay.entry);

    if (x === null || y === null) {
      return;
    }

    const {endTime} = TraceEngine.Helpers.Timing.eventTimingsMicroSeconds(overlay.entry);
    const endX = this.#xPixelForMicroSeconds(overlay.entryChart, endTime);
    if (endX === null) {
      return;
    }
    const totalHeight = this.pixelHeightForEventOnChart(overlay.entryChart, overlay.entry) ?? 0;
    // We might modify the height we use when drawing the overlay, hence copying the totalHeight.
    let height = totalHeight;
    if (height === null) {
      return;
    }

    let widthPixels = endX - x;

    if (!overlay.entry.dur) {
      const provider = overlay.entryChart === 'main' ? this.#charts.mainProvider : this.#charts.networkProvider;
      const chart = overlay.entryChart === 'main' ? this.#charts.mainChart : this.#charts.networkChart;
      // It could be a marker event, in which case we need to know the
      // exact position the marker was rendered. This is because markers
      // which have the same timestamp are rendered next to each other, so
      // the timestamp is not necessarily exactly where the marker was
      // rendered.
      const index = provider.indexForEvent(overlay.entry);
      const markerPixels = chart.getMarkerPixelsForEntryIndex(index ?? -1);
      if (markerPixels) {
        x = markerPixels.x;
        widthPixels = markerPixels.width;
      }
    }

    const finalWidth = Math.max(2, widthPixels);
    element.style.width = `${finalWidth}px`;

    // If the event is on the main chart, we need to adjust its selected border
    // if the event is cut off the top of the screen, because we need to ensure
    // that it does not overlap the resize element. Unfortunately we cannot
    // z-index our way out of this, so instead we calculate if the event is cut
    // off, and if it is, we draw the partial selected outline and do not draw
    // the top border, making it appear like it is going behind the resizer.
    // We don't need to worry about it going off the bottom, because in that
    // case we don't draw the overlay anyway.
    if (overlay.entryChart === 'main') {
      const chartTopPadding = this.#networkChartOffsetHeight();
      // We now calculate the available height: if the entry is cut off we don't
      // show the border for the part that is cut off.
      const cutOffTop = y < chartTopPadding;

      height = cutOffTop ? Math.abs(y + height - chartTopPadding) : height;
      element.classList.toggle('cut-off-top', cutOffTop);
      if (cutOffTop) {
        // Adjust the y position: we need to move it down from the top Y
        // position to the Y position of the first visible pixel. The
        // adjustment is totalHeight - height because if the totalHeight is 17,
        // and the visibleHeight is 5, we need to draw the overay at 17-5=12px
        // vertically from the top of the event.
        y = y + totalHeight - height;
      }
    } else {
      // If the event is on the network chart, we use the same logic as above
      // for the main chart, but to check if the event is cut off the bottom of
      // the network track and only part of the overlay is visible.
      // We don't need to worry about the even going off the top of the panel
      // as we can show the full overlay and it gets cut off by the minimap UI.
      const networkHeight = this.#dimensions.charts.network?.heightPixels ?? 0;
      const lastVisibleY = y + totalHeight;
      const cutOffBottom = lastVisibleY > networkHeight;
      element.classList.toggle('cut-off-bottom', cutOffBottom);
      if (cutOffBottom) {
        // Adjust the height of the overlay to be the amount of visible pixels.
        height = networkHeight - y;
      }
    }

    element.style.height = `${height}px`;
    element.style.top = `${y}px`;
    element.style.left = `${x}px`;
  }

  #createElementForNewOverlay(overlay: TimelineOverlay): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('overlay-item', `overlay-type-${overlay.type}`);
    return div;
  }

  entryIsVisibleOnChart(chartName: EntryChartLocation, entry: TraceEngine.Types.TraceEvents.TraceEventData): boolean {
    const y = this.yPixelForEventOnChart(chartName, entry);
    if (y === null) {
      return false;
    }

    const eventHeight = this.pixelHeightForEventOnChart(chartName, entry);
    if (!eventHeight) {
      return false;
    }

    // TODO: horiziontal visibility.

    if (chartName === 'main') {
      const yWithoutNetwork = y - this.#networkChartOffsetHeight();
      // If, without pushing the entry down for the network track, the value is
      // <0, this entry is scrolled out of view.
      if (yWithoutNetwork + eventHeight < 0) {
        return false;
      }
      // TODO: if y > the total height, then it's also hidden
      return true;
    }

    if (chartName === 'network') {
      if (!this.#dimensions.charts.network) {
        // The network chart can be hidden if there are no requests in the trace.
        return false;
      }
      if (y <= -14) {
        // Weird value, but the network chart has the header row with
        // timestamps on it: events stay visible behind those timestamps, so we
        // want any overlays to treat themselves as visible too.
        return false;
      }

      if (y > this.#dimensions.charts.network.heightPixels ?? 0) {
        return false;
      }

      return true;
    }
    return true;
  }

  /**
   * Calculate the X pixel position for an event on the timeline.
   * @param chartName - the chart that the event is on. It is expected that both
   * charts have the same width so this doesn't make a difference - but it might
   * in the future if the UI changes, hence asking for it.
   *
   * @param event - the trace event you want to get the pixel position of
   */
  xPixelForEventOnChart(chartName: EntryChartLocation, event: TraceEngine.Types.TraceEvents.TraceEventData): number
      |null {
    return this.#xPixelForMicroSeconds(chartName, event.ts);
  }

  #xPixelForMicroSeconds(chart: EntryChartLocation, timestamp: TraceEngine.Types.Timing.MicroSeconds): number|null {
    if (this.#dimensions.trace.visibleWindow === null) {
      console.error('Cannot calculate xPixel without visible trace window.');
      return null;
    }
    const canvasWidthPixels = this.#dimensions.charts[chart]?.widthPixels ?? null;
    if (!canvasWidthPixels) {
      console.error(`Cannot calculate xPixel without ${chart} dimensions.`);
      return null;
    }

    const timeFromLeft = timestamp - this.#dimensions.trace.visibleWindow.min;
    const totalTimeSpan = this.#dimensions.trace.visibleWindow.range;
    return Math.floor(
        timeFromLeft / totalTimeSpan * canvasWidthPixels,
    );
  }

  /**
   * Calculate the Y pixel position for the event on the timeline relative to
   * the entire window.
   * This means if the event is in the main flame chart and below the network,
   * we add the height of the network chart to the Y value to position it
   * correctly.
   */
  yPixelForEventOnChart(chartName: 'main'|'network', event: TraceEngine.Types.TraceEvents.TraceEventData): number|null {
    const chart = chartName === 'main' ? this.#charts.mainChart : this.#charts.networkChart;
    const provider = chartName === 'main' ? this.#charts.mainProvider : this.#charts.networkProvider;

    const indexForEntry = provider.indexForEvent(event);
    if (typeof indexForEntry !== 'number') {
      return null;
    }
    const timelineData = provider.timelineData();
    if (timelineData === null) {
      return null;
    }
    const level = timelineData.entryLevels.at(indexForEntry);
    if (typeof level === 'undefined') {
      return null;
    }

    const pixelOffsetForLevel = chart.levelToOffset(level);
    // Now we have the offset for the level, we need to adjust it by the user's scroll offset.
    let pixelAdjustedForScroll = pixelOffsetForLevel - (this.#dimensions.charts[chartName]?.scrollOffsetPixels ?? 0);

    // Now if the event is in the main chart, we need to pad its Y position
    // down by the height of the network chart + the network resize element.
    if (chartName === 'main') {
      pixelAdjustedForScroll += this.#networkChartOffsetHeight();
    }

    return pixelAdjustedForScroll;
  }

  /**
   * Calculate the height of the event on the timeline.
   */
  pixelHeightForEventOnChart(chartName: EntryChartLocation, event: TraceEngine.Types.TraceEvents.TraceEventData): number
      |null {
    const chart = chartName === 'main' ? this.#charts.mainChart : this.#charts.networkChart;
    const provider = chartName === 'main' ? this.#charts.mainProvider : this.#charts.networkProvider;

    const indexForEntry = provider.indexForEvent(event);
    if (typeof indexForEntry !== 'number') {
      return null;
    }
    const timelineData = provider.timelineData();
    if (timelineData === null) {
      return null;
    }
    const level = timelineData.entryLevels.at(indexForEntry);
    if (typeof level === 'undefined') {
      return null;
    }
    return chart.levelHeight(level);
  }

  /**
   * Calculate the height of the network chart. If the network chart has
   * height, we also allow for the size of the resize handle shown between the
   * two charts.
   */
  #networkChartOffsetHeight(): number {
    if (this.#dimensions.charts.network === null) {
      return 0;
    }

    if (this.#dimensions.charts.network.heightPixels === 0) {
      return 0;
    }

    return this.#dimensions.charts.network.heightPixels + NETWORK_RESIZE_ELEM_HEIGHT_PX;
  }
}
