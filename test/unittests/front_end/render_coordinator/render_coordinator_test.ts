// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as RenderCoordinator from '../../../../front_end/render_coordinator/render_coordinator.js';

describe('Render Coordinator', () => {
  it('groups interleaved reads and writes', done => {
    const expected = [
      'Read 1',
      'Read 2',
      'Read 3',
      'Write 1',
      'Write 2',
      'Write (inside Read 2)',
    ];
    const coordinator = RenderCoordinator.RenderCoordinator.RenderCoordinator.instance();
    const actual: string[] = [];

    coordinator.write(() => actual.push('Write 1'));
    coordinator.read(() => actual.push('Read 1'));
    coordinator.read(() => actual.push('Read 2'));
    coordinator.write(() => actual.push('Write 2'));
    coordinator.read(() => actual.push('Read 3'));

    coordinator.addEventListener('queueempty', () => {
      assert.deepEqual(actual, expected, 'render coordinator messages are out of order');
      done();
    });
  });

  it('handles nested reads and writes', done => {
    const expected = [
      'Read 1',
      'Read 2',
      'Write 1',
      'Write 2',
    ];
    const coordinator = RenderCoordinator.RenderCoordinator.RenderCoordinator.instance();
    const actual: string[] = [];

    coordinator.read(() => {
      actual.push('Read 1');
      coordinator.write(() => actual.push('Write 1'));
    }),

        coordinator.read(() => {
          actual.push('Read 2');
          coordinator.write(() => actual.push('Write 2'));
        }),

        coordinator.addEventListener('queueempty', () => {
          assert.deepEqual(actual, expected, 'render coordinator messages are out of order');
          done();
        });
  });
});
