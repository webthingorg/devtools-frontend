// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as SDKModule from '../../../../front_end/sdk/sdk.js';
import {createTarget, describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../helpers/MockConnection.js';

describeWithEnvironment('sortAndMergeRanges', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../front_end/sdk/sdk.js');
  });

  const createRange = (scriptId: string, startLine: number, startColumn: number, endLine: number, endColumn: number) =>
      ({
        scriptId,
        start: {lineNumber: startLine, columnNumber: startColumn},
        end: {lineNumber: endLine, columnNumber: endColumn},
      });

  it('sorts by scriptId first, then start line and column', () => {
    const R1_0_0 = createRange('script:1', 0, 0, 0, 0);
    const R1_0_4 = createRange('script:1', 0, 4, 0, 5);
    const R1_3_1 = createRange('script:1', 3, 1, 3, 2);
    const R2_0_0 = createRange('script:2', 0, 0, 0, 0);
    const R3_0_0 = createRange('script:3', 0, 0, 0, 0);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1_0_0, R2_0_0, R3_0_0]), [R1_0_0, R2_0_0, R3_0_0]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R3_0_0, R2_0_0, R1_0_0]), [R1_0_0, R2_0_0, R3_0_0]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R3_0_0, R1_0_0, R2_0_0]), [R1_0_0, R2_0_0, R3_0_0]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1_0_4, R1_0_0, R2_0_0]), [R1_0_0, R1_0_4, R2_0_0]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1_0_4, R1_3_1, R1_0_0]), [R1_0_0, R1_0_4, R1_3_1]);
  });

  it('merges equal ranges', () => {
    const R1 = createRange('script:1', 0, 3, 3, 3);
    const R2 = createRange('script:1', 4, 0, 8, 0);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1, R1]), [R1]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1, R1, R1]), [R1]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1, R2, R1, R2]), [R1, R2]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R2, R2, R2, R2, R1]), [R1, R2]);
  });

  it('merges overlapping ranges', () => {
    const R1_0_5_5_3 = createRange('script:1', 0, 5, 5, 3);
    const R1_0_3_3_3 = createRange('script:1', 0, 3, 3, 3);
    const R1_5_3_9_9 = createRange('script:1', 5, 3, 9, 9);
    const R1_0_3_9_9 = createRange('script:1', 0, 3, 9, 9);
    const R2_5_4_9_9 = createRange('script:2', 5, 4, 9, 9);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R1_0_3_3_3, R1_0_5_5_3, R1_5_3_9_9]), [R1_0_3_9_9]);
    assert.deepEqual(
        SDK.DebuggerModel.sortAndMergeRanges([R1_0_3_3_3, R1_0_5_5_3, R1_5_3_9_9, R2_5_4_9_9]),
        [R1_0_3_9_9, R2_5_4_9_9]);
  });

  it('merges overlapping ranges (same start, different end)', () => {
    const R_0_5_5_3 = createRange('script:1', 0, 5, 5, 3);
    const R_0_5_3_3 = createRange('script:1', 0, 5, 3, 3);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R_0_5_3_3, R_0_5_5_3]), [R_0_5_5_3]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R_0_5_5_3, R_0_5_3_3]), [R_0_5_5_3]);
  });

  it('merges overlapping ranges (different start, same end)', () => {
    const R_0_3_5_3 = createRange('script:1', 0, 3, 5, 3);
    const R_0_5_5_3 = createRange('script:1', 0, 5, 5, 3);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R_0_3_5_3, R_0_5_5_3]), [R_0_3_5_3]);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R_0_5_5_3, R_0_3_5_3]), [R_0_3_5_3]);
  });

  it('merges adjacent ranges', () => {
    const R_0_3_5_3 = createRange('script:1', 0, 3, 5, 3);
    const R_5_3_9_3 = createRange('script:1', 5, 3, 9, 3);
    const R_0_3_9_3 = createRange('script:1', 0, 3, 9, 3);
    assert.deepEqual(SDK.DebuggerModel.sortAndMergeRanges([R_0_3_5_3, R_5_3_9_3]), [R_0_3_9_3]);
  });
});

describeWithMockConnection('LocationRange', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../front_end/sdk/sdk.js');
  });

  describe('payload', () => {
    it('yields the correct script ID, start and end position', () => {
      const target = createTarget();
      const model = new SDK.DebuggerModel.DebuggerModel(target);
      const range = new SDK.DebuggerModel.LocationRange(model, 'script:100', 12, 34, 56, 78);
      assert.deepEqual(range.payload(), {
        scriptId: 'script:100',
        start: {lineNumber: 12, columnNumber: 34},
        end: {lineNumber: 56, columnNumber: 78},
      });
    });
  });

  describe('contains', () => {
    it('correctly rules out positions from other models', () => {
      const model1 = new SDK.DebuggerModel.DebuggerModel(createTarget());
      const model2 = new SDK.DebuggerModel.DebuggerModel(createTarget());
      const range1 = new SDK.DebuggerModel.LocationRange(model1, 'script:1', 0, 0, 9, 0);
      assert.isFalse(range1.contains(new SDK.DebuggerModel.Location(model2, 'script:1', 1, 1)));
      assert.isFalse(range1.contains(new SDK.DebuggerModel.Location(model2, 'script:2', 1, 1)));
    });

    it('correctly rules out positions from other scripts', () => {
      const model = new SDK.DebuggerModel.DebuggerModel(createTarget());
      const range = new SDK.DebuggerModel.LocationRange(model, 'script:1', 0, 0, 9, 0);
      assert.isFalse(range.contains(new SDK.DebuggerModel.Location(model, 'script:2', 1, 1)));
      assert.isFalse(range.contains(new SDK.DebuggerModel.Location(model, 'script:3', 1, 1)));
    });

    it('correctly handles positions in the same script', () => {
      const model = new SDK.DebuggerModel.DebuggerModel(createTarget());
      const range = new SDK.DebuggerModel.LocationRange(model, 'script:1', 1, 1, 6, 6);
      assert.isFalse(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 1, 0)));
      assert.isFalse(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 0, 1)));
      assert.isTrue(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 1, 1)));
      assert.isTrue(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 2, 0)));
      assert.isTrue(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 6, 6)));
      assert.isFalse(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 6, 7)));
      assert.isFalse(range.contains(new SDK.DebuggerModel.Location(model, 'script:1', 7, 0)));
    });
  });
});
