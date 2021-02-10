// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as HeapSnapshotModel from '../heap_snapshot_model/heap_snapshot_model.js'; // eslint-disable-line no-unused-vars
// Transformation: updateInterfaceDeclarations

/**
 * @interface
 */
// Transformation: updatePropertyDeclarations
export interface ChildrenProvider {
  // Transformation: updateReturnType
  // Transformation: updateParameters
  dispose(): void;

  // Transformation: updateReturnType
  // Transformation: updateParameters
  nodePosition(snapshotObjectId: number): Promise<number>;

  // Transformation: updateReturnType
  // Transformation: updateParameters
  isEmpty(): Promise<boolean>;

  // Transformation: updateReturnType
  // Transformation: updateParameters
  serializeItemsRange(startPosition: number, endPosition: number): Promise<HeapSnapshotModel.HeapSnapshotModel.ItemsRange>;

  // Transformation: updateReturnType
  // Transformation: updateParameters
  sortAndRewind(comparator: HeapSnapshotModel.HeapSnapshotModel.ComparatorConfig): Promise<any>;
}
