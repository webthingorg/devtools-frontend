
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface Draggable {
  draggableCoordinate: 'clientX'|'clientY';
  initialValue: number;
  update(newValue: number): void;
}

export interface Delegate {
  getDraggable(x: number, y: number): Draggable|undefined;
}

export class DragResizeHandler {
  private document: Document;
  private delegate: Delegate;
  private origin = {
    coord: null as number | null,
    value: 0,
  };
  private temp = {
    coord: null as number | null,
    value: 0,
  };
  private settings = {
    distanceThreshold: 10,
    modifiers: {
      alt: .1,
      shift: 10,
    },
  };

  constructor(document: Document, delegate: Delegate) {
    this.document = document;
    this.delegate = delegate;
    this.onMouseHover = this.onMouseHover.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  install() {
    document.body.addEventListener('mousemove', this.onMouseHover);
    document.body.addEventListener('mousedown', this.onMouseDown);
  }

  uninstall() {
    document.body.removeEventListener('mousemove', this.onMouseHover);
    document.body.removeEventListener('mousedown', this.onMouseDown);
  }

  /**
   * Starts dragging
   */
  private onMouseDown(event: MouseEvent) {
    const match = this.delegate.getDraggable(event.clientX, event.clientY);

    if (!match) {
      return;
    }

    this.origin.value = match.initialValue;
    this.temp.value = match.initialValue;

    const boundMouthMove = this.onDrag.bind(this, match);

    event.stopPropagation();
    event.preventDefault();
    this.origin.coord = Math.round(event[match.draggableCoordinate]);
    this.temp.coord = this.origin.coord;

    document.body.removeEventListener('mousemove', this.onMouseHover);
    document.body.style.cursor = match.draggableCoordinate === 'clientX' ? 'ew-resize' : 'ns-resize';

    const endDrag = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
      this.origin.coord = null;
      this.temp.coord = null;

      document.body.style.cursor = 'default';
      document.body.removeEventListener('mousemove', boundMouthMove);
      document.body.addEventListener('mousemove', this.onMouseHover);
      document.body.removeEventListener('mouseup', endDrag);
      window.removeEventListener('mouseout', endDrag);
    };

    document.body.addEventListener('mouseup', endDrag, {once: true});
    window.addEventListener('mouseout', endDrag, {once: true});

    document.body.addEventListener('mousemove', boundMouthMove);
  }

  /**
   * Computes the new value while the cursor is being dragged and calls InspectorOverlayHost with the new value.
   */
  private onDrag(match: Draggable, e: MouseEvent) {
    if (this.origin.coord === null) {
      return;
    }

    const newTargetCoord = Math.round(parseInt(String(e[match.draggableCoordinate]), 10));
    let delta = Math.round(((this.temp.coord || 0) - newTargetCoord) / this.settings.distanceThreshold);

    let amount = 1;

    if (e.shiftKey) {
      amount = this.settings.modifiers.shift;
    }
    if (e.altKey) {
      amount = this.settings.modifiers.alt;
    }

    delta *= amount * -1;

    let newValue = this.temp.value + delta;

    if (!Number.isInteger(newValue)) {
      newValue = parseFloat(newValue.toFixed(1));
    }

    if (newValue !== this.temp.value) {
      this.temp.coord = newTargetCoord;
      this.temp.value = newValue;
      match.update(newValue);
    }
  }

  /**
   * Updates the cursor style of the mouse is hovered over a resizeable area.
   */
  private onMouseHover(event: MouseEvent) {
    const match = this.delegate.getDraggable(event.clientX, event.clientY);
    this.document.body.style.cursor =
        match ? (match.draggableCoordinate === 'clientX' ? 'ew-resize' : 'ns-resize') : 'default';
  }
}
