// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

type AsyncActivity = {
  cancelDelayed?: {(): void},
  id?: string,
  runImmediate?: {(): void},
  stack?: string,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  promise?: Promise<any>, pending: boolean,
};

const asyncActivity: AsyncActivity[] = [];

function getStack(error: Error): string {
  return (error.stack ?? 'No stack').split('\n').slice(2).join('\n');
}

type Stub<TKey extends keyof typeof window> = {
  name: TKey,
  original: (typeof window)[TKey],
  stubWith: (typeof window)[TKey],
};

const stubs: Stub<keyof typeof window>[] = [];

function stub<T extends keyof typeof window>(name: T, stubWith: (typeof window)[T]) {
  const original = window[name];
  window[name] = stubWith;
  stubs.push({name, original, stubWith});
}

function original<T>(stubWith: T): T {
  return stubs.find(s => s.stubWith === stubWith)?.original;
}

function restoreAll() {
  for (const {name, original} of stubs) {
    (window[name] as typeof original) = original;
  }
  stubs.length = 0;
}

export async function checkForPendingActivity() {
  let retries = 5;
  let stillPending: AsyncActivity[] = [];
  let wait = 5;
  for (;;) {
    const pendingCount = asyncActivity.filter(a => a.pending).length;
    const totalCount = asyncActivity.length;
    try {
      await original(Promise).all(asyncActivity.filter(a => a.pending).map(a => original(Promise).race([
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
                    a.runImmediate();
                  } else {
                    reject();
                  }
                },
                wait)),
      ])));

      stillPending = asyncActivity.filter(a => a.pending);
      if (!stillPending.length) {
        break;
      } else if (--retries === 0) {
        break;
      }
    } catch (e) {
      const stillPending = asyncActivity.filter(a => a.pending);
      const newTotalCount = asyncActivity.length;
      if (newTotalCount === totalCount && stillPending.length === pendingCount && --retries === 0) {
        break;
      }
    } finally {
      wait *= 2;
    }
  }
  if (stillPending.length) {
    throw new Error(
        'The test has completed, but there are still pending promises, created at: \n' +
        stillPending.map(a => a.stack).join('\n\n'));
  }
}

export function stopTrackingAsyncActivity() {
  asyncActivity.length = 0;
  restoreAll();
}

function trackingRequestAnimationFrame(fn: FrameRequestCallback) {
  const activity: AsyncActivity = {pending: true};
  let id = 0;
  activity.promise = new (original(Promise))(resolve => {
    activity.runImmediate = () => {
      fn(performance.now());
      activity.pending = false;
      resolve(null);
    };
    id = original(requestAnimationFrame)(activity.runImmediate);
    activity.id = 'a' + id;
    activity.cancelDelayed = () => {
      original(cancelAnimationFrame)(id);
      activity.pending = false;
      resolve(null);
    };
  });
  asyncActivity.push(activity);
  return id;
}

function trackingSetTimeout(arg: TimerHandler, time?: number, ...params: any[]) {
  const activity: AsyncActivity = {
    pending: true,
  };
  let id = 0;
  activity.promise = new (original(Promise))(resolve => {
    activity.runImmediate = () => {
      if (typeof (arg) === 'function') {
        arg(...params);
      } else {
        eval(arg);
      }
      activity.pending = false;
      resolve(null);
    };
    id = original(setTimeout)(activity.runImmediate, time);
    activity.id = 't' + id;
    activity.cancelDelayed = () => {
      original(clearTimeout)(id);
      activity.pending = false;
      resolve(null);
    };
  });
  asyncActivity.push(activity);
  return id;
}

function cancelTrackingActivity(id: string) {
  const activity = asyncActivity.find(a => a.id === id);
  if (activity?.cancelDelayed) {
    activity.cancelDelayed();
  }
}

// We can't subclass native Promise here as this will cause all derived promises
// (e.g. those returned by `then`) to also be subclass instances. This results
// in a new asyncActivity entry on each iteration of checkForPendingActivity
// which never settles.
const TrackingPromise: PromiseConstructor = Object.assign(
    function<T>(
        /* e slint-disable @typescript-eslint/no-explicit-any */
        arg: (resolve: (value: T|PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
      const promise = new (original(Promise))(arg);
      const activity: AsyncActivity = {
        promise,
        stack: getStack(new Error()),
        pending: false,
      };
      promise.then = function<TResult1 = T, TResult2 = never>(
          onFullfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>)|undefined|null,
          onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>)|undefined|null): Promise<TResult1|TResult2> {
        activity.pending = true;
        return original(Promise).prototype.then.apply(this, [
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
        ]) as Promise<TResult1|TResult2>;
      };

      asyncActivity.push(activity);
      return promise;
    },
    {
      all: Promise.all,
      allSettled: Promise.allSettled,
      any: Promise.any,
      race: Promise.race,
      reject: Promise.reject,
      resolve: Promise.resolve,
    } as PromiseConstructor);

export function startTrackingAsyncActivity() {
  stub('requestAnimationFrame', trackingRequestAnimationFrame);
  stub('setTimeout', trackingSetTimeout);
  stub('cancelAnimationFrame', id => cancelTrackingActivity('a' + id));
  stub('clearTimeout', id => cancelTrackingActivity('t' + id));
  stub('setInterval', (_1, _2) => {
    assert.fail();
  });
  stub('Promise', TrackingPromise);
}
