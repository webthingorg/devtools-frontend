// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

declare global {
  interface HTMLElementTagNameMap {
    'devtools-timeline-webvitals': WebVitalsTimeline;
  }
}

interface WebVitalsTimelineTask {
  start: number;
  duration: number;
}

interface WebVitalsTimelineData {
  startTime: number;
  duration: number;
  fcps: number[];
  lcps: number[];
  layoutShifts: number[];
  longTasks: WebVitalsTimelineTask[];
  mainFrameNavigations: number[];
  maxDuration: number;
}

const enum MarkerType {
  Good = 1,
  Medium = 2,
  Bad = 3
}

type GetMarkerTypeCallback = ((marker: number) => MarkerType);

const LINE_HEIGHT = 24;
const NUMBER_OF_LANES = 5;
const FCP_GOOD_TIMING = 2000;
const FCP_MEDIUM_TIMING = 4000;
const LCP_GOOD_TIMING = 2500;
const LCP_MEDIUM_TIMING = 4000;
const LONG_TASK_DURATION = 50;

const Colors = {
  good: '#0cce6b',
  medium: '#ffa400',
  bad: '#ff4e42',
};

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
  private fcps: ReadonlyArray<number> = [];
  private lcps: ReadonlyArray<number> = [];
  private layoutShifts: ReadonlyArray<number> = [];
  private longTasks: ReadonlyArray<WebVitalsTimelineTask> = [];
  private mainFrameNavigations: ReadonlyArray<number> = [];
  private startTime = 0;
  private duration = 1000;
  private maxDuration = 1000;
  private isMoving = false;
  private width = 0;
  private height = 0;
  private canvas: HTMLCanvasElement|null = null;

  // Will be initialised in the connected callback.
  // @ts-ignore
  private context: CanvasRenderingContext2D = null;
  // Will be initialised in the connected callback.
  // @ts-ignore
  private longTaskPattern: CanvasPattern = null;
  private animationFrame: number|null = null;

  private renderLabel(position: number, lane: number, label: string|null) {
    if (!label) {
      return;
    }

    this.context.save();
    this.context.font = '11px/13px 500 Helvetica Neue';
    const text = this.context.measureText(label);
    const height = text.actualBoundingBoxAscent - text.actualBoundingBoxDescent;
    this.context.fillStyle = '#202124';
    this.context.fillText(label, this.tX(position) + LINE_HEIGHT * 0.5, (lane + 0.5) * LINE_HEIGHT + height * .5);
    this.context.restore();
  }

  private renderGoodMarker(marker: number, lane: number, label: string) {
    this.context.save();
    this.context.beginPath();
    this.context.strokeStyle = Colors.good;
    this.context.moveTo(this.tX(marker), lane * LINE_HEIGHT + 2);
    this.context.lineTo(this.tX(marker), lane * LINE_HEIGHT + 5);
    this.context.moveTo(this.tX(marker), lane * LINE_HEIGHT + 19);
    this.context.lineTo(this.tX(marker), lane * LINE_HEIGHT + 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = Colors.good;
    this.context.arc(this.tX(marker), (lane + 0.5) * LINE_HEIGHT, 5, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();

    this.renderLabel(marker, lane, label);
  }

  private renderMediumMarker(marker: number, lane: number, label: string) {
    this.context.save();
    this.context.beginPath();
    this.context.strokeStyle = Colors.medium;
    this.context.moveTo(this.tX(marker), lane * LINE_HEIGHT + 2);
    this.context.lineTo(this.tX(marker), lane * LINE_HEIGHT + 5);
    this.context.moveTo(this.tX(marker), lane * LINE_HEIGHT + 19);
    this.context.lineTo(this.tX(marker), lane * LINE_HEIGHT + 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = Colors.medium;
    this.context.rect(this.tX(marker) - 5, (lane + 0.5) * LINE_HEIGHT - 5, 10, 10);
    this.context.fill();
    this.context.restore();

    this.renderLabel(marker, lane, label);
  }

  private renderBadMarker(fcp: number, lane: number, label: string|null = null) {
    this.context.save();
    this.context.beginPath();
    this.context.strokeStyle = Colors.bad;
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 2);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 5);
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 19);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = Colors.bad;
    this.context.translate(this.tX(fcp), (lane + 0.5) * LINE_HEIGHT);
    this.context.rotate(45 * Math.PI / 180);
    this.context.rect(-4, -4, 8, 8);
    this.context.rotate(-45 * Math.PI / 180);
    this.context.translate(-this.tX(fcp), -(lane + 0.5) * LINE_HEIGHT);
    this.context.fill();
    this.context.restore();

    this.renderLabel(fcp, lane, label);
  }

  private renderMarker(
      marker: number, lane: number, label: string, getMarkerType: GetMarkerTypeCallback|undefined = undefined) {
    const markerType = getMarkerType ? getMarkerType(marker) : MarkerType.Good;
    switch (markerType) {
      case MarkerType.Good:
        return this.renderGoodMarker(marker, lane, label);
      case MarkerType.Medium:
        return this.renderMediumMarker(marker, lane, label);
      case MarkerType.Bad:
        return this.renderBadMarker(marker, lane, label);
      default:
        throw new Error('Invalid markerType');
    }
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

  private handlePointerDown() {
    this.isMoving = true;
  }

  private handlePointerMove(e: MouseEvent) {
    if (!this.isMoving) {
      return;
    }
    e.preventDefault();

    const timeOffset = e.movementX / this.width * this.duration;
    this.startTime = Math.min(Math.max(this.startTime - timeOffset, 0), this.maxDuration - this.duration);
    this.dispatchTimelineWindowChangedEvent();
    this.scheduleRender();
  }

  private handlePointerUp(e: MouseEvent) {
    if (e.type !== 'pointerup' && e.target !== e.currentTarget) {
      return;
    }
    this.isMoving = false;
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    const mouseWheelZoomSpeed = 1 / 120;
    const zoom = Math.pow(1.2, -(e.deltaY || e.deltaX) * mouseWheelZoomSpeed) - 1;
    const bounds = {left: this.startTime, right: this.startTime + this.duration};

    const cursorTime = this.startTime + (e.offsetX / this.width) * this.duration;
    bounds.left += (bounds.left - cursorTime) * zoom;
    bounds.right += (bounds.right - cursorTime) * zoom;

    bounds.left = Math.max(bounds.left, 0);
    bounds.right = Math.min(bounds.right, this.maxDuration);

    this.startTime = bounds.left;
    this.duration = bounds.right - bounds.left;
    this.dispatchTimelineWindowChangedEvent();
    this.scheduleRender();
  }

  /**
   * Transform from time to pixel offset
   * @param x
   */
  private tX(x: number) {
    return (x - this.startTime) / this.duration * this.width;
  }

  private dispatchTimelineWindowChangedEvent() {
    this.dispatchEvent(new TimelineWindowChangedEvent(this.startTime, this.duration));
  }

  connectedCallback() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = LINE_HEIGHT * NUMBER_OF_LANES + 'px';
    this.shadow.appendChild(this.canvas);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointerout', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointerleave', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

    const patternCanvas = document.createElement('canvas');
    const patternContext = patternCanvas.getContext('2d');

    if (!patternContext) {
      return;
    }

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

    this.width = this.canvas.getBoundingClientRect().width;
    this.height = this.canvas.getBoundingClientRect().height;
    const context = this.canvas?.getContext('2d');

    if (!context) {
      return;
    }

    this.context = context;

    const scale = window.devicePixelRatio;
    this.canvas.width = Math.floor(this.width * scale);
    this.canvas.height = Math.floor(this.height * scale);
    this.context.scale(scale, scale);


    const canvasPattern = this.context.createPattern(patternCanvas, 'repeat');
    if (!canvasPattern) {
      throw new Error('Could not create CanvasPattern');
    }
    this.longTaskPattern = canvasPattern;

    this.render();
  }

  private renderLane(
      data: readonly number[], lane: number, label: string,
      getMarkerType: GetMarkerTypeCallback|undefined = undefined) {
    if (!this.context) {
      return;
    }

    for (const marker of data) {
      this.renderMarker(marker, lane, label, getMarkerType);
    }
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

  private renderFCPs() {
    this.renderLane(this.fcps, 1, 'FCP', (marker: number) => {
      const t = this.getTimeSinceLastMainFrameNavigation(marker);
      if (t <= FCP_GOOD_TIMING) {
        return MarkerType.Good;
      }
      if (t <= FCP_MEDIUM_TIMING) {
        return MarkerType.Medium;
      }
      return MarkerType.Bad;
    });
  }

  private renderLCPs() {
    this.renderLane(this.lcps, 2, 'LCP', (marker: number) => {
      const t = this.getTimeSinceLastMainFrameNavigation(marker);
      if (t <= LCP_GOOD_TIMING) {
        return MarkerType.Good;
      }
      if (t <= LCP_MEDIUM_TIMING) {
        return MarkerType.Medium;
      }
      return MarkerType.Bad;
    });
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

  private getTimeSinceLastMainFrameNavigation(time: number) {
    let i = 0, prev = 0;
    while (i < this.mainFrameNavigations.length && this.mainFrameNavigations[i] <= time) {
      prev = this.mainFrameNavigations[i];
      i++;
    }
    return time - prev;
  }

  private render() {
    if (!this.context) {
      return;
    }

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

    this.renderFCPs();
    this.renderLCPs();
    this.layoutShifts.forEach(marker => this.renderBadMarker(marker, 3));
    this.renderLaneLabel(3, 'Layout Shifts');
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

  set data(data: WebVitalsTimelineData) {
    this.startTime = data.startTime || this.startTime;
    this.duration = data.duration || this.duration;
    this.maxDuration = data.maxDuration || this.maxDuration;
    this.fcps = data.fcps || this.fcps;
    this.lcps = data.lcps || this.lcps;
    this.layoutShifts = data.layoutShifts || this.layoutShifts;
    this.longTasks = data.longTasks || this.longTasks;
    this.mainFrameNavigations = data.mainFrameNavigations || this.mainFrameNavigations;
    this.scheduleRender();
  }
}

customElements.define('devtools-timeline-webvitals', WebVitalsTimeline);
