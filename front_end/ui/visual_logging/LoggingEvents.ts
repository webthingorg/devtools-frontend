// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import {assertNotNullOrUndefined} from '../../core/platform/platform.js';

import {type Loggable} from './Loggable.js';
import {getLoggingState} from './LoggingState.js';

async function contextAsNumber(context: string|undefined): Promise<number|undefined> {
  if (typeof context === 'undefined') {
    return undefined;
  }
  const number = parseInt(context, 10);
  if (!isNaN(number)) {
    return number;
  }
  if (!crypto.subtle) {
    // Layout tests run in an insecure context where crypto.subtle is not available.
    return 0xDEADBEEF;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(context);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return new DataView(digest).getUint32(0, true);
}

export async function logImpressions(loggables: Loggable[]): Promise<void> {
  const impressions = await Promise.all(loggables.map(async loggable => {
    const loggingState = getLoggingState(loggable);
    assertNotNullOrUndefined(loggingState);
    const impression:
        Host.InspectorFrontendHostAPI.VisualElementImpression = {id: loggingState.veid, type: loggingState.config.ve};
    if (loggingState.parent) {
      impression.parent = loggingState.parent.veid;
    }
    const context = await contextAsNumber(loggingState.config.context);
    if (context) {
      impression.context = context;
    }
    if (loggingState.size) {
      impression.width = loggingState.size.width;
      impression.height = loggingState.size.height;
    }
    return impression;
  }));
  if (impressions.length) {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordImpression({impressions});
  }
}

export function logResize(loggable: Loggable, size: DOMRect, resizeLogThrottler?: Common.Throttler.Throttler): void {
  const loggingState = getLoggingState(loggable);
  if (!loggingState) {
    return;
  }
  loggingState.size = size;
  const resizeEvent: Host.InspectorFrontendHostAPI
      .ResizeEvent = {veid: loggingState.veid, width: loggingState.size.width, height: loggingState.size.height};
  if (resizeLogThrottler) {
    void resizeLogThrottler.schedule(async () => {
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordResize(resizeEvent);
    });
  } else {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordResize(resizeEvent);
  }
}

export async function logClick(loggable: Loggable, event: Event, options?: {doubleClick?: boolean}): Promise<void> {
  const loggingState = getLoggingState(loggable);
  if (!loggingState) {
    return;
  }
  const button = event instanceof MouseEvent && 'sourceCapabilities' in event ? event.button : -1;
  const clickEvent: Host.InspectorFrontendHostAPI
      .ClickEvent = {veid: loggingState.veid, mouseButton: button, doubleClick: Boolean(options?.doubleClick)};
  const context = await contextAsNumber(loggingState.config.context);
  if (context) {
    clickEvent.context = context;
  }
  Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordClick(clickEvent);
}

export const logHover = (hoverLogThrottler: Common.Throttler.Throttler) => async (event: Event) => {
  const loggingState = getLoggingState(event.currentTarget as Element);
  assertNotNullOrUndefined(loggingState);
  const hoverEvent: Host.InspectorFrontendHostAPI.HoverEvent = {veid: loggingState.veid};
  const contextPromise = contextAsNumber(loggingState.config.context);
  await hoverLogThrottler.schedule(async () => {
    const context = await contextPromise;
    if (context) {
      hoverEvent.context = context;
    }
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordHover(hoverEvent);
  });
};

export const logDrag = (dragLogThrottler: Common.Throttler.Throttler) => async (event: Event) => {
  const loggingState = getLoggingState(event.currentTarget as Element);
  assertNotNullOrUndefined(loggingState);
  const dragEvent: Host.InspectorFrontendHostAPI.DragEvent = {veid: loggingState.veid};
  const contextPromise = contextAsNumber(loggingState.config.context);
  await dragLogThrottler.schedule(async () => {
    const context = await contextPromise;
    if (context) {
      dragEvent.context = context;
    }
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordDrag(dragEvent);
  });
};

export async function logChange(event: Event): Promise<void> {
  const loggingState = getLoggingState(event.currentTarget as Element);
  assertNotNullOrUndefined(loggingState);
  const changeEvent: Host.InspectorFrontendHostAPI.ChangeEvent = {veid: loggingState.veid};
  const context = await contextAsNumber(loggingState.config.context);
  if (context) {
    changeEvent.context = context;
  }
  Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordChange(changeEvent);
}

export async function logKeyDown(
    event: Event|null, context?: string, codes?: string[],
    keyboardLogThrottler?: Common.Throttler.Throttler): Promise<void> {
  if (!(event instanceof KeyboardEvent)) {
    return;
  }
  if (codes?.length && !codes.includes(event.code)) {
    return;
  }
  const loggingState = getLoggingState(event.currentTarget as Element);
  const keyDownEvent: Host.InspectorFrontendHostAPI.KeyDownEvent = {veid: loggingState?.veid};
  const contextNumber = await contextAsNumber(context || loggingState?.config.context);
  if (contextNumber) {
    keyDownEvent.context = contextNumber;
  }
  if (keyboardLogThrottler) {
    await keyboardLogThrottler.schedule(async () => {
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordKeyDown(keyDownEvent);
    });
  } else {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.recordKeyDown(keyDownEvent);
  }
}
