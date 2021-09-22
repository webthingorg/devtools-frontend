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
  private boundMousemove: (event: MouseEvent) => void;
  private boundMousedown: (event: MouseEvent) => void;

  constructor(document: Document, delegate: Delegate) {
    this.document = document;
    this.delegate = delegate;
    this.boundMousemove = this.onMousemove.bind(this);
    this.boundMousedown = this.onMousedown.bind(this);
  }

  install() {
    document.body.addEventListener('mousemove', this.boundMousemove);
    document.body.addEventListener('mousedown', this.boundMousedown);
  }

  uninstall() {
    document.body.removeEventListener('mousemove', this.boundMousemove);
    document.body.removeEventListener('mousedown', this.boundMousedown);
  }

  /**
   * Updates the cursor style of the mouse is hovered over a resizeable area.
   */
  private onMousemove(event: MouseEvent) {
    const match = this.delegate.getDraggable(event.clientX, event.clientY);
    this.document.body.style.cursor =
        match ? (match.draggableCoordinate === 'clientX' ? 'ew-resize' : 'ns-resize') : 'default';
  }

  /**
   * Starts dragging
   */
  private onMousedown(event: MouseEvent) {
    const match = this.delegate.getDraggable(event.clientX, event.clientY);

    if (!match) {
      return;
    }

    const boundOnDrag = this.onDrag.bind(this, match);

    event.stopPropagation();
    event.preventDefault();
    this.origin.coord = Math.round(event[match.draggableCoordinate]);
    this.origin.value = match.initialValue;

    document.body.removeEventListener('mousemove', this.boundMousemove);
    document.body.style.cursor = match.draggableCoordinate === 'clientX' ? 'ew-resize' : 'ns-resize';

    const endDrag = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
      this.origin.coord = null;

      document.body.style.cursor = 'default';
      document.body.removeEventListener('mousemove', boundOnDrag);
      document.body.addEventListener('mousemove', this.boundMousemove);
    };

    document.body.addEventListener('mouseup', endDrag, {once: true});
    window.addEventListener('mouseout', endDrag, {once: true});

    document.body.addEventListener('mousemove', boundOnDrag);
  }

  /**
   * Computes the new value while the cursor is being dragged and calls InspectorOverlayHost with the new value.
   */
  private onDrag(match: Draggable, e: MouseEvent) {
    if (this.origin.coord === null) {
      return;
    }

    const newTargetCoord = Math.round(parseInt(String(e[match.draggableCoordinate]), 10));
    const delta = Math.round((this.origin.coord || 0) - newTargetCoord);
    let newValue = this.origin.value - delta;

    if (!Number.isInteger(newValue)) {
      newValue = parseFloat(newValue.toFixed(1));
    }

    match.update(newValue);
  }
}
