// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';
import * as PerfUI from '../perf_ui/perf_ui.js';
import * as UI from '../ui/ui.js';

import {PlayerEvent} from './MediaModel.js';  // eslint-disable-line no-unused-vars

const defaultFont = '11px ' + Host.Platform.fontFamily();
const defaultColor = '#444';

const DefaultStyle = {
  height: 20,
  padding: 2,
  collapsible: false,
  font: defaultFont,
  color: defaultColor,
  backgroundColor: 'rgba(100, 0, 0, 0.1)',
  nestingLevel: 0,
  itemsHeight: 20,
  shareHeaderLine: false,
  useFirstLineForOverview: false,
  useDecoratorsForOverview: false
};

export const HotColorScheme = [
  '#ffba08', '#faa307', '#f48c06', '#e85d04', '#dc2f02', '#d00000', '#9d0208'
];

export const ColdColorScheme = [
  '#7400b8', '#6930c3', '#5e60ce', '#5390d9', '#4ea8de', '#48bfe3', '#56cfe1', '#64dfdf'
]

/**
 * @typedef {!{
 *     groupID: int,
 *     groupName: string,
 *     timelineSymbols: list<string>
 * }}
 */
export let EasyFlameGroup;

/**
 * @typedef {!{
 *     group: EasyFlameGroup,
 *     startTime: int,
 *     duration: int,
 *     eventID: int,
 *     eventName: string,
 *     flameIndex: int
 * }}
 */
export let EasyFlameEvent;


/**
 * @unrestricted
 */
export class TickingFlameChart extends UI.Widget.VBox {
  constructor() {
    super();

    // set to update once per second _while the tab is active_
    this._intervalTimer = null;
    this._lastTimestamp = 0;
    this._canTick = true;
    this._ticking = false;
    this._isShown = false;

    // The max bounds for scroll-out.
    this._maxBounds = [0, 100];
    
    // The current viewport bounds.
    this._currentBounds = this._maxBounds;

    // Create the data provider with the initial max bounds,
    // as well as a function to attempt bounds updating everywhere.
    this._dataProvider = new TickingFlameChartDataProvider(
      this._maxBounds, this._updateMaxTime.bind(this));

    // Delegate doesn't do much for now.
    this._delegate = new TickingFlameChartDelegate();

    // Chart settings.
    this._chartGroupExpansionSetting = Common.Settings.Settings.instance().createSetting(
      'mediaFlameChartGroupExpansion', {});

    // Create the chart.
    this._chart = new PerfUI.FlameChart.FlameChart(
      this._dataProvider, this._delegate, this._chartGroupExpansionSetting);

    // TODO: needs to have support in the delegate for supporting this.
    this._chart.disableRangeSelection();

    // Scrolling should change the current bounds, and repaint the chart.
    this._chart.addEventListener('scroll', this._onScroll.bind(this));

    // Add the chart.
    this._chart.show(this.contentElement);
  }

  addMarker(time, name) {
    const marker = this._dataProvider.addMarker(time, 0);
    marker.title = name;
    this._updateMaxTime(time);
  }


  addGroup(name, depth) {
    this._dataProvider.addGroup(name, depth);
  }

  startEvent(time, name) {
    const result = this._dataProvider.startEvent(time, 0);
    result.title = name;
    this._updateMaxTime(time);
    return result;
  }

  _updateMaxTime(time) {
    if (time > this._maxBounds[1]) {
      this._maxBounds[1] = time;
      this._updateRender();
    }
  }

  _onScroll(e) {
    console.log(e);
  }

  /**
   * @override
   */
  willHide() {
    this._isShown = false;
    if (this._ticking) {
      this._stop();
    }
  }

  /**
   * @override
   */
  wasShown() {
    this._isShown = true;
    if (this._canTick && !this._ticking) {
      this._start();
    }
  }

  set canTick(allowed) {
    this._canTick = allowed;
    if (this._ticking && !allowed) {
      this._stop();
    }
    if (!this._ticking && this._isShown && allowed) {
      this._start();
    }
  }

  _start() {
    if (this._lastTimestamp === 0) {
      this._lastTimestamp = new Date().getTime();
    }
    if (this._intervalTimer !== null || this._stoppedPermanently)
      return;
    this._intervalTimer = setInterval(this._updateRender.bind(this), 15);
    this._ticking = true;
  }

  _stop(permanently = false) {
    clearInterval(this._intervalTimer);
    this._intervalTimer = null;
    if (permanently)
      this._stoppedPermanently = true;
    this._ticking = false;
  }

  _updateRender() {
    if (this._ticking) {
      const currentTimestamp = new Date().getTime();
      const duration = currentTimestamp - this._lastTimestamp;
      this._lastTimestamp = currentTimestamp;
      this._maxBounds[1] += duration;
    }
    this._dataProvider.updateMaxTime(this._maxBounds[1]);
    this._chart.setWindowTimes(this._maxBounds[0], this._maxBounds[1], true);
    this._chart.scheduleUpdate();
  }
};


/**
 * Wrapper class for each event displayed on the timeline.
 */
class Event {
  constructor(timelineData, setLive, setComplete, updateMaxTime) {
    this._timelineData = timelineData;
    this._setLive = setLive;
    this._setComplete = setComplete;
    this._updateMaxTime = updateMaxTime;

    this._live = false;

    this._selfIndex = this._timelineData.entryLevels.length;
    this._timelineData.entryLevels.push(0);
    this._timelineData.entryStartTimes.push(0);
    this._timelineData.entryTotalTimes.push(0);

    this._title = '';
    this._color = HotColorScheme[0];

    this._hoverdata = {}
  }

  get id() {
    return this._selfIndex;
  }

  set startTime(time) {
    this._timelineData.entryStartTimes[this._selfIndex] = time;
    this._updateMaxTime(time);
  }

  set endTime(time) {
    var duration = 0;
    // Setting end time to -1 signals an event becomes live
    if (time === -1) {
      duration = this._setLive(this._selfIndex);
      this._live = true;
      this._timelineData.entryTotalTimes[this._selfIndex] = duration;
    } else {
      const startTime = this._timelineData.entryStartTimes[this._selfIndex];
      duration = time - startTime;
      this._setComplete(this._selfIndex);
      this._timelineData.entryTotalTimes[this._selfIndex] = duration;
      this._updateMaxTime(time);
    }
  }

  decorate(htmlElement) {
    for (var key in this._hoverdata) {
      const child = htmlElement.createChild('span');
      child.textContent = `${key}: ${this._hoverdata[key]}`;
    }
  }

  set level(level) {
    this._timelineData.entryLevels[this._selfIndex] = level;
  }

  set title(text) {
    this._title = text;
  }

  get title() {
    return this._title;
  }

  set color(color) {
    this._color = color;
  }

  get color() {
    return this._color;
  }

  set displayData(data) {
    this._hoverdata = {
      ...this._hoverdata,
      ...data
    };
  }
};

/**
 * @implements {PerfUI.FlameChart.FlameChartDelegate}
 */
class TickingFlameChartDelegate {
  constructor() {}

  /**
   * @override
   * @param {number} windowStartTime
   * @param {number} windowEndTime
   * @param {boolean} animate
   */
  windowChanged(windowStartTime, windowEndTime, animate) {
    //console.log('windowChanged');
    // this._model.setWindow({left: windowStartTime, right: windowEndTime}, animate);
  }

  /**
   * @override
   * @param {number} startTime
   * @param {number} endTime
   */
  updateRangeSelection(startTime, endTime) {
    //console.log('updateRangeSelection');
    // this._delegate.select(TimelineSelection.fromRange(startTime, endTime));
  }

  /**
   * @override
   * @param {!PerfUI.FlameChart.FlameChart} flameChart
   * @param {?PerfUI.FlameChart.Group} group
   */
  updateSelectedGroup(flameChart, group) {
    //console.log(group);
  }
}



/**
 * @implements {PerfUI.FlameChart.FlameChartDataProvider}
 */
class TickingFlameChartDataProvider {
  constructor(initialViewportRange, updateMaxTime) {
    this._currentMaxTime = initialViewportRange[1];
    this._viewportRange = initialViewportRange;

    // do _not_ call this method from within this class - only for passing to events.
    this._updateMaxTimeHandle = updateMaxTime;

    this._timelineData = new PerfUI.FlameChart.TimelineData([], [], [], []);

    this._liveEvents = new Set();
    this._eventMap = new Map();

    this._maxLevel = 0;

    this._opOp = (E => {});
  }

  addGroup(name, depth) {
    this._timelineData.groups.push({
      name: name,
      startLevel: this._maxLevel,
      expanded: true,
      selectable: false,
      style: DefaultStyle
    });
    this._maxLevel += depth;
  }

  addMarker(startTime, level) {
    if (level > this._maxLevel)
      throw `level ${level} is above the maximum allowed of ${this._maxLevel}`;

    const event = new Event(
      this._timelineData,
      this._setLive.bind(this),
      this._setComplete.bind(this),
      this._updateMaxTimeHandle);
    this._eventMap[event.id] = event;
    event.startTime = startTime;
    event.endTime = NaN;
    event.level = level;
    return event;
  }

  /**
   * @param {number} startTime 
   * @param {number} level 
   * @return {!Event}
   */
  startEvent(startTime, level) {
    if (level > this._maxLevel)
      throw `level ${level} is above the maximum allowed of ${this._maxLevel}`;

    const event = new Event(
      this._timelineData,
      this._setLive.bind(this),
      this._setComplete.bind(this),
      this._updateMaxTimeHandle);

    this._eventMap[event.id] = event;

    event.startTime = startTime;
    event.endTime = -1;
    event.level = level;

    return event;
  }

  /**
   * @param {number} index
   * @return {number}
   */
  _setLive(index) {
    this._liveEvents.add(index);
    return this._currentMaxTime;
  }

  /**
   * @param {number} index
   */
  _setComplete(index) {
    this._liveEvents.delete(index);
  }

  /**
   * @param {number} maxTime
   */
  updateMaxTime(maxTime) {
    if (this._viewportRange[0] === 0 && this._viewportRange[1] === this._currentMaxTime) {
      this._viewportRange[1] = maxTime;
    }
    this._currentMaxTime = maxTime;

    for (let eventID of this._liveEvents.entries()) {
      // force recalculation of all live events.
      this._eventMap[eventID[0]].endTime = -1;
    }
  }


  /**
   * @override
   * @return {number}
   */
  maxStackDepth() {
    return this._maxLevel + 1;
  }

  /**
   * @override
   * @return {!PerfUI.FlameChart.TimelineData}
   */
  timelineData() {
    return this._timelineData;
  }

  /**
   * @override
   * @return {number} time in milliseconds
   */
  minimumBoundary() {
    return this._viewportRange[0];
  }

  /**
   * @override
   * @return {number}
   */
  totalTime() {
    return this._viewportRange[1];
  }

  /**
   * @override
   * @param {number} index
   * @return {string}
   */
  entryColor(index) {  
    return this._eventMap[index].color;
  }

  /**
   * @override
   * @param {number} index
   * @return {string}
   */
  textColor(index) {
    return defaultColor;
  }

  /**
   * @override
   * @param {number} index
   * @return {?string}
   */
  entryTitle(index) {
    return this._eventMap[index].title;
  }

  /**
   * @override
   * @param {number} index
   * @return {?string}
   */
  entryFont(index) {
    return defaultFont;
  }

  /**
   * @override
   * @param {number} index
   * @param {!CanvasRenderingContext2D} context
   * @param {?string} text
   * @param {number} barX
   * @param {number} barY
   * @param {number} barWidth
   * @param {number} barHeight
   * @param {number} unclippedBarX
   * @param {number} timeToPixelRatio
   * @return {boolean}
   */
  decorateEntry(index, context, text, barX, barY, barWidth, barHeight, unclippedBarX, timeToPixelRatio) {
    return false;
  }

  /**
   * @override
   * @param {number} index
   * @return {boolean}
   */
  forceDecoration(index) {
    return false;
  }

  /**
   * @override
   * @param {number} index
   * @return {?Element}
   */
  prepareHighlightedEntryInfo(index) {
    const element = createElement('div');
    this._eventMap[index].decorate(element);
    return element;
  }

  /**
   * @override
   * @param {number} value
   * @param {number=} precision
   * @return {string}
   */
  formatValue(value, precision) {
    if (value < 10000) {
      return Number.preciseMillisToString(value, precision);
    } else {
      return `${value / 1000} s`;
    }

  }

  /**
   * @override
   * @param {number} entryIndex
   * @return {boolean}
   */
  canJumpToEntry(entryIndex) {
    return false;
  }
};

































/**
 * Use the FlameChart layout but with many things configured into their
 * simplest states. Additionally, all event timestamps must be normalized to 0.
 * Also defaults to a traditional red-hue flame chart color scheme.
 *
 * @implements {PerfUI.FlameChart.FlameChartDelegate}
 * @implements {PerfUI.FlameChart.FlameChartDataProvider}
 * @unrestricted
 */
export class EasyFlame extends UI.Widget.VBox {
  constructor(configuration) {
    super();
    this._configuration = configuration;
    this._groups = {};
    this._events = {};
    this._eventsSequential = [];
    this._timelineData = new PerfUI.FlameChart.TimelineData([], [], [], []);
    this._pendingEventQueue = new Set();
    
    // Always show at least 100ms.
    this._lastEventTime = 100;
    this._flameHeight = 0;




    this._setupChart();
  }

  _setupChart() {
    this._chartGroupExpansionSetting = Common.Settings.Settings.instance().createSetting(
      this._configuration.configurationSetting, {});
    this._chart = new PerfUI.FlameChart.FlameChart(this, this, this._chartGroupExpansionSetting)
    this._chart.disableRangeSelection();
    this._chart.show(this.contentElement);
  }

  bindGroup(group) {
    group.groupID = this._timelineData.groups.length;
    this._groups[group.groupID] = group;

    this._timelineData.groups.push({
      name: group.groupName,
      startLevel: this._flameHeight,
      expanded: true,
      selectable: false,
      style: DefaultStyle
    });

    this._flameHeight += group.timelineSymbols.length;
    
    return this._addGroupMethods(group);
  }

  _addGroupMethods(group) {
    group.startEvent = this._startEvent.bind(this, group);
    group.addEvent = this._addEvent.bind(this, group);
    return group;
  }

  _startEvent(group, symbol, startTime) {
    const localHeight = group.timelineSymbols.indexOf(symbol);
    if (localHeight === -1)
      throw `Can't add event ${symbol} in ${group.groupName}`;
    const eventHeight = this._timelineData.groups[group.groupID].startLevel + localHeight;
  
    const eventIndex = this._timelineData.entryLevels.length;
    this._eventsSequential.push({
      eventIndex: eventIndex,
      localHeight: localHeight,
      eventName: symbol
    });

    let mock_duration = this._lastEventTime * 0.12;
    if (mock_duration + startTime < this._lastEventTime) {
      mock_duration = this._lastEventTime - startTime;
    }

    this._timelineData.entryStartTimes.push(startTime);
    this._timelineData.entryTotalTimes.push(mock_duration);
    this._timelineData.entryLevels.push(eventHeight);

    this._updateMaxTime(startTime + mock_duration);
    this._pendingEventQueue.add(eventIndex);

    return { 'stop': this._stopEvent.bind(this, group, eventIndex) };
  }

  _addEvent(group, symbol, startTime, duration, options={}) {
    const localHeight = group.timelineSymbols.indexOf(symbol);
    if (localHeight === -1)
      throw `Can't add event ${symbol} in ${group.groupName}`;
    const eventHeight = this._timelineData.groups[group.groupID].startLevel + localHeight;

    this._eventsSequential.push({
      eventIndex: this._timelineData.entryLevels.length,
      localHeight: localHeight,
      eventName: symbol
    });
    this._timelineData.entryStartTimes.push(startTime);
    this._timelineData.entryTotalTimes.push(duration);
    this._timelineData.entryLevels.push(eventHeight);

    this._updateMaxTime(startTime + duration);
  }

  _stopEvent(group, index, endTime, options={}) {
    // TODO check to prevent double stops.
    this._pendingEventQueue.delete(index);
    const duration = endTime - this._timelineData.entryStartTimes[index];
    this._timelineData.entryTotalTimes[index] = duration;
    this._updateMaxTime(endTime);
  }

  _updateMaxTime(newEndTime) {
    if (newEndTime > this._lastEventTime) {
      this._lastEventTime = newEndTime;

      for (let updateIndex of this._pendingEventQueue.entries()) {
        const duration = newEndTime - this._timelineData.entryStartTimes[updateIndex];
        this._timelineData.entryTotalTimes[updateIndex] = duration;
      }

      this._chart.setWindowTimes(0, this._lastEventTime, true);
    } else {
      this._chart.scheduleUpdate();
    }
  }

  // PerfUI.FlameChart.FlameChartDelegate methods below

  /**
   * @override
   * @param {number} windowStartTime
   * @param {number} windowEndTime
   * @param {boolean} animate
   */
  windowChanged(windowStartTime, windowEndTime, animate) {
    //console.log('windowChanged');
    // this._model.setWindow({left: windowStartTime, right: windowEndTime}, animate);
  }

  /**
   * @override
   * @param {number} startTime
   * @param {number} endTime
   */
  updateRangeSelection(startTime, endTime) {
    //console.log('updateRangeSelection');
    // this._delegate.select(TimelineSelection.fromRange(startTime, endTime));
  }

  /**
   * @override
   * @param {!PerfUI.FlameChart.FlameChart} flameChart
   * @param {?PerfUI.FlameChart.Group} group
   */
  updateSelectedGroup(flameChart, group) {
    //console.log(group);
  }


  // PerfUI.FlameChart.FlameChartDataProvider methods below

  /**
   * @override
   * @return {number}
   */
  maxStackDepth() {
    return this._flameHeight;
  }

  /**
   * @override
   * @return {!PerfUI.FlameChart.TimelineData}
   */
  timelineData() {
    return this._timelineData;
  }

  /**
   * @override
   * @return {number} time in milliseconds
   */
  minimumBoundary() {
    return 0;  // we normalized all event timestamps to 0.
  }

  /**
   * @override
   * @return {number}
   */
  totalTime() {
    return this._lastEventTime;
  }

  /**
   * @override
   * @param {number} index
   * @return {string}
   */
  entryColor(index) {
    const height = this._eventsSequential[index].localHeight;
    if (height > HotColorScheme.length)
      return HotColorScheme[0];
    return HotColorScheme[height];
  }

  /**
   * @override
   * @param {number} index
   * @return {string}
   */
  textColor(index) {
    return defaultColor;
  }

  /**
   * @override
   * @param {number} index
   * @return {?string}
   */
  entryTitle(index) {
    return this._eventsSequential[index].eventName;
  }

  /**
   * @override
   * @param {number} index
   * @return {?string}
   */
  entryFont(index) {
    return defaultFont;
  }

  /**
   * @override
   * @param {number} index
   * @param {!CanvasRenderingContext2D} context
   * @param {?string} text
   * @param {number} barX
   * @param {number} barY
   * @param {number} barWidth
   * @param {number} barHeight
   * @param {number} unclippedBarX
   * @param {number} timeToPixelRatio
   * @return {boolean}
   */
  decorateEntry(index, context, text, barX, barY, barWidth, barHeight, unclippedBarX, timeToPixelRatio) {
    return false;
  }

  /**
   * @override
   * @param {number} index
   * @return {boolean}
   */
  forceDecoration(index) {
    return true;
  }

  /**
   * @override
   * @param {number} index
   * @return {?Element}
   */
  prepareHighlightedEntryInfo(index) {
    const element = createElement('div');
    element.textContent = this._eventsSequential[index].eventName;
    return element;
  }

  /**
   * @override
   * @param {number} value
   * @param {number=} precision
   * @return {string}
   */
  formatValue(value, precision) {
    return Number.preciseMillisToString(value, precision);
  }

  /**
   * @override
   * @param {number} entryIndex
   * @return {boolean}
   */
  canJumpToEntry(entryIndex) {
    return false;
  }
}
