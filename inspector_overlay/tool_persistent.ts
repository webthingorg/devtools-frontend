// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//  Copyright (C) 2012 Google Inc. All rights reserved.

//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions
//  are met:

//  1.  Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//  2.  Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//  3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
//      its contributors may be used to endorse or promote products derived
//      from this software without specific prior written permission.

//  THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
//  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//  DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
//  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
//  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import {Overlay, ResetData} from './common.js';
import {Delegate, DragResizeHandler} from './drag_resize_handler.js';
import {drawLayoutFlexContainerHighlight, FlexContainerHighlight} from './highlight_flex_common.js';
import {drawLayoutGridHighlight, GridHighlight} from './highlight_grid_common.js';

interface GapMetadata {
  rowGapPath: Path2D|null;
  columnGapPath: Path2D|null;
  // Stores the index of the grid highlight config so that it can be found later.
  highlightIdx: number;
  rowGapValue: number;
  rowColumnValue: number;
}

function makeDraggableDelegate(overlay: PersistentOverlay): Delegate {
  return {
    getDraggable: (x, y) => {
      const match = overlay.isPointInGapPath(x, y);
      if (!match) {
        return;
      }
      return {
        draggableCoordinate: match.matchType === 'column' ? 'clientX' : 'clientY',
        initialValue: match.matchType === 'column' ? match.columnValue : match.rowValue,
        id: match.highlightIdx,
        update: newValue => {
          window.InspectorOverlayHost.send(JSON.stringify({
            matchType: match.matchType,
            highlightIdx: match.highlightIdx,
            value: newValue + 'px',
          }));
        },
      };
    },
  };
}

export class PersistentOverlay extends Overlay {
  private gridLabelState = {gridLayerCounter: 0};

  private gridLabels!: HTMLElement;
  private gaps: Array<GapMetadata> = [];
  // Keeps track drawGridHighlight requests and assigns an index to each one.
  private highlightIdx = 0;
  private dragHandler = new DragResizeHandler(document, makeDraggableDelegate(this));

  reset(data: ResetData) {
    super.reset(data);
    this.gridLabelState.gridLayerCounter = 0;
    this.gridLabels.innerHTML = '';
    this.gaps = [];
    this.highlightIdx = 0;
  }

  renderGridMarkup() {
    const gridLabels = this.document.createElement('div');
    gridLabels.id = 'grid-label-container';
    this.document.body.append(gridLabels);
    this.gridLabels = gridLabels;
  }

  install() {
    this.document.body.classList.add('fill');

    const canvas = this.document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.classList.add('fill');
    this.document.body.append(canvas);

    this.renderGridMarkup();

    this.setCanvas(canvas);

    super.install();

    this.dragHandler.install();
  }

  uninstall() {
    this.document.body.classList.remove('fill');
    this.document.body.innerHTML = '';
    this.gaps = [];
    this.highlightIdx = 0;
    super.uninstall();
    this.dragHandler.uninstall();
  }

  drawGridHighlight(highlight: GridHighlight) {
    this.context.save();
    const result = drawLayoutGridHighlight(
        highlight, this.context, this.deviceScaleFactor, this.canvasWidth, this.canvasHeight, this.emulationScaleFactor,
        this.gridLabelState);
    this.context.restore();
    this.gaps.push({
      rowGapPath: result.rowGapPath,
      columnGapPath: result.columnGapPath,
      highlightIdx: this.highlightIdx,
      rowGapValue: parseInt(highlight.rowGap, 10),
      rowColumnValue: parseInt(highlight.columnGap, 10),
    });
    this.highlightIdx++;
  }

  drawFlexContainerHighlight(highlight: FlexContainerHighlight) {
    this.context.save();
    drawLayoutFlexContainerHighlight(
        highlight, this.context, this.deviceScaleFactor, this.canvasWidth, this.canvasHeight,
        this.emulationScaleFactor);
    this.context.restore();
  }

  isPointInGapPath(x: number, y: number): null|
      {matchType: 'column' | 'row', highlightIdx: number, columnValue: number, rowValue: number} {
    const context = this.context;
    let highlightIdx = -1;
    let matchType: 'column'|'row' = 'row';
    let columnValue = 0;
    let rowValue = 0;
    for (const [i, gaps] of this.gaps.entries()) {
      if (gaps.columnGapPath && context.isPointInPath(gaps.columnGapPath, x, y)) {
        highlightIdx = i;
        matchType = 'column';
        columnValue = gaps.rowColumnValue;
        break;
      }
      if (gaps.rowGapPath && context.isPointInPath(gaps.rowGapPath, x, y)) {
        highlightIdx = i;
        matchType = 'row';
        rowValue = gaps.rowGapValue;
        break;
      }
    }
    return highlightIdx !== -1 ? {matchType, highlightIdx, columnValue, rowValue} : null;
  }
}
