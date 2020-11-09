/*
 * Copyright (C) 2019 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Root from '../root/root.js';

import {TimelineCategory, TimelineRecordStyle} from './TimelineUIUtils.js';

/** @type {?Map<string, !TimelineRecordStyle>} */
let _eventStylesMap = null;

/** @type {?Map<string, !TimelineCategory>} */
let _categories = null;

/**
 * @unrestricted
 */
export class UIDevtoolsUtils {
  /**
   * @return {boolean}
   */
  static isUiDevTools() {
    return Root.Runtime.Runtime.queryParam('uiDevTools') === 'true';
  }

  /**
   * @return {!Map.<string, !TimelineRecordStyle>}
   */
  static categorizeEvents() {
    if (_eventStylesMap) {
      return _eventStylesMap;
    }

    const type = RecordType;
    const categories = UIDevtoolsUtils.categories();
    const drawing = categories.get('drawing');
    const rasterizing = categories.get('rasterizing');
    const layout = categories.get('layout');
    const painting = categories.get('painting');
    const other = categories.get('other');

    _eventStylesMap = new Map();

    if (painting) {
      _eventStylesMap.set(type.ViewPaint, new TimelineRecordStyle(ls`View::Paint`, painting));
      _eventStylesMap.set(type.ViewOnPaint, new TimelineRecordStyle(ls`View::OnPaint`, painting));
      _eventStylesMap.set(type.ViewPaintChildren, new TimelineRecordStyle(ls`View::PaintChildren`, painting));
      _eventStylesMap.set(type.ViewOnPaintBackground, new TimelineRecordStyle(ls`View::OnPaintBackground`, painting));
      _eventStylesMap.set(type.ViewOnPaintBorder, new TimelineRecordStyle(ls`View::OnPaintBorder`, painting));
      _eventStylesMap.set(
          type.LayerPaintContentsToDisplayList,
          new TimelineRecordStyle(ls`Layer::PaintContentsToDisplayList`, painting));
    }

    if (layout) {
      _eventStylesMap.set(type.ViewLayout, new TimelineRecordStyle(ls`View::Layout`, layout));
      _eventStylesMap.set(
          type.ViewLayoutBoundsChanged, new TimelineRecordStyle(ls`View::Layout(bounds_changed)`, layout));
    }

    if (rasterizing) {
      _eventStylesMap.set(type.RasterTask, new TimelineRecordStyle(ls`RasterTask`, rasterizing));
      _eventStylesMap.set(
          type.RasterizerTaskImplRunOnWorkerThread,
          new TimelineRecordStyle(ls`RasterizerTaskImpl::RunOnWorkerThread`, rasterizing));
    }

    if (drawing) {
      _eventStylesMap.set(
          type.DirectRendererDrawFrame, new TimelineRecordStyle(ls`DirectRenderer::DrawFrame`, drawing));
      _eventStylesMap.set(type.BeginFrame, new TimelineRecordStyle(ls`Frame Start`, drawing, true));
      _eventStylesMap.set(type.DrawFrame, new TimelineRecordStyle(ls`Draw Frame`, drawing, true));
      _eventStylesMap.set(
          type.NeedsBeginFrameChanged, new TimelineRecordStyle(ls`NeedsBeginFrameChanged`, drawing, true));
    }

    if (other) {
      _eventStylesMap.set(
          type.ThreadControllerImplRunTask, new TimelineRecordStyle(ls`ThreadControllerImpl::RunTask`, other));
    }

    return _eventStylesMap;
  }

  /**
   * @return {!Map.<string, !TimelineCategory>}
   */
  static categories() {
    if (_categories) {
      return _categories;
    }
    _categories = new Map([
      ['layout', new TimelineCategory('layout', ls`Layout`, true, 'hsl(214, 67%, 74%)', 'hsl(214, 67%, 66%)')],
      [
        'rasterizing',
        new TimelineCategory('rasterizing', ls`Rasterizing`, true, 'hsl(43, 83%, 72%)', 'hsl(43, 83%, 64%) ')
      ],
      ['drawing', new TimelineCategory('drawing', ls`Drawing`, true, 'hsl(256, 67%, 76%)', 'hsl(256, 67%, 70%)')],
      ['painting', new TimelineCategory('painting', ls`Painting`, true, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)')],
      ['other', new TimelineCategory('other', ls`System`, false, 'hsl(0, 0%, 87%)', 'hsl(0, 0%, 79%)')],
      ['idle', new TimelineCategory('idle', ls`Idle`, false, 'hsl(0, 0%, 98%)', 'hsl(0, 0%, 98%)')],
    ]);
    return _categories;
  }

  /**
   * @return {!Array<string>}
   */
  static getMainCategoriesList() {
    return ['idle', 'drawing', 'painting', 'rasterizing', 'layout', 'other'];
  }
}

/**
 * @enum {string}
 */
export const RecordType = {
  ViewPaint: 'View::Paint',
  ViewOnPaint: 'View::OnPaint',
  ViewPaintChildren: 'View::PaintChildren',
  ViewOnPaintBackground: 'View::OnPaintBackground',
  ViewOnPaintBorder: 'View::OnPaintBorder',
  ViewLayout: 'View::Layout',
  ViewLayoutBoundsChanged: 'View::Layout(bounds_changed)',
  LayerPaintContentsToDisplayList: 'Layer::PaintContentsToDisplayList',
  DirectRendererDrawFrame: 'DirectRenderer::DrawFrame',
  RasterTask: 'RasterTask',
  RasterizerTaskImplRunOnWorkerThread: 'RasterizerTaskImpl::RunOnWorkerThread',
  BeginFrame: 'BeginFrame',
  DrawFrame: 'DrawFrame',
  NeedsBeginFrameChanged: 'NeedsBeginFrameChanged',
  ThreadControllerImplRunTask: 'ThreadControllerImpl::RunTask',
};
