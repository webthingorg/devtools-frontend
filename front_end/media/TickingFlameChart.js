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

export const HotColorScheme = ['#ffba08', '#faa307', '#f48c06', '#e85d04', '#dc2f02', '#d00000', '#9d0208'];

export const ColdColorScheme = ['#7400b8', '#6930c3', '#5e60ce', '#5390d9', '#4ea8de', '#48bfe3', '#56cfe1', '#64dfdf'];

class Bounds {
  constructor(initialLow, initialHigh, maxRange, minRange) {
    this._min = initialLow;
    this._max = initialHigh;
    this._low = this._min;
    this._high = this._max;
    this._maxRange = maxRange;
    this._minRange = minRange;
  }

  get low() {
    return this._low;
  }

  get high() {
    return this._high;
  }

  get min() {
    return this._min;
  }

  get max() {
    return this._max;
  }

  get range() {
    return this._high - this._low;
  }

  _reassertBounds() {
    let needsAdjustment = true;
    while (needsAdjustment) {
      needsAdjustment = false;
      if (this.range < this._minRange) {
        needsAdjustment = true;
        const delta = (this._minRange - this.range) / 2;
        this._high += delta;
        this._low -= delta;
      }

      if (this._low < this._min) {
        needsAdjustment = true;
        this._low = this._min;
      }

      if (this._high > this._max) {
        needsAdjustment = true;
        this._high = this._max;
      }
    }
  }

  zoomOut(amount, position) {
    const range = this._high - this._low;
    const growSize = range * 0.1;
    const lowEnd = growSize * position;
    const highEnd = growSize - lowEnd;
    this._low -= lowEnd;
    this._high += highEnd;
    this._reassertBounds();
  }

  zoomIn(amount, position) {
    const range = this._high - this._low;
    if (this.range <= this._minRange) {
      return;
    }

    const shrinkSize = range - range / 1.1;
    const lowEnd = shrinkSize * position;
    const highEnd = shrinkSize - lowEnd;
    this._low += lowEnd;
    this._high -= highEnd;
    this._reassertBounds();
  }

  addMax(amount) {
    const range = this._high - this._low;
    const isAtHighEnd = this._high === this._max;
    const isZoomedOut = this._low === this._min || range >= this._maxRange;

    this._max += amount;
    if (isAtHighEnd && isZoomedOut) {
      this._high = this._max;
    }
    this._reassertBounds();
  }

  pushMaxAtLeastTo(time) {
    if (this._max < time) {
      this.addMax(time - this._max);
      return true;
    }
    return false;
  }
}


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
    this._bounds = new Bounds(0, 1000, 30000, 1000);

    // REMOTE THESE
    this._maxBounds = [0, 100];

    // Create the data provider with the initial max bounds,
    // as well as a function to attempt bounds updating everywhere.
    this._dataProvider = new TickingFlameChartDataProvider(this._bounds, this._updateMaxTime.bind(this));

    // Delegate doesn't do much for now.
    this._delegate = new TickingFlameChartDelegate();

    // Chart settings.
    this._chartGroupExpansionSetting =
        Common.Settings.Settings.instance().createSetting('mediaFlameChartGroupExpansion', {});

    // Create the chart.
    this._chart =
        new PerfUI.FlameChart.FlameChart(this._dataProvider, this._delegate, this._chartGroupExpansionSetting);

    // TODO: needs to have support in the delegate for supporting this.
    this._chart.disableRangeSelection();

    // Scrolling should change the current bounds, and repaint the chart.
    this._chart._canvas.addEventListener('wheel', this._onScroll.bind(this));

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
    if (this._bounds.pushMaxAtLeastTo(time)) {
      this._updateRender();
    }
  }

  _onScroll(e) {
    // TODO: is this a good divisor? does it account for high presicision scroll wheels?
    // low precisision scroll wheels?
    const scrollTickCount = Math.round(e.deltaY / 50);
    const scrollPositionRatio = e.offsetX / e.srcElement.clientWidth;
    if (scrollTickCount > 0) {
      this._bounds.zoomOut(scrollTickCount, scrollPositionRatio);
    } else {
      this._bounds.zoomIn(-scrollTickCount, scrollPositionRatio);
    }
    this._updateRender();
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
    if (this._intervalTimer !== null || this._stoppedPermanently) {
      return;
    }
    this._intervalTimer = setInterval(this._updateRender.bind(this), 15);
    this._ticking = true;
  }

  _stop(permanently = false) {
    clearInterval(this._intervalTimer);
    this._intervalTimer = null;
    if (permanently) {
      this._stoppedPermanently = true;
    }
    this._ticking = false;
  }

  _updateRender() {
    if (this._ticking) {
      const currentTimestamp = new Date().getTime();
      const duration = currentTimestamp - this._lastTimestamp;
      this._lastTimestamp = currentTimestamp;
      this._bounds.addMax(duration);
    }
    this._dataProvider.updateMaxTime(this._bounds);
    this._chart.setWindowTimes(this._bounds.low, this._bounds.high, true);
    this._chart.scheduleUpdate();
  }
}


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

    this._hoverdata = {};
  }

  get id() {
    return this._selfIndex;
  }

  set startTime(time) {
    this._timelineData.entryStartTimes[this._selfIndex] = time;
    this._updateMaxTime(time);
  }

  set endTime(time) {
    let duration = 0;
    // Setting end time to -1 signals an event becomes live
    if (time === -1) {
      duration = this._setLive(this._selfIndex);
      this._live = true;
      this._timelineData.entryTotalTimes[this._selfIndex] = duration;
    } else {
      this._live = true;
      const startTime = this._timelineData.entryStartTimes[this._selfIndex];
      duration = time - startTime;
      this._setComplete(this._selfIndex);
      this._timelineData.entryTotalTimes[this._selfIndex] = duration;
      this._updateMaxTime(time);
    }
  }

  decorate(htmlElement) {
    for (const key in this._hoverdata) {
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
    this._hoverdata = {...this._hoverdata, ...data};
  }
}

/**
 * @implements {PerfUI.FlameChart.FlameChartDelegate}
 */
class TickingFlameChartDelegate {
  constructor() {
  }

  /**
   * @override
   * @param {number} windowStartTime
   * @param {number} windowEndTime
   * @param {boolean} animate
   */
  windowChanged(windowStartTime, windowEndTime, animate) {
  }

  /**
   * @override
   * @param {number} startTime
   * @param {number} endTime
   */
  updateRangeSelection(startTime, endTime) {
  }

  /**
   * @override
   * @param {!PerfUI.FlameChart.FlameChart} flameChart
   * @param {?PerfUI.FlameChart.Group} group
   */
  updateSelectedGroup(flameChart, group) {
  }
}


/**
 * @implements {PerfUI.FlameChart.FlameChartDataProvider}
 */
class TickingFlameChartDataProvider {
  constructor(initialBounds, updateMaxTime) {
    this._bounds = initialBounds;

    // do _not_ call this method from within this class - only for passing to events.
    this._updateMaxTimeHandle = updateMaxTime;

    this._timelineData = new PerfUI.FlameChart.TimelineData([], [], [], []);
    document.TIMELINE_DATA = this._timelineData;

    this._liveEvents = new Set();
    this._eventMap = new Map();
    document.EVENT_MAP = this._eventMap;

    this._maxLevel = 0;

    this._opOp = (E => {});
  }

  addGroup(name, depth, options) {
    this._timelineData.groups.push(
        {name: name, startLevel: this._maxLevel, expanded: true, selectable: false, style: DefaultStyle});
    this._maxLevel += depth;
  }

  addMarker(startTime, level) {
    if (level > this._maxLevel) {
      throw `level ${level} is above the maximum allowed of ${this._maxLevel}`;
    }

    const event = new Event(
        this._timelineData, this._setLive.bind(this), this._setComplete.bind(this), this._updateMaxTimeHandle);
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
    if (level > this._maxLevel) {
      throw `level ${level} is above the maximum allowed of ${this._maxLevel}`;
    }

    const event = new Event(
        this._timelineData, this._setLive.bind(this), this._setComplete.bind(this), this._updateMaxTimeHandle);

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
    return this._bounds.max;
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
  updateMaxTime(bounds) {
    this._bounds = bounds;
    for (const eventID of this._liveEvents.entries()) {
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
    return this._bounds.low;
  }

  /**
   * @override
   * @return {number}
   */
  totalTime() {
    return this._bounds.high;
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
    // value is always [0, X] so we need to add lower bound
    value += Math.round(this._bounds.low);

    const OneDecimalLimit = 9.47974282786;
    const TwoDecimalLimit = 7.19368581839;
    const range = Math.log(this._bounds.range);
    if (range < TwoDecimalLimit) {
      return `${Math.round(value / 10) / 100} s`;
    }
    if (range < OneDecimalLimit) {
      return `${Math.round(value / 100) / 10} s`;
    }
    return `${Math.round(value / 1000)} s`;
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
