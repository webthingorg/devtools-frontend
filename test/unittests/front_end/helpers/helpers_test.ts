// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

const TEST_CONTAINER_ID = '__devtools-test-container-id';

interface RenderOptions {
  allowMultipleChildren?: boolean
}

export const renderElementIntoDOM = (element: HTMLElement, renderOptions: RenderOptions = {}) => {
  const container = document.getElementById(TEST_CONTAINER_ID);

  if (!container) {
    assert.fail(`renderIntoDOM expected to find ${TEST_CONTAINER_ID}`);
    return;
  }

  const allowMultipleChildren = !!renderOptions.allowMultipleChildren;

  if (container.childNodes.length !== 0 && !allowMultipleChildren) {
    assert.fail('renderIntoDOM expects the container to be empty');
    return;
  }

  container.appendChild(element);
  return element;
};

export const resetTestDOM = () => {
  const previousContainer = document.getElementById(TEST_CONTAINER_ID);
  if (previousContainer) {
    previousContainer.remove();
  }

  const newContainer = document.createElement('div');
  newContainer.id = TEST_CONTAINER_ID;

  document.body.appendChild(newContainer);
};

export const assertNotNull = <T>(val: T): asserts val is NonNullable<T> => {
  if (!val) {
    assert.fail('Expected thing to be not null but it was');
  }
};

export const assertShadowRoot = (shadowRoot: ShadowRoot|null): asserts shadowRoot is ShadowRoot => {
  if (!shadowRoot) {
    assert.fail('Expected shadowRoot to exist');
  }
};
