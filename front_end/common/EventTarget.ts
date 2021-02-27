/* eslint-disable rulesdir/no_underscored_properties */

export interface EventDescriptor {
  eventTarget: EventTarget;
  eventType: string | symbol;
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

/**
 * @interface
 */
export interface EventTarget {
  addEventListener(eventType: string | symbol, listener: (arg0: EventTargetEvent) => void, thisObject?: Object): EventDescriptor;

  once(eventType: string | symbol): Promise<any>;

  removeEventListener(eventType: string | symbol, listener: (arg0: EventTargetEvent) => void, thisObject?: Object): void;

  hasEventListeners(eventType: string | symbol): boolean;

  dispatchEventToListeners(eventType: string | symbol, eventData?: any): void;
}

EventTarget.removeEventListeners = removeEventListeners;

export function fireEvent(name: string, detail: any = {}, target: HTMLElement | Window = window): void {
  const evt = new CustomEvent(name, { bubbles: true, cancelable: true, detail });
  target.dispatchEvent(evt);
}
export interface EventTargetEvent {
  data: any;
}
