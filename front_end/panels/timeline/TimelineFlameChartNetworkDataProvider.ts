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

import {NetworkTrackAppender} from './NetworkTrackAppender.js';
import timelineFlamechartPopoverStyles from './timelineFlamechartPopover.css.js';
import {FlameChartStyle, Selection} from './TimelineFlameChartView.js';
import {TimelineSelection} from './TimelineSelection.js';

export class TimelineFlameChartNetworkDataProvider implements PerfUI.FlameChart.FlameChartDataProvider {
  #minimumBoundaryInternal: number;
  #timeSpan: number;
  #events: (TraceEngine.Types.TraceEvents.SyntheticNetworkRequest|TraceEngine.Types.TraceEvents.SyntheticWebSocketEvent)[];
  #maxLevel: number;
  #networkTrackAppender: NetworkTrackAppender|null;

  #timelineDataInternal?: PerfUI.FlameChart.FlameChartTimelineData|null;
  #lastSelection?: Selection;
  #priorityToValue?: Map<string, number>;
  #traceEngineData: TraceEngine.Handlers.Types.TraceParseData|null;
  constructor() {
    this.#minimumBoundaryInternal = 0;
    this.#timeSpan = 0;
    this.#events = [];
    this.#maxLevel = 0;

    this.#networkTrackAppender = null;
    this.#traceEngineData = null;
  }

  setModel(traceEngineData: TraceEngine.Handlers.Types.TraceParseData|null): void {
    this.#timelineDataInternal = null;
    this.#traceEngineData = traceEngineData;
    this.#events = traceEngineData?.NetworkRequests.byTime || [];
    // processing websocket
    traceEngineData?.WebSockets.traceData.forEach(webSocketData => {
      let webSocketUrl = '';

      const connectionEvent =
          webSocketData.events.find(data => TraceEngine.Types.TraceEvents.isTraceEventWebSocketCreate(data)) as
              TraceEngine.Types.TraceEvents.TraceEventWebSocketCreate |
          undefined;
      const startEvent = connectionEvent? connectionEvent : webSocketData.events[0];

      if (connectionEvent) {
        webSocketUrl = connectionEvent.args.data.url;
      }
      const disconnectEvent =
      webSocketData.events.find(data => TraceEngine.Types.TraceEvents.isTraceEventWebSocketDestroy(data)) as
              TraceEngine.Types.TraceEvents.TraceEventWebSocketDestroy |
          undefined;

      const endEvent = disconnectEvent ? disconnectEvent : webSocketData.events[webSocketData.events.length - 1];

      const syntheticWebSocketEvent: TraceEngine.Types.TraceEvents.SyntheticWebSocketEvent = {
        name: 'WebSocketSyntheticEvent',
        cat: startEvent.cat,
        ph: startEvent.ph,
        
        ts: startEvent.ts,
        dur: (endEvent.ts - startEvent.ts) as TraceEngine.Types.Timing.MicroSeconds,
        pid: startEvent.pid,
        tid: startEvent.tid,
        s: startEvent.s,

        args: {
          data: {
            url: webSocketUrl,
            identifier: startEvent.args.data.identifier as number,
            frame: startEvent.args.data.frame,
            priority: Protocol.Network.ResourcePriority.Low,
            subEvents: webSocketData.events,
      
            // fromServiceWorker: false,
            // priority: Protocol.Network.ResourcePriority.VeryHigh,
            // syntheticData: {
            //   sendStartTime: startEvent.ts,
            //   downloadStart: startEvent.ts,
            //   finishTime: endEvent.ts,
            // },
          },
        },
      };
      this.#events.push(syntheticWebSocketEvent);
      for (const event of webSocketData.events) {
        if (!event.args.data.url) {
          event.args.data.url = webSocketUrl;
        }
        this.#events.push(event as unknown as TraceEngine.Types.TraceEvents.SyntheticNetworkRequest);
      }
    });

    if (this.#traceEngineData) {
      this.#setTimingBoundsData(this.#traceEngineData);
    }
  }

  isEmpty(): boolean {
    this.timelineData();
    return !this.#events.length;
  }

  maxStackDepth(): number {
    return this.#maxLevel;
  }

  timelineData(): PerfUI.FlameChart.FlameChartTimelineData {
    if (this.#timelineDataInternal && this.#timelineDataInternal.entryLevels.length !== 0) {
      // The flame chart data is built already, so return the cached data.
      return this.#timelineDataInternal;
    }

    this.#timelineDataInternal = PerfUI.FlameChart.FlameChartTimelineData.createEmpty();
    if (!this.#traceEngineData) {
      return this.#timelineDataInternal;
    }

    this.#events = this.#traceEngineData.NetworkRequests.byTime;
    this.#networkTrackAppender = new NetworkTrackAppender(this.#traceEngineData, this.#timelineDataInternal);
    this.#maxLevel = this.#networkTrackAppender.appendTrackAtLevel(0);
    // console.log('max!!')
    // console.log(this.#maxLevel)
    // console.log(this.#timelineDataInternal)
    // console.log(this.#networkTrackAppender)
    return this.#timelineDataInternal;
  }

  minimumBoundary(): number {
    return this.#minimumBoundaryInternal;
  }

  totalTime(): number {
    return this.#timeSpan;
  }

  setWindowTimes(startTime: number, endTime: number): void {
    this.#updateTimelineData(startTime, endTime);
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

    const index = this.#events.indexOf(selection.object);
    if (index !== -1) {
      this.#lastSelection = new Selection(TimelineSelection.fromTraceEvent(selection.object), index);
    }
    return index;
  }

  entryColor(index: number): string {
    if (!this.#networkTrackAppender) {
      throw new Error('networkTrackAppender should not be empty');
    }
    return this.#networkTrackAppender.colorForEvent(this.#events[index]);
  }

  textColor(_index: number): string {
    return FlameChartStyle.textColor;
  }

  entryTitle(index: number): string|null {
    const event = this.#events[index];
    if (!event.args.data.url) {
      return '(from Websocket)';
    }
    const parsedURL = new Common.ParsedURL.ParsedURL(event.args.data.url);
    return parsedURL.isValid ? `${parsedURL.displayName} (${parsedURL.host})` : event.args.data.url || null;
  }

  entryFont(_index: number): string|null {
    return this.#networkTrackAppender?.font() || null;
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
      event: TraceEngine.Types.TraceEvents.SyntheticNetworkRequest, unclippedBarX: number,
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
    
    if (event.name === 'WebSocketSyntheticEvent') {
      const beginTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
      const timeToPixel = (time: number): number => Math.floor(unclippedBarX + (time - beginTime) * timeToPixelRatio);
      const endTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
        (event.ts + event.dur) as TraceEngine.Types.Timing.MicroSeconds);
      const start = timeToPixel(beginTime) + 0.5;
      const end = timeToPixel(endTime) - 0.5;
      // context.strokeStyle = '#ccc';

      const lineY = Math.floor(barY + barHeight / 2) + 0.5;
      context.moveTo(start, lineY );
      context.setLineDash([3, 3])
      context.lineTo(end, lineY );
      context.stroke();
      context.restore();
      return true;
  }
    if (TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(event) === false){
      // const webSocketEvent = event as TraceEngine.Types.TraceEvents.SyntheticWebSocketEvent;
      // const subEvents = webSocketEvent.args.data.subEvents;
      // const beginTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
      // const timeToPixel = (time: number): number => Math.floor(unclippedBarX + (time - beginTime) * timeToPixelRatio);
      // const endTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
      //   (event.ts + event.dur) as TraceEngine.Types.Timing.MicroSeconds);
      // context.fillStyle = ThemeSupport.ThemeSupport.instance().getComputedValue('--sys-color-neutral-container');
      // context.fillRect(barX, barY - 0.5, timeToPixel(endTime) , barHeight);

      // if (!subEvents) {
      //   return false;
      // }

      // for (const subEvent of subEvents) {


      //   const startTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(subEvent.ts);
      //   const start = timeToPixel(startTime) + 0.5;
      //   context.beginPath();
      //   context.lineWidth = 1;
      //   context.moveTo(start, barY);
      //   context.lineTo(start, barY + barHeight);
      //   // context.strokeStyle = '#ccc';
      //   // const lineY = Math.floor(barY + barHeight / 2) + 0.5;
      //   // // const leftTick = start + 0.5;
      //   // // const rightTick = end - 0.5;
      //   // drawTick(start, sendStart, lineY);
      //   // drawTick(rightTick, finish, lineY);
      //   context.stroke();
      // }
      return false;
    }



    const {sendStart, headersEnd, finish, start, end} =
        this.getDecorationPixels(event, unclippedBarX, timeToPixelRatio);

    // Draw waiting time.
    context.fillStyle = 'hsla(0, 100%, 100%, 0.8)';
    context.fillRect(sendStart + 0.5, barY + 0.5, headersEnd - sendStart - 0.5, barHeight - 2);
    // Clear portions of initial rect to prepare for the ticks.
    context.fillStyle = ThemeSupport.ThemeSupport.instance().getComputedValue('--sys-color-cdt-base-container');
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
    const root = UI.UIUtils.createShadowRootWithCoreStyles(element, {
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
    if (event.name.startsWith('WebSocket')) {
      const title = this.#networkTrackAppender?.titleForWebSocketEvent(event) || '';
      contents.createChild('span').textContent = Platform.StringUtilities.trimMiddle(title, maxURLChars);
    } else {
      contents.createChild('span').textContent = Platform.StringUtilities.trimMiddle(event.args.data.url, maxURLChars);
    }

    return element;
  }

  // prepareHighlightedEntryInfo(entryIndex: number): Element|null {
  //   let time = '';
  //   let title;
  //   let warningElements: Element[] = [];
  //   let nameSpanTimelineInfoTime = 'timeline-info-time';

  //   const additionalContent: HTMLElement[] = [];

  //   const entryType = this.entryType(entryIndex);
  //   if (entryType === EntryType.TrackAppender) {
  //     if (!this.compatibilityTracksAppender) {
  //       return null;
  //     }
  //     const event = (this.entryData[entryIndex] as TraceEngine.Types.TraceEvents.TraceEventData);
  //     const timelineData = (this.timelineDataInternal as PerfUI.FlameChart.FlameChartTimelineData);
  //     const eventLevel = timelineData.entryLevels[entryIndex];
  //     const highlightedEntryInfo = this.highlightedEntryInfo(event, eventLevel);
  //     title = highlightedEntryInfo.title;
  //     time = highlightedEntryInfo.formattedTime;
  //     warningElements = highlightedEntryInfo.warningElements || warningElements;
  //   } else if (entryType === EntryType.Event) {
  //     const event = (this.entryData[entryIndex] as TraceEngine.Legacy.Event);
  //     const totalTime = event.duration;
  //     const selfTime = event.selfTime;
  //     const eps = 1e-6;
  //     if (typeof totalTime === 'number') {
  //       time = Math.abs(totalTime - selfTime) > eps && selfTime > eps ?
  //           i18nString(UIStrings.sSelfS, {
  //             PH1: i18n.TimeUtilities.millisToString(totalTime, true),
  //             PH2: i18n.TimeUtilities.millisToString(selfTime, true),
  //           }) :
  //           i18n.TimeUtilities.millisToString(totalTime, true);
  //     }
  //     title = this.entryTitle(entryIndex);

  //   } else if (entryType === EntryType.Frame) {
  //     const frame = (this.entryData[entryIndex] as TraceEngine.Handlers.ModelHandlers.Frames.TimelineFrame);
  //     time = i18n.TimeUtilities.preciseMillisToString(
  //         TraceEngine.Helpers.Timing.microSecondsToMilliseconds(frame.duration), 1);

  //     if (frame.idle) {
  //       title = i18nString(UIStrings.idleFrame);
  //     } else if (frame.dropped) {
  //       if (frame.isPartial) {
  //         title = i18nString(UIStrings.partiallyPresentedFrame);
  //       } else {
  //         title = i18nString(UIStrings.droppedFrame);
  //       }
  //       nameSpanTimelineInfoTime = 'timeline-info-warning';
  //     } else {
  //       title = i18nString(UIStrings.frame);
  //     }
  //   } else {
  //     return null;
  //   }

  //   const element = document.createElement('div');
  //   const root = UI.UIUtils.createShadowRootWithCoreStyles(element, {
  //     cssFile: [timelineFlamechartPopoverStyles],
  //     delegatesFocus: undefined,
  //   });
  //   const contents = root.createChild('div', 'timeline-flamechart-popover');
  //   contents.createChild('span', nameSpanTimelineInfoTime).textContent = time;
  //   contents.createChild('span', 'timeline-info-title').textContent = title;
  //   if (warningElements) {
  //     for (const warningElement of warningElements) {
  //       warningElement.classList.add('timeline-info-warning');
  //       contents.appendChild(warningElement);
  //     }
  //   }
  //   for (const elem of additionalContent) {
  //     contents.appendChild(elem);
  //   }
  //   return element;
  // }

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
  #setTimingBoundsData(newTraceEngineData: TraceEngine.Handlers.Types.TraceParseData): void {
    const {traceBounds} = newTraceEngineData.Meta;
    const minTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(traceBounds.min);
    const maxTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(traceBounds.max);
    this.#minimumBoundaryInternal = minTime;
    this.#timeSpan = minTime === maxTime ? 1000 : maxTime - this.#minimumBoundaryInternal;
  }

  /**
   * When users zoom in the flamechart, we only want to show them the network
   * requests between startTime and endTime. This function will call the
   * trackAppender to update the timeline data, and then force to create a new
   * PerfUI.FlameChart.FlameChartTimelineData instance to force the flamechart
   * to re-render.
   */
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  #updateTimelineData(startTime: number, endTime: number): void {
    if (!this.#networkTrackAppender || !this.#timelineDataInternal) {
      return;
    }
    // TODO: This is hiding rows, need to fix when there is websocket messages
    this.#maxLevel = this.#networkTrackAppender.filterTimelineDataBetweenTimes(
        this.#events, TraceEngine.Types.Timing.MilliSeconds(startTime), TraceEngine.Types.Timing.MilliSeconds(endTime));

    // TODO(crbug.com/1459225): Remove this recreating code.
    // Force to create a new PerfUI.FlameChart.FlameChartTimelineData instance
    // to force the flamechart to re-render. This also causes crbug.com/1459225.
    this.#timelineDataInternal = PerfUI.FlameChart.FlameChartTimelineData.create({
      entryLevels: this.#timelineDataInternal?.entryLevels,
      entryTotalTimes: this.#timelineDataInternal?.entryTotalTimes,
      entryStartTimes: this.#timelineDataInternal?.entryStartTimes,
      groups: this.#timelineDataInternal?.groups,
    });
  }

  preferredHeight(): number {
    if (!this.#networkTrackAppender || this.#maxLevel === 0) {
      return 0;
    }
    const group = this.#networkTrackAppender.group();
    if (!group) {
      return 0;
    }
    return group.style.height * (this.isExpanded() ? Platform.NumberUtilities.clamp(this.#maxLevel + 1, 4, 8.5) : 1);
  }

  isExpanded(): boolean {
    return Boolean(this.#networkTrackAppender?.group()?.expanded);
  }

  formatValue(value: number, precision?: number): string {
    return i18n.TimeUtilities.preciseMillisToString(value, precision);
  }

  canJumpToEntry(_entryIndex: number): boolean {
    return false;
  }

  /**
   * Returns a map of navigations that happened in the main frame, ignoring any
   * that happened in other frames.
   * The map's key is the frame ID.
   **/
  mainFrameNavigationStartEvents(): readonly TraceEngine.Types.TraceEvents.TraceEventNavigationStart[] {
    if (!this.#traceEngineData) {
      return [];
    }
    return this.#traceEngineData.Meta.mainFrameNavigations;
  }
}
