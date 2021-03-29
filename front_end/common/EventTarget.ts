// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

export interface EventDescriptor {
  eventTarget: EventTarget;
  eventType: string|symbol;
  thisObject?: Object;
  listener: (arg0: EventTargetEvent) => void;
}

export function removeEventListeners(eventList: EventDescriptor[]): void {
  for (const eventInfo of eventList) {
    eventInfo.eventTarget.removeEventListener(eventInfo.eventType, eventInfo.listener, eventInfo.thisObject);
  }
  // Do not hold references on unused event descriptors.
  eventList.splice(0);
}

export class EventTarget {
  addEventListener(_eventType: string|symbol, _listener: (arg0: EventTargetEvent) => void, _thisObject?: Object):
      EventDescriptor {
    throw new Error('not implemented');
  }

  once(_eventType: string|symbol): Promise<unknown> {
    throw new Error('not implemented');
  }

  removeEventListener(_eventType: string|symbol, _listener: (arg0: EventTargetEvent) => void, _thisObject?: Object):
      void {
    throw new Error('not implemented');
  }

  hasEventListeners(_eventType: string|symbol): boolean {
    throw new Error('not implemented');
  }

  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatchEventToListeners(_eventType: string|symbol, _eventData?: any): void {
    throw new Error('not implemented');
  }

  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static readonly removeEventListeners = removeEventListeners;
}

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fireEvent(name: string, detail: any = {}, target: HTMLElement|Window = window): void {
  const evt = new CustomEvent(name, {bubbles: true, cancelable: true, detail});
  target.dispatchEvent(evt);
}

export interface EventTargetEvent {
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
