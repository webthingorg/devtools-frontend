// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Platform from '../platform/platform.js';

export class Segment {
  begin: number;
  end: number;
  data: any;
  constructor(begin: number, end: number, data: any) {
    if (begin > end) {
      throw new Error('Invalid segment');
    }
    this.begin = begin;
    this.end = end;
    this.data = data;
  }

  intersects(that: Segment): boolean {
    return this.begin < that.end && that.begin < this.end;
  }
}

export class SegmentedRange {
  _segments: Segment[];
  _mergeCallback: ((arg0: Segment, arg1: Segment) => Segment | null) | undefined;
  constructor(mergeCallback?: ((arg0: Segment, arg1: Segment) => Segment | null)) {
    this._segments = [];
    this._mergeCallback = mergeCallback;
  }

  append(newSegment: Segment): void {
    // 1. Find the proper insertion point for new segment
    let startIndex = Platform.ArrayUtilities.lowerBound(this._segments, newSegment, (a, b) => a.begin - b.begin);
    let endIndex = startIndex;
    let merged: (Segment | null) | null = null;
    if (startIndex > 0) {
      // 2. Try mering the preceding segment
      const precedingSegment = this._segments[startIndex - 1];
      merged = this._tryMerge(precedingSegment, newSegment);
      if (merged) {
        --startIndex;
        newSegment = merged;
      }
      else if (this._segments[startIndex - 1].end >= newSegment.begin) {
        // 2a. If merge failed and segments overlap, adjust preceding segment.
        // If an old segment entirely contains new one, split it in two.
        if (newSegment.end < precedingSegment.end) {
          this._segments.splice(startIndex, 0, new Segment(newSegment.end, precedingSegment.end, precedingSegment.data));
        }
        precedingSegment.end = newSegment.begin;
      }
    }
    // 3. Consume all segments that are entirely covered by the new one.
    while (endIndex < this._segments.length && this._segments[endIndex].end <= newSegment.end) {
      ++endIndex;
    }
    // 4. Merge or adjust the succeeding segment if it overlaps.
    if (endIndex < this._segments.length) {
      merged = this._tryMerge(newSegment, this._segments[endIndex]);
      if (merged) {
        endIndex++;
        newSegment = merged;
      }
      else if (newSegment.intersects(this._segments[endIndex])) {
        this._segments[endIndex].begin = newSegment.end;
      }
    }
    this._segments.splice(startIndex, endIndex - startIndex, newSegment);
  }

  appendRange(that: SegmentedRange): void {
    that.segments().forEach(segment => this.append(segment));
  }

  segments(): Segment[] {
    return this._segments;
  }

  _tryMerge(first: Segment, second: Segment): Segment | null {
    const merged = this._mergeCallback && this._mergeCallback(first, second);
    if (!merged) {
      return null;
    }
    merged.begin = first.begin;
    merged.end = Math.max(first.end, second.end);
    return merged;
  }
}
