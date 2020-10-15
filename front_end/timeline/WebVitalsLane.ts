// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Colors, Marker, MarkerType, WebVitalsTimeline} from './WebVitalsTimeline';

export class WebVitalsLane {
  private context: CanvasRenderingContext2D;
  private markers: ReadonlyArray<Marker>;
  private selectedMarker: Marker|null = null;
  private hoverMarker: Marker|null = null;
  private labelMetrics: TextMetrics;
  private timeline: WebVitalsTimeline;
  private label: string;

  constructor(timeline: WebVitalsTimeline, label: string, markers: ReadonlyArray<Marker>) {
    this.timeline = timeline;
    this.context = timeline.getContext();
    this.markers = markers;
    this.label = label;

    this.labelMetrics = this.measureLabel(this.label);
  }

  handlePointerMove(x: number|null) {
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

  handleClick(x: number|null) {
    this.selectedMarker = this.hoverMarker;
  }

  updateMarkers(markers: ReadonlyArray<Marker>) {
    this.markers = markers;
  }

  private tX(x: number) {
    return this.timeline.tX(x);
  }

  private tD(x: number) {
    return this.timeline.tD(x);
  }

  private measureLabel(label: string) {
    this.context.save();
    this.context.font = '11px/13px 500 Helvetica Neue';
    const textMetrics = this.context.measureText(label);
    this.context.restore();
    return textMetrics;
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

  private renderMarker(marker: Marker, selected: boolean, hover: boolean, nextMarker: Marker|null) {
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

  renderMarkers() {
    for (let i = 0; i < this.markers.length; i++) {
      const fcpEvent = this.markers[i];
      if (fcpEvent === this.selectedMarker || fcpEvent === this.hoverMarker) {
        continue;
      }
      this.renderMarker(fcpEvent, false, false, i < this.markers.length - 1 ? this.markers[i + 1] : null);
    }

    if (this.hoverMarker && this.hoverMarker !== this.selectedMarker) {
      this.renderMarker(this.hoverMarker, false, true, null);
    }

    if (this.selectedMarker) {
      this.renderMarker(this.selectedMarker, true, false, null);
    }
  }
}
