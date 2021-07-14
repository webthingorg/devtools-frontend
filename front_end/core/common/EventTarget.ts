// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO(crbug.com/1228674) Remove defaults for generic type parameters once
//                         all event emitters and sinks have been migrated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventDescriptor<Events = unknown, T extends EventType<Events> = any> {
  eventTarget: EventTarget<Events>;
  eventType: T;
  thisObject?: Object;
  listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void;
}

export function removeEventListeners(eventList: EventDescriptor[]): void {
  for (const eventInfo of eventList) {
    eventInfo.eventTarget.removeEventListener(eventInfo.eventType, eventInfo.listener, eventInfo.thisObject);
  }
  // Do not hold references on unused event descriptors.
  eventList.splice(0);
}

export type EventType<Events> = Events extends Object ? keyof Events : string|symbol;
export type EventPayload<Events, T> = T extends keyof Events ? Events[T] : unknown;

// TODO(crbug.com/1228674) Remove defaults for generic type parameters once
//                         all event emitters and sinks have been migrated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventTarget<Events = any> {
  addEventListener<T extends EventType<Events>>(
      eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void,
      thisObject?: Object): EventDescriptor<Events, T>;
  once<T extends EventType<Events>>(eventType: T): Promise<EventPayload<Events, T>>;
  removeEventListener<T extends EventType<Events>>(
      eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void, thisObject?: Object): void;
  hasEventListeners(eventType: EventType<Events>): boolean;
  dispatchEventToListeners<T extends EventType<Events>>(eventType: T, eventData?: EventPayload<Events, T>): void;
}

export function fireEvent(name: string, detail: unknown = {}, target: HTMLElement|Window = window): void {
  const evt = new CustomEvent(name, {bubbles: true, cancelable: true, detail});
  target.dispatchEvent(evt);
}
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventTargetEvent<T = any> {
  data: T;
}
