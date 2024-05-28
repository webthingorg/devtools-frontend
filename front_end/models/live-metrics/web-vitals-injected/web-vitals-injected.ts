// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as WebVitals from '../../../third_party/web-vitals/web-vitals.js';

import * as Spec from './spec/spec.js';

const {onLCP, onCLS, onINP} = WebVitals.Attribution;

declare const window: Window&{
  getNodeForIndex: (index: number) => Node | undefined,
  [Spec.EVENT_BINDING_NAME]: (payload: string) => void,
};

function sendEventToDevTools(event: Spec.WebVitalsEvent): void {
  const payload = JSON.stringify(event);
  window[Spec.EVENT_BINDING_NAME](payload);
}

const nodeList: Node[] = [];

function establishNodeIndex(node: Node): number {
  const index = nodeList.length;
  nodeList.push(node);
  return index;
}

window.getNodeForIndex = (index: number): Node|undefined => {
  return nodeList[index];
};

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function initialize(): void {
  if (inIframe()) {
    return;
  }

  sendEventToDevTools({name: 'reset'});

  onLCP(metric => {
    const event: Spec.LCPChangeEvent = {
      name: 'LCP',
      value: metric.value,
      rating: metric.rating,
    };

    const element = metric.attribution.lcpEntry?.element;
    if (element) {
      event.nodeIndex = establishNodeIndex(element);
    }
    sendEventToDevTools(event);
  }, {reportAllChanges: true});

  onCLS(metric => {
    const event: Spec.CLSChangeEvent = {
      name: 'CLS',
      value: metric.value,
      rating: metric.rating,
    };
    sendEventToDevTools(event);
  }, {reportAllChanges: true});

  onINP(metric => {
    const event: Spec.INPChangeEvent = {
      name: 'INP',
      value: metric.value,
      rating: metric.rating,
      interactionType: metric.attribution.interactionType,
    };
    const element = metric.attribution.interactionTargetElement;
    if (element) {
      event.nodeIndex = establishNodeIndex(element);
    }
    sendEventToDevTools(event);
  }, {reportAllChanges: true});
}
initialize();
