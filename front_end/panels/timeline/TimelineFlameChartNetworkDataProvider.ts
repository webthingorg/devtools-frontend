// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as Protocol from '../../generated/protocol.js';
import * as TraceEngine from '../../models/trace/trace.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {InstantEventVisibleDurationMs} from './TimelineFlameChartDataProvider.js';
import timelineFlamechartPopoverStyles from './timelineFlamechartPopover.css.js';
import {FlameChartStyle, Selection} from './TimelineFlameChartView.js';
import {TimelineSelection} from './TimelineSelection.js';
import {TimelineUIUtils} from './TimelineUIUtils.js';

const UIStrings = {
  /**
   *@description Title of the Network tool
   */
  network: 'Network',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/TimelineFlameChartNetworkDataProvider.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class TimelineFlameChartNetworkDataProvider implements PerfUI.FlameChart.FlameChartDataProvider {
  readonly #font: string;
  readonly #style: {
    padding: number,
    height: number,
    collapsible: boolean,
    color: string,
    font: string,
    backgroundColor: string,
    nestingLevel: number,
    useFirstLineForOverview: boolean,
    useDecoratorsForOverview: boolean,
    shareHeaderLine: boolean,
  };
  #group: PerfUI.FlameChart.Group;
  #minimumBoundaryInternal: number;
  #timeSpan: number;
  #events: TraceEngine.Types.TraceEvents.TraceEventSyntheticNetworkRequest[];
  #maxLevel: number;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #timelineDataInternal?: any;
  #startTime?: number;
  #endTime?: number;
  #lastSelection?: Selection;
  #priorityToValue?: Map<string, number>;
  // Ignored during the migration to new trace data engine.
  /* eslint-disable-next-line no-unused-private-class-members */
  #traceEngineData: TraceEngine.Handlers.Migration.PartialTraceData|null;
  constructor() {
    this.#font = `${PerfUI.Font.DEFAULT_FONT_SIZE} ${PerfUI.Font.getFontFamilyForCanvas()}`;
    this.#style = {
      padding: 4,
      height: 17,
      collapsible: true,
      color: ThemeSupport.ThemeSupport.instance().getComputedValue('--color-text-primary'),
      font: this.#font,
      backgroundColor: ThemeSupport.ThemeSupport.instance().getComputedValue('--color-background'),
      nestingLevel: 0,
      useFirstLineForOverview: false,
      useDecoratorsForOverview: true,
      shareHeaderLine: false,
    };
    this.#group =
        ({startLevel: 0, name: i18nString(UIStrings.network), expanded: false, style: this.#style} as
         PerfUI.FlameChart.Group);
    this.#minimumBoundaryInternal = 0;
    this.#timeSpan = 0;
    this.#events = [];
    this.#maxLevel = 0;

    this.#traceEngineData = null;

    // In the event of a theme change, these colors must be recalculated.
    ThemeSupport.ThemeSupport.instance().addEventListener(ThemeSupport.ThemeChangeEvent.eventName, () => {
      this.#style.color = ThemeSupport.ThemeSupport.instance().getComputedValue('--color-text-primary');
      this.#style.backgroundColor = ThemeSupport.ThemeSupport.instance().getComputedValue('--color-background');
    });
  }

  setModel(traceEngineData: TraceEngine.Handlers.Migration.PartialTraceData|null): void {
    this.#timelineDataInternal = null;
    this.#traceEngineData = traceEngineData;
  }

  isEmpty(): boolean {
    this.timelineData();
    return !this.#events.length;
  }

  maxStackDepth(): number {
    return this.#maxLevel;
  }

  timelineData(): PerfUI.FlameChart.FlameChartTimelineData {
    if (this.#timelineDataInternal) {
      return this.#timelineDataInternal;
    }
    this.#events = [];
    this.#timelineDataInternal = PerfUI.FlameChart.FlameChartTimelineData.createEmpty();
    if (this.#traceEngineData) {
      this.#appendTimelineData();
    }
    return this.#timelineDataInternal;
  }

  minimumBoundary(): number {
    return this.#minimumBoundaryInternal;
  }

  totalTime(): number {
    return this.#timeSpan;
  }

  setWindowTimes(startTime: number, endTime: number): void {
    this.#startTime = startTime;
    this.#endTime = endTime;
    this.#updateTimelineData();
  }

  createSelection(index: number): TimelineSelection|null {
    if (index === -1) {
      return null;
    }
    const event = this.#events[index];
    this.#lastSelection = new Selection(TimelineSelection.fromTraceEvent(event), index);
    return this.#lastSelection.timelineSelection;
  }

  entryIndexForSelection(selection: TimelineSelection|null): number {
    if (!selection) {
      return -1;
    }

    if (this.#lastSelection && this.#lastSelection.timelineSelection.object === selection.object) {
      return this.#lastSelection.entryIndex;
    }

    if (!TimelineSelection.isSyntheticNetworkRequestDetailsEventSelection(selection.object)) {
      return -1;
    }

    const index =
        this.#events.indexOf(selection.object);
    if (index !== -1) {
      this.#lastSelection = new Selection(TimelineSelection.fromTraceEvent(selection.object), index);
    }
    return index;
  }

  entryColor(index: number): string {
    const event = this.#events[index];
    const category = TimelineUIUtils.syntheticNetworkRequestCategory(event);
    return TimelineUIUtils.networkCategoryColor(category);
  }

  textColor(_index: number): string {
    return FlameChartStyle.textColor;
  }

  entryTitle(index: number): string|null {
    const event = this.#events[index];
    const parsedURL = new Common.ParsedURL.ParsedURL(event.args.data.url);
    return parsedURL.isValid ? `${parsedURL.displayName} (${parsedURL.host})` : event.args.data.url || null;
  }

  entryFont(_index: number): string|null {
    return this.#font;
  }

  /**
   * Returns the pixels needed to decorate the event.
   * The pixels compare to the start of the earliest event of the request.
   *
   * Request.beginTime(), which is used in FlameChart to calculate the unclippedBarX
   * v
   *    |----------------[ (URL text)    waiting time   |   request  ]--------|
   *    ^start           ^sendStart                     ^headersEnd  ^Finish  ^end
   * @param request
   * @param unclippedBarX The start pixel of the request. It is calculated with request.beginTime() in FlameChart.
   * @param timeToPixelRatio
   * @returns the pixels to draw waiting time and left and right whiskers and url text
   */
  getDecorationPixels(
      event: TraceEngine.Types.TraceEvents.TraceEventSyntheticNetworkRequest, unclippedBarX: number,
      timeToPixelRatio: number): {sendStart: number, headersEnd: number, finish: number, start: number, end: number} {
    const beginTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
    const timeToPixel = (time: number): number => Math.floor(unclippedBarX + (time - beginTime) * timeToPixelRatio);
    const minBarWidthPx = 2;
    const startTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
    const endTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
        (event.ts + event.dur) as TraceEngine.Types.Timing.MicroSeconds);
    const sendStartTime =
        TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.args.data.syntheticData.sendStartTime);
    const headersEndTime =
        TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.args.data.syntheticData.downloadStart);
    const sendStart = Math.max(timeToPixel(sendStartTime), unclippedBarX);
    const headersEnd = Math.max(timeToPixel(headersEndTime), sendStart);
    const finish = Math.max(
        timeToPixel(TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.args.data.syntheticData.finishTime)),
        headersEnd + minBarWidthPx);
    const start = timeToPixel(startTime);
    const end = Math.max(timeToPixel(endTime), finish);

    return {sendStart, headersEnd, finish, start, end};
  }

  /**
   * Decorates the entry:
   *   Draw a waiting time between |sendStart| and |headersEnd|
   *     By adding a extra transparent white layer
   *   Draw a whisk between |start| and |sendStart|
   *   Draw a whisk between |finish| and |end|
   *     By draw another layer of background color to "clear" the area
   *     Then draw the whisk
   *   Draw the URL after the |sendStart|
   *
   *   |----------------[ (URL text)    waiting time   |   request  ]--------|
   *   ^start           ^sendStart                     ^headersEnd  ^Finish  ^end
   * @param index
   * @param context
   * @param barX The x pixel of the visible part request
   * @param barY The y pixel of the visible part request
   * @param barWidth The width of the visible part request
   * @param barHeight The height of the visible part request
   * @param unclippedBarX The start pixel of the request compare to the visible area. It is calculated with request.beginTime() in FlameChart.
   * @param timeToPixelRatio
   * @returns if the entry needs to be decorate, which is alway true if the request has "timing" field
   */
  decorateEntry(
      index: number, context: CanvasRenderingContext2D, _text: string|null, barX: number, barY: number,
      barWidth: number, barHeight: number, unclippedBarX: number, timeToPixelRatio: number): boolean {
    const event = this.#events[index];

    const {sendStart, headersEnd, finish, start, end} =
        this.getDecorationPixels(event, unclippedBarX, timeToPixelRatio);

    // Draw waiting time.
    context.fillStyle = 'hsla(0, 100%, 100%, 0.8)';
    context.fillRect(sendStart + 0.5, barY + 0.5, headersEnd - sendStart - 0.5, barHeight - 2);
    // Clear portions of initial rect to prepare for the ticks.
    context.fillStyle = ThemeSupport.ThemeSupport.instance().getComputedValue('--color-background');
    context.fillRect(barX, barY - 0.5, sendStart - barX, barHeight);
    context.fillRect(finish, barY - 0.5, barX + barWidth - finish, barHeight);

    // Draws left and right whiskers
    function drawTick(begin: number, end: number, y: number): void {
      const /** @const */ tickHeightPx = 6;
      context.moveTo(begin, y - tickHeightPx / 2);
      context.lineTo(begin, y + tickHeightPx / 2);
      context.moveTo(begin, y);
      context.lineTo(end, y);
    }

    context.beginPath();
    context.lineWidth = 1;
    context.strokeStyle = '#ccc';
    const lineY = Math.floor(barY + barHeight / 2) + 0.5;
    const leftTick = start + 0.5;
    const rightTick = end - 0.5;
    drawTick(leftTick, sendStart, lineY);
    drawTick(rightTick, finish, lineY);
    context.stroke();

    const color = this.#colorForPriority(event.args.data.priority);
    if (color) {
      context.fillStyle = color;
      context.fillRect(sendStart + 0.5, barY + 0.5, 3.5, 3.5);
    }

    // Draw request URL as text
    const textStart = Math.max(sendStart, 0);
    const textWidth = finish - textStart;
    const /** @const */ minTextWidthPx = 20;
    if (textWidth >= minTextWidthPx) {
      let title = this.entryTitle(index) || '';
      if (event.args.data.fromServiceWorker) {
        title = '⚙ ' + title;
      }
      if (title) {
        const /** @const */ textPadding = 4;
        const /** @const */ textBaseline = 5;
        const textBaseHeight = barHeight - textBaseline;
        const trimmedText = UI.UIUtils.trimTextEnd(context, title, textWidth - 2 * textPadding);
        context.fillStyle = '#333';
        context.fillText(trimmedText, textStart + textPadding, barY + textBaseHeight);
      }
    }

    return true;
  }

  forceDecoration(_index: number): boolean {
    return true;
  }

  prepareHighlightedEntryInfo(index: number): Element|null {
    const /** @const */ maxURLChars = 80;
    const event = this.#events[index];
    const element = document.createElement('div');
    const root = UI.Utils.createShadowRootWithCoreStyles(element, {
      cssFile: [timelineFlamechartPopoverStyles],
      delegatesFocus: undefined,
    });
    const contents = root.createChild('div', 'timeline-flamechart-popover');
    const startTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
    const duration = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.dur);
    if (startTime && isFinite(duration)) {
      contents.createChild('span', 'timeline-info-network-time').textContent =
          i18n.TimeUtilities.millisToString(duration, true);
    }
    const div = (contents.createChild('span') as HTMLElement);
    div.textContent = PerfUI.NetworkPriorities.uiLabelForNetworkPriority(
        (event.args.data.priority as Protocol.Network.ResourcePriority));
    div.style.color = this.#colorForPriority(event.args.data.priority) || 'black';
    contents.createChild('span').textContent = Platform.StringUtilities.trimMiddle(event.args.data.url, maxURLChars);
    return element;
  }

  #colorForPriority(priority: string): string|null {
    if (!this.#priorityToValue) {
      this.#priorityToValue = new Map([
        [Protocol.Network.ResourcePriority.VeryLow, 1],
        [Protocol.Network.ResourcePriority.Low, 2],
        [Protocol.Network.ResourcePriority.Medium, 3],
        [Protocol.Network.ResourcePriority.High, 4],
        [Protocol.Network.ResourcePriority.VeryHigh, 5],
      ]);
    }
    const value = this.#priorityToValue.get(priority);
    return value ? `hsla(214, 80%, 50%, ${value / 5})` : null;
  }

  /**
   * Sets the minimum time and total time span of a trace using the
   * new engine data.
   */
  #setTimingBoundsData(newTraceEngineData: TraceEngine.Handlers.Migration.PartialTraceData): void {
    const {traceBounds} = newTraceEngineData.Meta;
    const minTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(traceBounds.min);
    const maxTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(traceBounds.max);
    this.#minimumBoundaryInternal = minTime;
    this.#timeSpan = minTime === maxTime ? 1000 : maxTime - this.#minimumBoundaryInternal;
  }

  #appendTimelineData(): void {
    if (this.#traceEngineData) {
      this.#setTimingBoundsData(this.#traceEngineData);
      this.#traceEngineData?.NetworkRequests.byTime.forEach(this.#appendEntry.bind(this));
      this.#updateTimelineData();
    }
  }

  #updateTimelineData(): void {
    if (!this.#timelineDataInternal) {
      return;
    }
    const lastTimeByLevel = [];
    let maxLevel = 0;
    for (let i = 0; i < this.#events.length; ++i) {
      const event = this.#events[i];
      const beginTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
      const startTime = (this.#startTime as number);
      const endTime = (this.#endTime as number);
      const eventEndTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
          (event.ts + event.dur) as TraceEngine.Types.Timing.MicroSeconds);
      const visible = beginTime < endTime && eventEndTime > startTime;
      if (!visible) {
        this.#timelineDataInternal.entryLevels[i] = -1;
        continue;
      }
      while (lastTimeByLevel.length && lastTimeByLevel[lastTimeByLevel.length - 1] <= beginTime) {
        lastTimeByLevel.pop();
      }
      this.#timelineDataInternal.entryLevels[i] = lastTimeByLevel.length;
      lastTimeByLevel.push(eventEndTime);
      maxLevel = Math.max(maxLevel, lastTimeByLevel.length);
    }
    for (let i = 0; i < this.#events.length; ++i) {
      if (this.#timelineDataInternal.entryLevels[i] === -1) {
        this.#timelineDataInternal.entryLevels[i] = maxLevel;
      }
    }
    this.#timelineDataInternal = PerfUI.FlameChart.FlameChartTimelineData.create({
      entryLevels: this.#timelineDataInternal.entryLevels,
      entryTotalTimes: this.#timelineDataInternal.entryTotalTimes,
      entryStartTimes: this.#timelineDataInternal.entryStartTimes,
      groups: [this.#group],
    });
    this.#maxLevel = maxLevel;
  }

  #appendEntry(event: TraceEngine.Types.TraceEvents.TraceEventSyntheticNetworkRequest): void {
    this.#events.push(event);
    this.#timelineDataInternal.entryStartTimes.push(TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts));
    const msDuration = event.dur ||
        TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
            InstantEventVisibleDurationMs as TraceEngine.Types.Timing.MilliSeconds);
    this.#timelineDataInternal.entryTotalTimes.push(TraceEngine.Helpers.Timing.microSecondsToMilliseconds(msDuration));
    this.#timelineDataInternal.entryLevels.push(this.#events.length - 1);
  }

  preferredHeight(): number {
    return this.#style.height * (this.#group.expanded ? Platform.NumberUtilities.clamp(this.#maxLevel + 1, 4, 8.5) : 1);
  }

  isExpanded(): boolean {
    return this.#group && Boolean(this.#group.expanded);
  }

  formatValue(value: number, precision?: number): string {
    return i18n.TimeUtilities.preciseMillisToString(value, precision);
  }

  canJumpToEntry(_entryIndex: number): boolean {
    return false;
  }

  navStartTimes(): Map<string, TraceEngine.Types.TraceEvents.TraceEventNavigationStart> {
    return this.#traceEngineData?.Meta.navigationsByNavigationId || new Map();
  }
}
