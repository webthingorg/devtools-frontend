// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {WebVitalsLane} from './WebVitalsLane.js';

declare global {
  interface HTMLElementTagNameMap {
    'devtools-timeline-webvitals': WebVitalsTimeline;
  }
}

export interface WebVitalsFCPEvent {
  timestamp: number;
}

export interface WebVitalsLCPEvent {
  timestamp: number;
}

export interface WebVitalsLayoutShiftEvent {
  timestamp: number;
}

interface WebVitalsTimelineTask {
  start: number;
  duration: number;
}

interface WebVitalsTimelineData {
  startTime: number;
  duration: number;
  fcps: WebVitalsFCPEvent[];
  lcps: WebVitalsLCPEvent[];
  layoutShifts: WebVitalsLayoutShiftEvent[];
  longTasks: WebVitalsTimelineTask[];
  mainFrameNavigations: number[];
  maxDuration: number;
}

export interface Marker {
  type: MarkerType;
  timestamp: number;
  timestampLabel: string;
  timestampMetrics: TextMetrics
  widthIncludingLabel: number
  widthIncludingTimestamp: number
}

export const enum MarkerType {
  Good = 'Good',
  Medium = 'Medium',
  Bad = 'Bad'
}

export const LINE_HEIGHT = 24;
const NUMBER_OF_LANES = 5;
const FCP_GOOD_TIMING = 2000;
const FCP_MEDIUM_TIMING = 4000;
const LCP_GOOD_TIMING = 2500;
const LCP_MEDIUM_TIMING = 4000;
const LONG_TASK_DURATION = 50;

export const enum Colors {
  Good = '#0cce6b',
  Medium = '#ffa400',
  Bad = '#ff4e42',
}

type Constructor<T> = {
  new (...args: unknown[]): T
};

function assertInstanceOf<T>(instance: any, constructor: Constructor<T>): asserts instance is T {
  if (!(instance instanceof constructor)) {
    throw new TypeError(`Instance expected to be of type ${constructor.name} but got ${instance.constructor.name}`);
  }
}

export class TimelineWindowChangedEvent extends Event {
  startTime: number;
  duration: number;

  constructor(startTime: number, duration: number) {
    super('timeline-window-changed', {});
    this.startTime = startTime;
    this.duration = duration;
  }
}

export class WebVitalsTimeline extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private fcps: ReadonlyArray<Marker> = [];
  private selectedFCP: Marker|null = null;
  private hoverFCP: Marker|null = null;
  private lcps: ReadonlyArray<Marker> = [];
  private selectedLCP: Marker|null = null;
  private hoverLCP: Marker|null = null;
  private layoutShifts: ReadonlyArray<Marker> = [];
  private selectedLayoutShift: Marker|null = null;
  private hoverLayoutShift: Marker|null = null;
  private longTasks: ReadonlyArray<WebVitalsTimelineTask> = [];
  private mainFrameNavigations: ReadonlyArray<number> = [];
  private startTime = 0;
  private duration = 1000;
  private maxDuration = 1000;
  private isMoving = false;
  private width = 0;
  private height = 0;
  private canvas: HTMLCanvasElement;
  private pointerX: number|null = 0;
  private pointerLane: number|null = null;
  private hoverLane: number|null = null;

  private fcpLane: WebVitalsLane;
  private lcpLane: WebVitalsLane;
  private layoutShiftsLane: WebVitalsLane;

  private context: CanvasRenderingContext2D;
  private longTaskPattern: CanvasPattern;
  private animationFrame: number|null = null;

  constructor() {
    super();

    this.canvas = document.createElement('canvas');
    this.canvas.tabIndex = 0;
    this.canvas.style.width = '100%';
    this.canvas.style.height = LINE_HEIGHT * NUMBER_OF_LANES + 'px';
    this.shadow.appendChild(this.canvas);
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));

    const patternCanvas = document.createElement('canvas');
    const patternContext = patternCanvas.getContext('2d');

    assertInstanceOf(patternContext, CanvasRenderingContext2D);

    const size = 17;
    patternCanvas.width = size;
    patternCanvas.height = size;

    // Rotate the stripe by 45deg to the right.
    patternContext.translate(size * 0.5, size * 0.5);
    patternContext.rotate(Math.PI * 0.25);
    patternContext.translate(-size * 0.5, -size * 0.5);

    patternContext.fillStyle = '#000';
    for (let x = -size; x < size * 2; x += 3) {
      patternContext.fillRect(x, -size, 1, size * 3);
    }

    const context = this.canvas?.getContext('2d');

    assertInstanceOf(context, CanvasRenderingContext2D);

    this.context = context;

    const canvasPattern = this.context.createPattern(patternCanvas, 'repeat');
    assertInstanceOf(canvasPattern, CanvasPattern);
    this.longTaskPattern = canvasPattern;


    this.fcpLane = new WebVitalsLane(this, 'FCP', []);
    this.lcpLane = new WebVitalsLane(this, 'LCP', []);
    this.layoutShiftsLane = new WebVitalsLane(this, 'LS', []);
  }

  set data(data: WebVitalsTimelineData) {
    this.startTime = data.startTime || this.startTime;
    this.duration = data.duration || this.duration;
    this.maxDuration = data.maxDuration || this.maxDuration;
    this.fcps = data.fcps ? data.fcps.map(f => this.getFCPMarker(f)) : this.fcps;
    this.lcps = data.lcps ? data.lcps.map(f => this.getLCPMarker(f)) : this.lcps;
    this.layoutShifts =
        data.layoutShifts ? data.layoutShifts.map(f => this.getLayoutShiftMarker(f)) : this.layoutShifts;
    this.longTasks = data.longTasks || this.longTasks;
    this.mainFrameNavigations = data.mainFrameNavigations || this.mainFrameNavigations;

    if (data.fcps) {
      this.fcpLane.updateMarkers(data.fcps.map(f => this.getFCPMarker(f)));
    }

    if (data.lcps) {
      this.lcpLane.updateMarkers(data.lcps.map(f => this.getLCPMarker(f)));
    }

    if (data.layoutShifts) {
      this.layoutShiftsLane.updateMarkers(data.layoutShifts.map(f => this.getLayoutShiftMarker(f)));
    }

    this.scheduleRender();
  }

  getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  getLineHeight(): number {
    return LINE_HEIGHT;
  }

  private measureLabel(label: string) {
    this.context.save();
    this.context.font = '11px/13px 500 Helvetica Neue';
    const textMetrics = this.context.measureText(label);
    this.context.restore();
    return textMetrics;
  }

  private renderLongTasksMarker(task: WebVitalsTimelineTask) {
    const yOffset = 4 * LINE_HEIGHT;
    const r = 2;

    this.context.save();
    this.context.beginPath();
    this.context.fillStyle = '#669df6';
    // Draw a box with rounded corners.
    this.context.moveTo(this.tX(task.start) + r, yOffset + 3);
    this.context.lineTo(this.tX(task.start + task.duration) - r, yOffset + 3);
    this.context.quadraticCurveTo(
        this.tX(task.start + task.duration),
        yOffset + 3,
        this.tX(task.start + task.duration),
        yOffset + 3 + r,
    );
    this.context.lineTo(this.tX(task.start + task.duration), yOffset + 24 - r);
    this.context.quadraticCurveTo(
        this.tX(task.start + task.duration),
        yOffset + 24 - r,
        this.tX(task.start + task.duration) - r,
        yOffset + 24,
    );
    this.context.lineTo(this.tX(task.start) + r, yOffset + 24);
    this.context.quadraticCurveTo(
        this.tX(task.start) + r,
        yOffset + 24,
        this.tX(task.start),
        yOffset + 24 - r,
    );
    this.context.lineTo(this.tX(task.start), yOffset + 3 + r);
    this.context.quadraticCurveTo(
        this.tX(task.start),
        yOffset + 3 + r,
        this.tX(task.start) + r,
        yOffset + 3,
    );
    this.context.closePath();
    this.context.fill();

    // Fill the box with a striped pattern for everything over 50ms.
    this.context.beginPath();
    this.context.fillStyle = this.longTaskPattern;
    this.context.moveTo(this.tX(task.start + LONG_TASK_DURATION) + r, yOffset + 3);
    this.context.lineTo(this.tX(task.start + task.duration) - r, yOffset + 3);
    this.context.quadraticCurveTo(
        this.tX(task.start + task.duration),
        yOffset + 3,
        this.tX(task.start + task.duration),
        yOffset + 3 + r,
    );
    this.context.lineTo(this.tX(task.start + task.duration), yOffset + 24 - r);
    this.context.quadraticCurveTo(
        this.tX(task.start + task.duration),
        yOffset + 24 - r,
        this.tX(task.start + task.duration) - r,
        yOffset + 24,
    );
    this.context.lineTo(this.tX(task.start + 50), yOffset + 24);
    this.context.lineTo(this.tX(task.start + 50), yOffset + 3);
    this.context.closePath();
    this.context.fill();
    this.context.restore();
  }

  private handlePointerMove(e: MouseEvent) {
    const x = e.clientX, y = e.clientY;
    const lane = Math.floor(y / LINE_HEIGHT);

    this.hoverLane = lane;
    this.fcpLane.handlePointerMove(this.hoverLane === 1 ? x : null);
    this.lcpLane.handlePointerMove(this.hoverLane === 2 ? x : null);
    this.layoutShiftsLane.handlePointerMove(this.hoverLane === 3 ? x : null);

    this.scheduleRender();
  }

  private handleClick(e: MouseEvent) {
    const x = e.clientX, y = e.clientY;
    const lane = Math.floor(y / LINE_HEIGHT);

    this.fcpLane.handleClick(this.hoverLane === 1 ? x : null);
    this.lcpLane.handleClick(this.hoverLane === 2 ? x : null);
    this.layoutShiftsLane.handleClick(this.hoverLane === 3 ? x : null);

    this.scheduleRender();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      if (this.selectedFCP) {
        const index = this.fcps.indexOf(this.selectedFCP);
        if (index === this.fcps.length - 1) {
          this.selectedFCP = null;
          this.selectedLCP = this.lcps[0];
        } else {
          this.selectedFCP = this.fcps[index + 1];
        }
      } else if (this.selectedLCP) {
        const index = this.lcps.indexOf(this.selectedLCP);
        if (index === this.lcps.length - 1) {
          this.selectedLCP = null;
          this.selectedLayoutShift = this.layoutShifts[0];
        } else {
          this.selectedLCP = this.lcps[index + 1];
        }
      } else if (this.selectedLayoutShift) {
        const index = this.layoutShifts.indexOf(this.selectedLayoutShift);
        if (index === this.layoutShifts.length - 1) {
          this.selectedLayoutShift = null;
          this.selectedFCP = this.fcps[0];
        } else {
          this.selectedLayoutShift = this.layoutShifts[index + 1];
        }
      }
      this.scheduleRender();
    }
  }

  /**
   * Transform from time to pixel offset
   * @param x
   */
  tX(x: number): number {
    return (x - this.startTime) / this.duration * this.width;
  }

  /**
   * Transform from duration to pixels
   * @param x
   */
  tD(duration: number): number {
    return duration / this.duration * this.width;
  }

  private dispatchTimelineWindowChangedEvent() {
    this.dispatchEvent(new TimelineWindowChangedEvent(this.startTime, this.duration));
  }

  private updateSizes() {
    const scale = window.devicePixelRatio;

    this.width = this.canvas.getBoundingClientRect().width;
    this.height = this.canvas.getBoundingClientRect().height;
    this.canvas.width = Math.floor(this.width * scale);
    this.canvas.height = Math.floor(this.height * scale);
    this.context.scale(scale, scale);
  }

  connectedCallback() {
    this.updateSizes();
    this.render();
  }

  private measureTimestamp(timestamp: string) {
    this.context.save();
    this.context.font = '11px/13px 400 Helvetica Neue';
    const textMetrics = this.context.measureText(timestamp);
    this.context.restore();
    return textMetrics;
  }

  private renderLaneLabel(lane: number, label: string) {
    const upperCaseLabel = label.toLocaleUpperCase();
    this.context.save();

    this.context.font = '9px/11px 500 Helvetica Neue';
    const text = this.context.measureText(upperCaseLabel);
    const height = text.actualBoundingBoxAscent - text.actualBoundingBoxDescent;
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.context.fillRect(0, lane * LINE_HEIGHT + 1, text.width + 12, height + 6);
    this.context.fillStyle = '#80868b';
    this.context.fillText(upperCaseLabel, 6, lane * LINE_HEIGHT + height + 4);
    this.context.restore();
  }

  private getMarkerTypeForFCPEvent(event: WebVitalsFCPEvent) {
    const t = this.getTimeSinceLastMainFrameNavigation(event.timestamp);
    if (t <= FCP_GOOD_TIMING) {
      return MarkerType.Good;
    }
    if (t <= FCP_MEDIUM_TIMING) {
      return MarkerType.Medium;
    }
    return MarkerType.Bad;
  }

  private getMarkerTypeForLCPEvent(event: WebVitalsLCPEvent) {
    const t = this.getTimeSinceLastMainFrameNavigation(event.timestamp);
    if (t <= LCP_GOOD_TIMING) {
      return MarkerType.Good;
    }
    if (t <= LCP_MEDIUM_TIMING) {
      return MarkerType.Medium;
    }
    return MarkerType.Bad;
  }

  private getFCPMarker(fcpEvent: WebVitalsFCPEvent): Marker {
    const markerType = this.getMarkerTypeForFCPEvent(fcpEvent);
    const timestampLabel = `${fcpEvent.timestamp}ms`;
    const timestampMetrics = this.measureTimestamp(timestampLabel);
    const widthIncludingLabel = 10 + 5 + 20 + 5;
    const widthIncludingTimestamp = widthIncludingLabel + 5 + timestampMetrics.width;

    return {
      timestamp: fcpEvent.timestamp,
      timestampLabel,
      type: markerType,
      timestampMetrics,
      widthIncludingLabel,
      widthIncludingTimestamp,
    };
  }

  private getLCPMarker(lcpEvent: WebVitalsLCPEvent): Marker {
    const markerType = this.getMarkerTypeForLCPEvent(lcpEvent);
    const timestampLabel = `${lcpEvent.timestamp}ms`;
    const timestampMetrics = this.measureTimestamp(timestampLabel);
    const widthIncludingLabel = 10 + 5 + 20 + 5;
    const widthIncludingTimestamp = widthIncludingLabel + 5 + timestampMetrics.width;

    return {
      timestamp: lcpEvent.timestamp,
      timestampLabel,
      type: markerType,
      timestampMetrics,
      widthIncludingLabel,
      widthIncludingTimestamp,
    };
  }

  private getLayoutShiftMarker(layoutShiftEvent: WebVitalsLayoutShiftEvent): Marker {
    const markerType = MarkerType.Bad;
    const timestampLabel = `${layoutShiftEvent.timestamp}ms`;
    const timestampMetrics = this.measureTimestamp(timestampLabel);
    const widthIncludingLabel = 10 + 5;
    const widthIncludingTimestamp = widthIncludingLabel + 5 + timestampMetrics.width;

    return {
      timestamp: layoutShiftEvent.timestamp,
      timestampLabel,
      type: markerType,
      timestampMetrics,
      widthIncludingLabel,
      widthIncludingTimestamp,
    };
  }

  private renderMainFrameNavigations(markers: ReadonlyArray<number>) {
    this.context.save();
    this.context.strokeStyle = 'blue';
    this.context.beginPath();
    for (const marker of markers) {
      this.context.moveTo(this.tX(marker), 0);
      this.context.lineTo(this.tX(marker), this.height);
    }
    this.context.stroke();
    this.context.restore();
  }

  getTimeSinceLastMainFrameNavigation(time: number): number {
    let i = 0, prev = 0;
    while (i < this.mainFrameNavigations.length && this.mainFrameNavigations[i] <= time) {
      prev = this.mainFrameNavigations[i];
      i++;
    }
    return time - prev;
  }

  render(): void {
    this.updateSizes();

    this.context.save();
    this.context.clearRect(0, 0, this.width, this.height);

    this.context.strokeStyle = '#dadce0';

    this.context.beginPath();
    for (let i = 0; i < NUMBER_OF_LANES; i++) {
      this.context.moveTo(0, (i * LINE_HEIGHT) + 0.5);
      this.context.lineTo(this.width, (i * LINE_HEIGHT) + 0.5);
    }
    this.context.moveTo(0, NUMBER_OF_LANES * LINE_HEIGHT - 0.5);
    this.context.lineTo(this.width, NUMBER_OF_LANES * LINE_HEIGHT - 0.5);
    this.context.stroke();
    this.context.restore();

    this.context.save();
    this.context.font = '11px/13px 500 Helvetica Neue';
    const text = this.context.measureText('WebVitals');
    const height = text.actualBoundingBoxAscent - text.actualBoundingBoxDescent;
    this.context.fillStyle = '#202124';
    this.context.fillText('WebVitals', 6, 4 + height);
    this.context.restore();

    this.context.save();
    this.context.translate(0, LINE_HEIGHT * 1);
    this.fcpLane.renderMarkers();
    this.context.translate(0, LINE_HEIGHT * 1);
    this.lcpLane.renderMarkers();
    this.context.translate(0, LINE_HEIGHT * 1);
    this.layoutShiftsLane.renderMarkers();
    this.context.restore();

    this.longTasks.forEach(marker => this.renderLongTasksMarker(marker));
    this.renderLaneLabel(4, 'Long Tasks');

    this.renderMainFrameNavigations(this.mainFrameNavigations);
  }

  private scheduleRender() {
    if (this.animationFrame) {
      return;
    }

    this.animationFrame = window.requestAnimationFrame(() => {
      this.animationFrame = null;
      this.render();
    });
  }
}

customElements.define('devtools-timeline-webvitals', WebVitalsTimeline);
