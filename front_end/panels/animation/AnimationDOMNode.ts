// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';

const REPORT_SCROLL_POSITION_BINDING_NAME = '__devtools_report_scroll_position__';
const SCROLL_LISTENER_NAME_IN_PAGE = (id: string): string => `__devtools_scroll_listener_${id}__`;

type ScrollListener = (param: {scrollLeft: number, scrollTop: number}) => void;

export class AnimationDOMNode {
  #domNode: SDK.DOMModel.DOMNode;
  #scrollListenersById: Map<string, ScrollListener>;
  #scrollBindingListener?:
      (ev: Common.EventTarget.EventTargetEvent<Protocol.Runtime.BindingCalledEvent, SDK.RuntimeModel.EventTypes>) =>
          void;
  constructor(domNode: SDK.DOMModel.DOMNode) {
    this.#domNode = domNode;
    this.#scrollListenersById = new Map();
  }

  async #addReportScrollPositionBinding(): Promise<void> {
    const object = await this.#domNode.resolveToObject();
    if (!object) {
      return;
    }

    this.#scrollBindingListener =
        (ev: Common.EventTarget.EventTargetEvent<Protocol.Runtime.BindingCalledEvent, SDK.RuntimeModel.EventTypes>):
            void => {
              const {name, payload} = ev.data;
              if (name !== REPORT_SCROLL_POSITION_BINDING_NAME) {
                return;
              }

              const {scrollTop, scrollLeft, id} =
                  JSON.parse(payload) as {scrollTop: number, scrollLeft: number, id: string};
              const scrollListener = this.#scrollListenersById.get(id);
              if (!scrollListener) {
                return;
              }

              scrollListener({scrollTop, scrollLeft});
            };

    await object.runtimeModel().addBinding({
      name: REPORT_SCROLL_POSITION_BINDING_NAME,
    });
    object.runtimeModel().addEventListener(SDK.RuntimeModel.Events.BindingCalled, this.#scrollBindingListener);
    object.release();
  }

  async #removeReportScrollPositionBinding(): Promise<void> {
    // There isn't any binding added yet.
    if (!this.#scrollBindingListener) {
      return;
    }

    const object = await this.#domNode.resolveToObject();
    if (!object) {
      return;
    }

    await object.runtimeModel().removeBinding({
      name: REPORT_SCROLL_POSITION_BINDING_NAME,
    });
    object.runtimeModel().removeEventListener(SDK.RuntimeModel.Events.BindingCalled, this.#scrollBindingListener);
    object.release();
    this.#scrollBindingListener = undefined;
  }

  async addScrollEventListener(onScroll: ({scrollLeft, scrollTop}: {scrollLeft: number, scrollTop: number}) => void):
      Promise<string|null> {
    const id = String(Math.random()).slice(2);
    this.#scrollListenersById.set(id, onScroll);
    // Initialize the binding for reporting scroll events from the page if it is not initialized before.
    if (!this.#scrollBindingListener) {
      await this.#addReportScrollPositionBinding();
    }

    await this.#domNode.callFunction(
        scrollListenerInPage, [id, REPORT_SCROLL_POSITION_BINDING_NAME, SCROLL_LISTENER_NAME_IN_PAGE(id)]);
    return id;

    function scrollListenerInPage(
        this: HTMLElement|Document, id: string, reportScrollPositionBindingName: string,
        scrollListenerNameInPage: string): void {
      if ('scrollingElement' in this && !this.scrollingElement) {
        return;
      }

      const scrollingElement = ('scrollingElement' in this ? this.scrollingElement : this) as HTMLElement;
      // @ts-ignore We're setting a custom field on `Element` or `Document` for retaining the function on the page.
      this[scrollListenerNameInPage] = () => {
        // @ts-ignore `reportScrollPosition` binding is injected to the page before calling the function.
        globalThis[reportScrollPositionBindingName](
            JSON.stringify({scrollTop: scrollingElement.scrollTop, scrollLeft: scrollingElement.scrollLeft, id}));
      };

      // @ts-ignore We've already defined the function used below.
      this.addEventListener('scroll', this[scrollListenerNameInPage], true);
    }
  }

  async removeScrollEventListener(id: string): Promise<void> {
    await this.#domNode.callFunction(removeScrollListenerInPage, [SCROLL_LISTENER_NAME_IN_PAGE(id)]);
    this.#scrollListenersById.delete(id);
    // There aren't any scroll listeners remained on the page
    // so we remove the binding.
    if (this.#scrollListenersById.size === 0) {
      await this.#removeReportScrollPositionBinding();
    }

    function removeScrollListenerInPage(this: HTMLElement|Document, scrollListenerNameInPage: string): void {
      // @ts-ignore We've already set this custom field while adding scroll listener.
      this.removeEventListener('scroll', this[scrollListenerNameInPage]);
      // @ts-ignore We've already set this custom field while adding scroll listener.
      delete this[scrollListenerNameInPage];
    }
  }

  async scrollTop(): Promise<number|null> {
    return this.#domNode.callFunction(scrollTopInPage);

    function scrollTopInPage(this: Element|Document): number {
      if ('scrollingElement' in this) {
        if (!this.scrollingElement) {
          return 0;
        }

        return this.scrollingElement.scrollTop;
      }
      return this.scrollTop;
    }
  }

  async scrollLeft(): Promise<number|null> {
    return this.#domNode.callFunction(scrollLeftInPage);

    function scrollLeftInPage(this: Element|Document): number {
      if ('scrollingElement' in this) {
        if (!this.scrollingElement) {
          return 0;
        }

        return this.scrollingElement.scrollLeft;
      }
      return this.scrollLeft;
    }
  }

  async setScrollTop(offset: number): Promise<void> {
    await this.#domNode.callFunction(setScrollTopInPage, [offset]);

    function setScrollTopInPage(this: Element|Document, offsetInPage: number): void {
      if ('scrollingElement' in this) {
        if (!this.scrollingElement) {
          return;
        }

        this.scrollingElement.scrollTop = offsetInPage;
      } else {
        this.scrollTop = offsetInPage;
      }
    }
  }

  async setScrollLeft(offset: number): Promise<void> {
    await this.#domNode.callFunction(setScrollLeftInPage, [offset]);

    function setScrollLeftInPage(this: Element|Document, offsetInPage: number): void {
      if ('scrollingElement' in this) {
        if (!this.scrollingElement) {
          return;
        }

        this.scrollingElement.scrollLeft = offsetInPage;
      } else {
        this.scrollLeft = offsetInPage;
      }
    }
  }

  async verticalScrollRange(): Promise<number|null> {
    return this.#domNode.callFunction(verticalScrollRangeInPage);

    function verticalScrollRangeInPage(this: Element|Document): number {
      if ('scrollingElement' in this) {
        if (!this.scrollingElement) {
          return 0;
        }

        return this.scrollingElement.scrollHeight - this.scrollingElement.clientHeight;
      }

      return this.scrollHeight - this.clientHeight;
    }
  }

  async horizontalScrollRange(): Promise<number|null> {
    return this.#domNode.callFunction(horizontalScrollRangeInPage);

    function horizontalScrollRangeInPage(this: Element|Document): number {
      if ('scrollingElement' in this) {
        if (!this.scrollingElement) {
          return 0;
        }

        return this.scrollingElement.scrollWidth - this.scrollingElement.clientWidth;
      }

      return this.scrollWidth - this.clientWidth;
    }
  }
}
