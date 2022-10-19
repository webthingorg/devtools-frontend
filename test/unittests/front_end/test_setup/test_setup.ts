// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * This file is automatically loaded and run by Karma because it automatically
 * loads and injects all *.js files it finds.
 */
import type * as Common from '../../../../front_end/core/common/common.js';
import * as ThemeSupport from '../../../../front_end/ui/legacy/theme_support/theme_support.js';
// import * as Coordinator from '../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
// import * as Formatter from '../../../../front_end/models/formatter/formatter.js';
// import {assertNotNullOrUndefined} from '../../../../front_end/core/platform/platform.js';
import {resetTestDOM} from '../helpers/DOMHelpers.js';
import {markStaticTestsLoaded} from '../helpers/RealConnection.js';

beforeEach(resetTestDOM);

type PendingAsyncActivity = {
  cancelDelayed?: {(): void},
  id?: number,
  runImmediate?: {(): void}, stack: string,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  promise?: Promise<any>, pending: boolean,
};
const pendingAsyncActivity: PendingAsyncActivity[] = [];

function getStack(): string {
  return ((new Error()).stack ?? 'No stack').split('\n').slice(3).join('\n');
}

before(async function() {
  /* Larger than normal timeout because we've seen some slowness on the bots */
  this.timeout(10000);
  // @ts-ignore
  markStaticTestsLoaded({hasOnly: this.test.parent.hasOnly()});
});

type Stub<TKey extends keyof typeof window, T extends(typeof window)[TKey]> = {
  name: keyof typeof window,
  original: T,
  stubWith: T,
};
/* eslint-disable @typescript-eslint/no-explicit-any */
const stubs: Stub<any, any>[] = [];

function stub<T extends keyof typeof window>(name: T, stubWith: (typeof window)[T]) {
  const original = window[name];
  window[name] = stubWith;
  stubs.push({name, original, stubWith});
}

function original<T>(stubWith: T): T {
  // return stubWith;
  return stubs.find(s => s.stubWith === stubWith)?.original;
}

function restoreAll() {
  for (const {name, original} of stubs) {
    // @ts-ignore
    window[name] = original;
  }
  stubs.length = 0;
}

afterEach(async () => {
  await Promise.all([
    // Formatter.FormatterWorkerPool.FormatterWorkerPool.done(),
    // Coordinator.RenderCoordinator.RenderCoordinator.done()
  ]);
  let wait = 5;
  let retries = 5;
  for (;;) {
    const pendingCount = pendingAsyncActivity.filter(a => a.pending).length;
    const totalCount = pendingAsyncActivity.length;
    try {
      await original(Promise).all(pendingAsyncActivity.filter(a => a.pending).map(a => original(Promise).race([
        a.promise,
        new (original(Promise))(
            (_, reject) => original(setTimeout)(
                /* async*/
                () => {
                  if (!a.pending) {
                    return;
                  }
                  if (a.cancelDelayed && a.runImmediate) {
                    a.cancelDelayed();
                    /* await*/ a.runImmediate();
                  } else {
                    const error = new Error(
                        'The test has completed, but there is still a pending promise, created at: \n' + a.stack);
                    reject(error);
                  }
                },
                wait)),
      ])));

      const stillPending = pendingAsyncActivity.find(a => a.pending);
      // console.error('stillPending: ' + !!stillPending + ', retries: ' + retries);
      if (!stillPending) {
        break;
      } else if (--retries === 0) {
        throw new Error(
            'The test has completed, but there is still a pending promise, created at: \n' + stillPending.stack);
      }
    } catch (e) {
      const newPendingCount = pendingAsyncActivity.filter(a => a.pending).length;
      const newTotalCount = pendingAsyncActivity.length;
      // console.error(`newTotalCount: ${newTotalCount}, totalCount: ${totalCount}, newPendingCount: ${newPendingCount}, pendingCount: ${pendingCount}, wait: ${wait}`);
      if (newTotalCount === totalCount && newPendingCount === pendingCount && --retries === 0) {
        throw e;
      }
    } finally {
      // console.error(JSON.stringify(pendingAsyncActivity));
      wait *= 2;
    }
  }
  pendingAsyncActivity.length = 0;
  // Clear out any Sinon stubs or spies between individual tests.
  sinon.restore();
  restoreAll();
});

beforeEach(() => {
  // Some unit tests exercise code that assumes a ThemeSupport instance is available.
  // Run this in a beforeEach in case an individual test overrides it.
  const setting = {
    get() {
      return 'default';
    },
  } as Common.Settings.Setting<string>;
  ThemeSupport.ThemeSupport.instance({forceNew: true, setting});

  stub('requestAnimationFrame', (fn: FrameRequestCallback) => {
    const activity: PendingAsyncActivity = {stack: getStack(), pending: true};
    let id = 0;
    activity.promise = new (original(Promise))(resolve => {
      activity.runImmediate = /* async*/ () => {
        /* await*/ fn(performance.now());
        activity.pending = false;
        resolve(null);
      };
      id = original(requestAnimationFrame)(activity.runImmediate);
      activity.id = id;
      activity.cancelDelayed = () => {
        original(cancelAnimationFrame)(id);
        activity.pending = false;
        resolve(null);
      };
    });
    pendingAsyncActivity.push(activity);
    return id;
  });

  stub('setTimeout', (arg, time, ...params) => {
    const activity: PendingAsyncActivity = {
      stack: getStack(),
      pending: true,
    };
    let id = 0;
    activity.promise = new (original(Promise))(resolve => {
      activity.runImmediate = /* async*/ () => {
        if (typeof (arg) === 'function') {
          arg(...params);
        } else {
          eval(arg);
        }
        activity.pending = false;
        resolve(null);
      };
      id = original(setTimeout)(activity.runImmediate, time);
      activity.id = id;
      activity.cancelDelayed = () => {
        original(clearTimeout)(id);
        activity.pending = false;
        resolve(null);
      };
    });
    pendingAsyncActivity.push(activity);
    return id;
  });

  const cancel = (id?: number) => {
    const activity = pendingAsyncActivity.find(a => a.id === id);
    if (activity?.cancelDelayed) {
      activity.cancelDelayed();
    }
  };
  stub('cancelAnimationFrame', id => cancel(id));
  stub('clearTimeout', id => cancel(id));
  stub('setInterval', (_1, _2) => {
    assert.fail();
  });
  // @ts-ignore
  const TrackingPromise: PromiseConstructor = function<T>(
      /* eslint-disable @typescript-eslint/no-explicit-any */
      arg: (resolve: (value: T|PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T> {
    const promise = new (original(Promise))(arg);
    const activity: PendingAsyncActivity = {
      promise: promise.then(
          () => {
            activity.pending = false;
          },
          () => {
            activity.pending = false;
          }),
      stack: getStack(),
      pending: false,
    };
    // @ts-ignore
    promise.then = function(onFullfilled, onRejected) {
      activity.pending = true;
      return original(Promise).prototype.then.apply(
          this,  // [onFullfilled, onRejected]);
          [
            result => {
              if (!onFullfilled) {
                return this;
              }
              activity.pending = false;
              return onFullfilled(result);
            },
            result => {
              if (!onRejected) {
                return this;
              }
              activity.pending = false;
              return onRejected(result);
            },
          ]);
    };

    pendingAsyncActivity.push(activity);
    return promise;
  };
  for (const name of ['all', 'allSettled', 'any', 'race', 'reject', 'resolve']) {
    // @ts-ignore
    TrackingPromise[name] = Promise[name];
  }
  stub('Promise', TrackingPromise);
  // // sinon.replace(window, 'Promise', TrackingPromise);
});
