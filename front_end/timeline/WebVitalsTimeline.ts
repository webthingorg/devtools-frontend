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
}

interface Colors {
  good: string;
  medium: string;
  bad: string;
}

const LINE_HEIGHT = 24;
const NUMBER_OF_LANES = 5;
const GOOD_TIMING = 500;
const MEDIUM_TIMING = 800;

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
  private readonly shadow = this.attachShadow({ mode: 'open' });
  private fcps: ReadonlyArray<number> = [];
  private lcps: ReadonlyArray<number> = [];
  private layoutShifts: ReadonlyArray<number> = [];
  private longTasks: ReadonlyArray<WebVitalsTimelineTask> = [];
  private startTime: number = 0;
  private duration: number = 1000;
  private isMoving: boolean = false;
  private width: number = 0;
  private height: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  // @ts-ignore
  private context: CanvasRenderingContext2D = null;
  // @ts-ignore
  private longTaskPattern: CanvasRenderingContext2D = null;
  private colors: Colors = {
    good: '#0cce6b',
    medium: '#ffa400',
    bad: '#ff4e42',
  };

  private renderLabel(position: number, lane: number, label: string) {
    this.context.font = '11px/13px 500 Helvetica Neue';
    const text = this.context.measureText(label);
    const height = text.actualBoundingBoxAscent - text.actualBoundingBoxDescent;
    this.context.fillStyle = '#202124';
    this.context.fillText(label, this.tX(position) + LINE_HEIGHT * 0.5, (lane + 0.5) * LINE_HEIGHT + height * .5);
  }

  private renderGoodMarker(fcp: number, lane: number, label: string) {
    this.context.beginPath();
    this.context.strokeStyle = this.colors.good;
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 2);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 5);
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 19);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = this.colors.good;
    this.context.arc(this.tX(fcp), (lane + 0.5) * LINE_HEIGHT, 5, 0, Math.PI * 2);
    this.context.fill();

    this.renderLabel(fcp, lane, label);
  }

  private renderMediumMarker(fcp: number, lane: number, label: string) {
    this.context.beginPath();
    this.context.strokeStyle = this.colors.medium;
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 2);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 5);
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 19);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = this.colors.medium;
    this.context.rect(this.tX(fcp) - 5, (lane + 0.5) * LINE_HEIGHT - 5, 10, 10);
    this.context.fill();

    this.renderLabel(fcp, lane, label);
  }

  private renderBadMarker(fcp: number, lane: number, label: string | null = null) {
    this.context.beginPath();
    this.context.strokeStyle = this.colors.bad;
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 2);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 5);
    this.context.moveTo(this.tX(fcp), lane * LINE_HEIGHT + 19);
    this.context.lineTo(this.tX(fcp), lane * LINE_HEIGHT + 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = this.colors.bad;
    this.context.translate(this.tX(fcp), (lane + 0.5) * LINE_HEIGHT);
    this.context.rotate(45 * Math.PI / 180);
    this.context.rect(-4, -4, 8, 8);
    this.context.rotate(-45 * Math.PI / 180);
    this.context.translate(-this.tX(fcp), -(lane + 0.5) * LINE_HEIGHT);
    this.context.fill();

    if (label) {
      this.renderLabel(fcp, lane, label);
    }
  }

  private renderMarker(fcp: number, lane: number, label: string) {
    if (fcp < GOOD_TIMING) {
      return this.renderGoodMarker(fcp, lane, label);
    }
    if (fcp < MEDIUM_TIMING) {
      return this.renderMediumMarker(fcp, lane, label);
    }
    return this.renderBadMarker(fcp, lane, label);
  }

  private renderLongTasksMarker(task: WebVitalsTimelineTask) {
    const yOffset = 4 * LINE_HEIGHT;
    const r = 2;

    if (!this.context) {
      return;
    }

    this.context.beginPath();
    this.context.fillStyle = '#669df6';
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

    // Skip pattern
    if (task.duration <= 50) {
      return;
    }

    this.context.beginPath();
    this.context.fillStyle = this.longTaskPattern;
    this.context.moveTo(this.tX(task.start + 50) + r, yOffset + 3);
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
  }

  // private renderBackground() {
  //   return LitHtml.svg`
  //     <g class="background">
  //       <rect x="${this.tX(0)}" width="${this.tD(GOOD_TIMING)}" height="24" class="good" />
  //       <rect x="${this.tX(GOOD_TIMING)}" width="${this.tD(MEDIUM_TIMING - GOOD_TIMING)}" height="24" class="medium"/>
  //     </g>
  //   `;
  // }

  // private renderLabel(label: string) {
  //   return LitHtml.svg`
  //     <foreignObject
  //       x="8"
  //       y="0"
  //       width="100"
  //       height="24"
  //       class="label"
  //       transform="translate(${this.startTime} 0)"
  //     >
  //       <span>${label}</span>
  //     </foreignObject>
  //   `;
  // }

  private handlePointerDown() {
    this.isMoving = true;
  }

  private handlePointerMove(e: MouseEvent) {
    if (!this.isMoving) {
      return;
    }
    e.preventDefault();
    this.startTime = Math.max(this.startTime - e.movementX, 0);
    this.dispatchTimelineWindowChangedEvent();
    this.render();
  }

  private handlePointerUp(e: MouseEvent) {
    if (e.type !== 'pointerup' && e.target !== e.currentTarget) {
      return;
    }
    this.isMoving = false;
  }

  private handleWheel(e: MouseWheelEvent) {
    e.preventDefault();
    this.duration = Math.max(this.duration - e.deltaY, 100);
    this.dispatchTimelineWindowChangedEvent();
    this.render();
  }

  private tX(x: number) {
    return (x - this.startTime) / this.duration * this.width;
  }

  private tD(d: number) {
    return d / this.duration * this.width;
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

    // @ts-ignore
    this.longTaskPattern = this.context.createPattern(patternCanvas, 'repeat');

    this.render();
  }

  private renderLane(data: readonly number[], lane: number, label: string) {
    if (!this.context) {
      return;
    }

    for (const marker of data) {
      this.renderMarker(marker, lane, label);
    }
  }

  private renderLaneLabel(lane: number, label: string) {
    const upperCaseLabel = label.toLocaleUpperCase();
    this.context.font = '11px/13px 500 Helvetica Neue';

    const text = this.context.measureText(upperCaseLabel);
    const height = text.actualBoundingBoxAscent - text.actualBoundingBoxDescent;
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.context.rect(0, lane * LINE_HEIGHT + 1, text.width + 12, height + 6);
    this.context.fill();
    this.context.fillStyle = '#202124';
    this.context.fillText(upperCaseLabel, 6, lane * LINE_HEIGHT + height + 4);
  }

  private render() {
    if (!this.context) {
      return;
    }

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.strokeStyle = '#dadce0';
    this.context.beginPath();
    for (let i = 0; i < NUMBER_OF_LANES; i++) {
      this.context.moveTo(0, (i * LINE_HEIGHT) + 0.5);
      this.context.lineTo(this.width, (i * LINE_HEIGHT) + 0.5);
    }
    this.context.stroke();

    this.renderLane(this.fcps, 1, 'FCP');
    this.renderLane(this.lcps, 2, 'LCP');
    this.layoutShifts.forEach(marker => this.renderBadMarker(marker, 3));
    this.renderLaneLabel(3, 'Layout Shifts');
    this.longTasks.forEach(marker => this.renderLongTasksMarker(marker));
    this.renderLaneLabel(4, 'Long Tasks');
  }

  set data(data: WebVitalsTimelineData) {
    this.startTime = data.startTime || this.startTime;
    this.duration = data.duration || this.duration;
    this.fcps = data.fcps || this.fcps;
    this.lcps = data.lcps || this.lcps;
    this.layoutShifts = data.layoutShifts || this.layoutShifts;
    this.longTasks = data.longTasks || this.longTasks;
    this.render();
  }
}

customElements.define('devtools-timeline-webvitals', WebVitalsTimeline);
