// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { assertInstanceOf, Colors, Event, Marker, MarkerType, Timebox, WebVitalsTimeline } from './WebVitalsTimeline.js';

type GetMarkerTypeCallback = (event: Event) => MarkerType;
const LONG_TASK_DURATION = 50;

abstract class WebVitalsLane {
  protected context: CanvasRenderingContext2D;
  protected timeline: WebVitalsTimeline;

  constructor(timeline: WebVitalsTimeline) {
    this.timeline = timeline;
    this.context = timeline.getContext();
  }

  handlePointerMove(x: number | null) {
  }
  handleClick(x: number | null) {
  }

  protected tX(x: number) {
    return this.timeline.tX(x);
  }

  protected tD(x: number) {
    return this.timeline.tD(x);
  }

  protected renderLaneLabel(label: string) {
    const upperCaseLabel = label.toLocaleUpperCase();
    this.context.save();

    this.context.font = '9px/11px 500 Helvetica Neue';
    const text = this.context.measureText(upperCaseLabel);
    const height = text.actualBoundingBoxAscent - text.actualBoundingBoxDescent;
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.context.fillRect(0, 1, text.width + 12, height + 6);
    this.context.fillStyle = '#80868b';
    this.context.fillText(upperCaseLabel, 6, height + 4);
    this.context.restore();
  }

  render() {
  }
}

export class WebVitalsEventLane extends WebVitalsLane {
  private markers: ReadonlyArray<Marker> = [];
  private selectedMarker: Marker | null = null;
  private hoverMarker: Marker | null = null;
  private labelMetrics: TextMetrics;
  private label: string;
  private getMarkerType: GetMarkerTypeCallback;

  constructor(timeline: WebVitalsTimeline, label: string, getMarkerType: GetMarkerTypeCallback) {
    super(timeline);
    this.context = timeline.getContext();
    this.label = label;
    this.getMarkerType = getMarkerType;
    this.labelMetrics = this.measureLabel(this.label);
  }

  handlePointerMove(x: number | null) {
    if (x === null) {
      this.hoverMarker = null;
    } else {
      this.hoverMarker = this.markers.find(m => {
        const _x = this.tX(m.timestamp);
        return _x - 5 <= x && x <= _x + m.widthIncludingLabel;
      }) ||
        null;
    }
  }

  handleClick(x: number | null) {
    this.selectedMarker = this.hoverMarker;
  }

  setEvents(markers: ReadonlyArray<Event>) {
    this.markers = markers.map(e => this.getMarker(e));
  }

  private measureLabel(label: string) {
    this.context.save();
    this.context.font = '11px/13px 500 Helvetica Neue';
    const textMetrics = this.context.measureText(label);
    this.context.restore();
    return textMetrics;
  }

  private measureTimestamp(timestamp: string) {
    this.context.save();
    this.context.font = '11px/13px 400 Helvetica Neue';
    const textMetrics = this.context.measureText(timestamp);
    this.context.restore();
    return textMetrics;
  }

  private getMarker(event: Event): Marker {
    const markerType = this.getMarkerType(event);
    const timestamp = this.timeline.getTimeSinceLastMainFrameNavigation(event.timestamp);
    const timestampLabel = Number.preciseMillisToString(timestamp, 1);
    const timestampMetrics = this.measureTimestamp(timestampLabel);
    const widthIncludingLabel = 10 + 5 + this.labelMetrics.width + 5;
    const widthIncludingTimestamp = widthIncludingLabel + 5 + timestampMetrics.width;

    return {
      timestamp: event.timestamp,
      timestampLabel,
      type: markerType,
      timestampMetrics,
      widthIncludingLabel,
      widthIncludingTimestamp,
    };
  }

  private renderLabel(position: number, label: string, textMetrics: TextMetrics) {
    this.context.save();
    this.context.font = '11px/13px 500 Helvetica Neue';
    const height = textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent;
    this.context.fillStyle = '#202124';
    this.context.fillText(
      label, this.tX(position) + this.timeline.getLineHeight() * 0.5,
      0.5 * this.timeline.getLineHeight() + height * .5);
    this.context.restore();
  }

  private renderTimestamp(position: number, textWidth: number, timestamp: string, textMetrics: TextMetrics) {
    this.context.save();
    this.context.font = '11px/13px 400 Helvetica Neue';
    const height = textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent;
    this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.context.fillText(
      timestamp, this.tX(position) + this.timeline.getLineHeight() * 0.5 + textWidth + 5,
      0.5 * this.timeline.getLineHeight() + height * .5);
    this.context.restore();
  }

  private renderGoodMarkerSymbol(timestamp: number) {
    const radius = 5;

    this.context.save();
    this.context.beginPath();
    this.context.strokeStyle = Colors.Good;
    this.context.moveTo(this.tX(timestamp), 2);
    this.context.lineTo(this.tX(timestamp), 5);
    this.context.moveTo(this.tX(timestamp), 19);
    this.context.lineTo(this.tX(timestamp), 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = Colors.Good;
    this.context.arc(this.tX(timestamp), 0.5 * this.timeline.getLineHeight(), radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  private renderMediumMarkerSymbol(marker: number) {
    this.context.save();
    this.context.beginPath();
    this.context.strokeStyle = Colors.Medium;
    this.context.moveTo(this.tX(marker), 2);
    this.context.lineTo(this.tX(marker), 5);
    this.context.moveTo(this.tX(marker), 19);
    this.context.lineTo(this.tX(marker), 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = Colors.Medium;
    this.context.rect(this.tX(marker) - 5, 0.5 * this.timeline.getLineHeight() - 5, 10, 10);
    this.context.fill();
    this.context.restore();
  }

  private renderBadMarkerSymbol(fcp: number) {
    this.context.save();
    this.context.beginPath();
    this.context.strokeStyle = Colors.Bad;
    this.context.moveTo(this.tX(fcp), 2);
    this.context.lineTo(this.tX(fcp), 5);
    this.context.moveTo(this.tX(fcp), 19);
    this.context.lineTo(this.tX(fcp), 22);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = Colors.Bad;
    this.context.translate(this.tX(fcp), 0.5 * this.timeline.getLineHeight());
    this.context.rotate(45 * Math.PI / 180);
    this.context.rect(-4, -4, 8, 8);
    this.context.rotate(-45 * Math.PI / 180);
    this.context.translate(-this.tX(fcp), -0.5 * this.timeline.getLineHeight());
    this.context.fill();
    this.context.restore();
  }

  private renderMarker(marker: Marker, selected: boolean, hover: boolean, nextMarker: Marker | null) {
    const timestampLabel = marker.timestampLabel;
    const labelMetrics = this.labelMetrics;
    const timestampMetrics = marker.timestampMetrics;

    const showFrame = selected;
    const showDetails = hover || selected;
    const widthIncludingLabel = marker.widthIncludingLabel;
    const widthIncludingTimestamp = showDetails ? marker.widthIncludingTimestamp : widthIncludingLabel;

    const pixelDistance = nextMarker ? this.tD(nextMarker.timestamp - marker.timestamp) : null;
    const showLabel = showDetails || (pixelDistance !== null && pixelDistance > widthIncludingLabel + 5);

    if (showDetails) {
      this.context.save();
      const _x = this.tX(marker.timestamp) - 5 - 5;
      const _y = 1;
      const _width = widthIncludingTimestamp + 2 * 5;
      const _height = this.timeline.getLineHeight() - 2;


      this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.context.fillRect(_x, _y, _width, _height);

      if (showFrame) {
        this.context.strokeStyle = '#1b73e7';
        this.context.lineWidth = 2;
        this.context.strokeRect(_x, _y, _width, _height);
        this.context.lineWidth = 1;
      }

      this.context.restore();
    }

    if (showLabel) {
      if (labelMetrics) {
        this.renderLabel(marker.timestamp, this.label, labelMetrics);
      }

      if (showDetails) {
        this.renderTimestamp(marker.timestamp, labelMetrics ? labelMetrics.width : 0, timestampLabel, timestampMetrics);
      }
    }

    if (marker.type === MarkerType.Good) {
      this.renderGoodMarkerSymbol(marker.timestamp);
    } else if (marker.type === MarkerType.Medium) {
      this.renderMediumMarkerSymbol(marker.timestamp);
    } else {
      this.renderBadMarkerSymbol(marker.timestamp);
    }
  }

  render() {
    for (let i = 0; i < this.markers.length; i++) {
      const event = this.markers[i];
      if (event === this.selectedMarker || event === this.hoverMarker) {
        continue;
      }
      this.renderMarker(event, false, false, i < this.markers.length - 1 ? this.markers[i + 1] : null);
    }

    if (this.hoverMarker && this.hoverMarker !== this.selectedMarker) {
      this.renderMarker(this.hoverMarker, false, true, null);
    }

    if (this.selectedMarker) {
      this.renderMarker(this.selectedMarker, true, false, null);
    }
  }
}

export class WebVitalsTimeboxLane extends WebVitalsLane {
  private longTaskPattern: CanvasPattern;
  private boxes: ReadonlyArray<Timebox> = [];
  private label: string;

  constructor(timeline: WebVitalsTimeline, label: string) {
    super(timeline);

    this.label = label;
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
    const canvasPattern = this.context.createPattern(patternCanvas, 'repeat');
    assertInstanceOf(canvasPattern, CanvasPattern);
    this.longTaskPattern = canvasPattern;
  }

  setTimeboxes(boxes: ReadonlyArray<Timebox>) {
    this.boxes = boxes;
  }

  private renderTimebox(box: Timebox) {
    const r = 2;

    this.context.save();
    this.context.beginPath();
    this.context.fillStyle = '#669df6';
    // Draw a box with rounded corners.
    this.context.moveTo(this.tX(box.start) + r, 3);
    this.context.lineTo(this.tX(box.start + box.duration) - r, 3);
    this.context.quadraticCurveTo(
      this.tX(box.start + box.duration),
      3,
      this.tX(box.start + box.duration),
      3 + r,
    );
    this.context.lineTo(this.tX(box.start + box.duration), 24 - r);
    this.context.quadraticCurveTo(
      this.tX(box.start + box.duration),
      24 - r,
      this.tX(box.start + box.duration) - r,
      24,
    );
    this.context.lineTo(this.tX(box.start) + r, 24);
    this.context.quadraticCurveTo(
      this.tX(box.start) + r,
      24,
      this.tX(box.start),
      24 - r,
    );
    this.context.lineTo(this.tX(box.start), 3 + r);
    this.context.quadraticCurveTo(
      this.tX(box.start),
      3 + r,
      this.tX(box.start) + r,
      3,
    );
    this.context.closePath();
    this.context.fill();

    // Fill the box with a striped pattern for everything over 50ms.
    this.context.beginPath();
    this.context.fillStyle = this.longTaskPattern;
    this.context.moveTo(this.tX(box.start + LONG_TASK_DURATION) + r, 3);
    this.context.lineTo(this.tX(box.start + box.duration) - r, 3);
    this.context.quadraticCurveTo(
      this.tX(box.start + box.duration),
      3,
      this.tX(box.start + box.duration),
      3 + r,
    );
    this.context.lineTo(this.tX(box.start + box.duration), 24 - r);
    this.context.quadraticCurveTo(
      this.tX(box.start + box.duration),
      24 - r,
      this.tX(box.start + box.duration) - r,
      24,
    );
    this.context.lineTo(this.tX(box.start + 50), 24);
    this.context.lineTo(this.tX(box.start + 50), 3);
    this.context.closePath();
    this.context.fill();
    this.context.restore();
  }

  render() {
    const i = 0;
    for (const box of this.boxes) {
      this.renderTimebox(box);
    }

    this.renderLaneLabel(this.label);
  }
}
