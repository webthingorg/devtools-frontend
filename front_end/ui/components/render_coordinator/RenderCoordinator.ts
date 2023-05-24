// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Components don't orchestrate their DOM updates in a wider context
 * (i.e. the host frame's document), which leads to interleaved reading
 * and writing of layout-centric values, e.g. clientHeight, scrollTop etc.
 *
 * This helper to ensure that we do reads, writes, and scrolls at the
 * correct point in the frame lifecycle. It groups reads to the start of a
 * frame, where we can assume layout-centric values are available on the
 * basis of the last completed frame, and then it runs all writes
 * afterwards. In the event that a read / write / scroll callback contains
 * calls for more read / write / scroll calls, such calls will be scheduled
 * for the next available frame.
 */

interface CoordinatorCallback {
  (): unknown;
}

interface Work {
  trigger: () => void;
  cancel: (_: Error) => void;
  promise: Promise<unknown>;
  handler: CoordinatorCallback;
}

interface CoordinatorFrame {
  readers: Map<string, Work>;
  writers: Map<string, Work>;
}

interface CoordinatorLogEntry {
  time: number;
  value: string;
}

const enum ACTION {
  READ = 'read',
  WRITE = 'write',
}

export class RenderCoordinatorQueueEmptyEvent extends Event {
  static readonly eventName = 'renderqueueempty';
  constructor() {
    super(RenderCoordinatorQueueEmptyEvent.eventName);
  }
}

export class RenderCoordinatorNewFrameEvent extends Event {
  static readonly eventName = 'newframe';
  constructor() {
    super(RenderCoordinatorNewFrameEvent.eventName);
  }
}

let renderCoordinatorInstance: RenderCoordinator;

const UNNAMED_READ = 'Unnamed read';
const UNNAMED_WRITE = 'Unnamed write';
const UNNAMED_SCROLL = 'Unnamed scroll';
const DEADLOCK_TIMEOUT = 1500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__getRenderCoordinatorPendingFrames = function(): number {
  return RenderCoordinator.pendingFramesCount();
};

export class RenderCoordinator extends EventTarget {
  static instance({forceNew = false} = {}): RenderCoordinator {
    if (!renderCoordinatorInstance || forceNew) {
      renderCoordinatorInstance = new RenderCoordinator();
    }

    return renderCoordinatorInstance;
  }

  static pendingFramesCount(): number {
    if (!renderCoordinatorInstance) {
      throw new Error('No render coordinator instance found.');
    }

    return renderCoordinatorInstance.pendingFramesCount();
  }

  // Toggle on to start tracking. You must call takeRecords() to
  // obtain the records. Please note: records are limited by maxRecordSize below.
  observe = false;
  recordStorageLimit = 100;

  // If true, only log activity with an explicit label.
  // This does not affect logging frames or queue empty events.
  observeOnlyNamed = true;

  readonly #logInternal: CoordinatorLogEntry[] = [];

  readonly #pendingWorkFrames: CoordinatorFrame[] = [];
  #scheduledWorkId = 0;
  #unnamedId = 0;

  pendingFramesCount(): number {
    return this.#pendingWorkFrames.length;
  }

  done(options?: {waitForWork: boolean}): Promise<void> {
    if (this.#pendingWorkFrames.length === 0 && !options?.waitForWork) {
      this.#logIfEnabled('[Queue empty]');
      return Promise.resolve();
    }
    return new Promise(resolve => this.addEventListener('renderqueueempty', () => resolve(), {once: true}));
  }

  async read<T extends unknown>(callback: CoordinatorCallback): Promise<T>;
  async read<T extends unknown>(label: string, callback: CoordinatorCallback): Promise<T>;
  async read<T extends unknown>(labelOrCallback: CoordinatorCallback|string, callback?: CoordinatorCallback):
      Promise<T> {
    if (typeof labelOrCallback === 'string') {
      if (!callback) {
        throw new Error('Read called with label but no callback');
      }
      return this.#enqueueHandler<T>(callback, ACTION.READ, labelOrCallback);
    }

    return this.#enqueueHandler<T>(labelOrCallback, ACTION.READ, `${++this.#unnamedId} ${UNNAMED_READ}`);
  }

  async write<T extends unknown>(callback: CoordinatorCallback): Promise<T>;
  async write<T extends unknown>(label: string, callback: CoordinatorCallback): Promise<T>;
  async write<T extends unknown>(labelOrCallback: CoordinatorCallback|string, callback?: CoordinatorCallback):
      Promise<T> {
    if (typeof labelOrCallback === 'string') {
      if (!callback) {
        throw new Error('Write called with label but no callback');
      }
      return this.#enqueueHandler<T>(callback, ACTION.WRITE, labelOrCallback);
    }

    return this.#enqueueHandler<T>(labelOrCallback, ACTION.WRITE, `${++this.#unnamedId} ${UNNAMED_WRITE}`);
  }

  takeRecords(): CoordinatorLogEntry[] {
    const logs = [...this.#logInternal];
    this.#logInternal.length = 0;
    return logs;
  }

  /**
   * We offer a convenience function for scroll-based activity, but often triggering a scroll
   * requires a layout pass, thus it is better handled as a read activity, i.e. we wait until
   * the layout-triggering work has been completed then it should be possible to scroll without
   * first forcing layout.
   */
  async scroll<T extends unknown>(callback: CoordinatorCallback): Promise<T>;
  async scroll<T extends unknown>(label: string, callback: CoordinatorCallback): Promise<T>;
  async scroll<T extends unknown>(labelOrCallback: CoordinatorCallback|string, callback?: CoordinatorCallback):
      Promise<T> {
    if (typeof labelOrCallback === 'string') {
      if (!callback) {
        throw new Error('Scroll called with label but no callback');
      }
      return this.#enqueueHandler<T>(callback, ACTION.READ, labelOrCallback);
    }

    return this.#enqueueHandler<T>(labelOrCallback, ACTION.READ, `${++this.#unnamedId} ${UNNAMED_SCROLL}`);
  }

  #enqueueHandler<T = unknown>(callback: CoordinatorCallback, action: ACTION, label: string): Promise<T> {
    label = `${action === ACTION.READ ? '[Read]' : '[Write]'}: ${label}`;
    if (this.#pendingWorkFrames.length === 0) {
      this.#pendingWorkFrames.push({
        readers: new Map(),
        writers: new Map(),
      });
    }

    const frame = this.#pendingWorkFrames[0];
    if (!frame) {
      throw new Error('No frame available');
    }

    let map = null;
    switch (action) {
      case ACTION.READ:
        map = frame.readers;
        break;

      case ACTION.WRITE:
        map = frame.writers;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (!map.has(label)) {
      const work = {} as Work;
      work.promise = (new Promise<void>((resolve, reject) => {
                       work.trigger = resolve;
                       work.cancel = reject;
                     })).then(() => work.handler());
      map.set(label, work);
    }
    const work = map.get(label) as Work;
    work.handler = callback;

    this.#scheduleWork();
    return work.promise as Promise<T>;
  }

  #scheduleWork(): void {
    const hasScheduledWork = this.#scheduledWorkId !== 0;
    if (hasScheduledWork) {
      return;
    }

    this.#scheduledWorkId = requestAnimationFrame(async () => {
      const hasPendingFrames = this.#pendingWorkFrames.length > 0;
      if (!hasPendingFrames) {
        // No pending frames means all pending work has completed.
        // The events dispatched below are mostly for testing contexts.
        // The first is for cases where we have a direct reference to
        // the render coordinator. The second is for other test contexts
        // where we don't, and instead we listen for an event on the window.
        this.dispatchEvent(new RenderCoordinatorQueueEmptyEvent());
        window.dispatchEvent(new RenderCoordinatorQueueEmptyEvent());

        this.#logIfEnabled('[Queue empty]');
        this.#scheduledWorkId = 0;
        return;
      }

      this.dispatchEvent(new RenderCoordinatorNewFrameEvent());
      this.#logIfEnabled('[New frame]');

      const frame = this.#pendingWorkFrames.shift();
      if (!frame) {
        return;
      }

      // Start with all the readers and allow them
      // to proceed together.
      for (const [label, reader] of frame.readers) {
        this.#logIfEnabled(label);
        reader.trigger();
      }

      // Wait for them all to be done.
      try {
        await Promise.race([
          Promise.all([...frame.readers].map(r => r[1].promise)),
          new Promise((_, reject) => {
            window.setTimeout(
                () => reject(new Error(`Readers took over ${DEADLOCK_TIMEOUT}ms. Possible deadlock?`)),
                DEADLOCK_TIMEOUT);
          }),
        ]);
      } catch (err) {
        this.#rejectAll(frame.readers, err);
      }

      // Next do all the writers as a block.
      for (const [label, writer] of frame.writers) {
        this.#logIfEnabled(label);
        writer.trigger();
      }

      // And wait for them to be done, too.
      try {
        await Promise.race([
          Promise.all([...frame.writers].map(w => w[1].promise)),
          new Promise((_, reject) => {
            window.setTimeout(
                () => reject(new Error(`Writers took over ${DEADLOCK_TIMEOUT}ms. Possible deadlock?`)),
                DEADLOCK_TIMEOUT);
          }),
        ]);
      } catch (err) {
        this.#rejectAll(frame.writers, err);
      }

      // Since there may have been more work requested in
      // the callback of a reader / writer, we attempt to schedule
      // it at this point.
      this.#scheduledWorkId = 0;
      this.#scheduleWork();
    });
  }

  #rejectAll(handlers: Map<string, Work>, error: Error): void {
    for (const handler of handlers.values()) {
      handler.cancel(error);
    }
  }

  cancelPending(): void {
    const error = new Error();
    for (const frame of this.#pendingWorkFrames) {
      this.#rejectAll(frame.readers, error);
      this.#rejectAll(frame.writers, error);
    }
  }

  #logIfEnabled(value: string|undefined): void {
    if (!this.observe || !value) {
      return;
    }
    const hasNoName = value.endsWith(UNNAMED_READ) || value.endsWith(UNNAMED_WRITE) || value.endsWith(UNNAMED_SCROLL);
    if (hasNoName && this.observeOnlyNamed) {
      return;
    }

    this.#logInternal.push({time: performance.now(), value});

    // Keep the log at the log size.
    while (this.#logInternal.length > this.recordStorageLimit) {
      this.#logInternal.shift();
    }
  }
}
