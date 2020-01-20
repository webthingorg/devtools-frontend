// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {join} from 'path';
import * as puppeteer from 'puppeteer';

interface Pages {
  target: puppeteer.Page;
  frontend: puppeteer.Page;
}

const targetPage = Symbol('TargetPage');
const frontEndPage = Symbol('DevToolsPage');

export let resetPages: () => void;

const flatten =
    async () => {
  if (!global[frontEndPage]) {
    throw new Error('Unable to locate DevTools frontend page. Was it stored first?');
  }

  const frontend: puppeteer.Page = global[frontEndPage];
  return frontend.evaluate(() => {
    const container = (self as any);
    if (container.__elements) {
      return container.__elements;
    }

    container.__elements = [];
    const collect =
        function(root: HTMLElement|ShadowRoot = document.body) {
      const walker = document.createTreeWalker(root);
      do {
        const currentNode = walker.currentNode as HTMLElement;
        container.__elements.push(currentNode);
        if (currentNode.shadowRoot) {
          collect(currentNode.shadowRoot);
        }
      } while (walker.nextNode())
    }

    collect(document.body);
  });
}

export const getElementLocation =
    async ({id, className}: {id?: string, className?: string}) => {
  if (!global[frontEndPage]) {
    throw new Error('Unable to locate DevTools frontend page. Was it stored first?');
  }

  const frontend: puppeteer.Page = global[frontEndPage];

  if (!id && !className) {
    return null;
  }

  // Make sure all elements are flattened in the target document.
  await flatten();

  return frontend.evaluate((targetId, targetClassName) => {
    const container = (self as any);
    if (!container.__elements) {
      return null;
    }

    const target = container.__elements.find(el => {
      if (el.id === targetId) {
        return el;
      }

      if (('classList' in el) && el.classList.contains(targetClassName)) {
        return el;
      }
    });

    if (!target) {
      return null;
    }

    // Extract the location values.
    const {left, top, width, height} = target.getBoundingClientRect();
    return {x: left + width * 0.5, y: top + height * 0.5};
  }, id, className);
}

export function store(target, frontend, reset) {
  global[targetPage] = target;
  global[frontEndPage] = frontend;
  resetPages = reset;
}

export function
getPages():
    Pages {
      if (!global[targetPage]) {
        throw new Error('Unable to locate target page. Was it stored first?');
      }

      if (!global[frontEndPage]) {
        throw new Error('Unable to locate DevTools frontend page. Was it stored first?');
      }

      return {
        target: global[targetPage], frontend: global[frontEndPage]
      }
    }

export const resourcesPath = `file://${join(__dirname, 'resources')}`;
