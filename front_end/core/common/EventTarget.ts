// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface EventDescriptor<Events = any> {
  eventTarget: EventTarget<Events>;
  eventType: keyof Events|string|symbol;
  thisObject?: Object;
  listener: (arg0: EventTargetEvent<Events[keyof Events]|any>) => void;
}

export function removeEventListeners(eventList: EventDescriptor<unknown>[]): void {
  for (const eventInfo of eventList) {
    eventInfo.eventTarget.removeEventListener(eventInfo.eventType, eventInfo.listener, eventInfo.thisObject);
  }
  // Do not hold references on unused event descriptors.
  eventList.splice(0);
}

export type EventType<Events> = Events extends Object ? keyof Events : string|symbol;
export type EventPayload<Events, T> = T extends keyof Events ? Events[T] : any;

export interface EventTarget<Events = any> {
  addEventListener<T extends EventType<Events>>(
      eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void,
      thisObject?: Object): EventDescriptor<Events>;
  once<T extends EventType<Events>>(eventType: T): Promise<EventPayload<Events, T>>;
  removeEventListener<T extends EventType<Events>>(
      eventType: T, listener: (arg0: EventTargetEvent<EventPayload<Events, T>>) => void, thisObject?: Object): void;
  hasEventListeners<T extends EventType<Events>>(eventType: T): boolean;
  dispatchEventToListeners<T extends EventType<Events>>(eventType: T, eventData?: EventPayload<Events, T>): void;
}

export function fireEvent(name: string, detail: Object = {}, target: HTMLElement|Window = window): void {
  const evt = new CustomEvent(name, {bubbles: true, cancelable: true, detail});
  target.dispatchEvent(evt);
}
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventTargetEvent<T = any> {
  data: T;
}
