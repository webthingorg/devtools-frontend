// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TextPrompt from '../../../../../front_end/ui/components/text_prompt/text_prompt.js';

import {assertElements, assertShadowRoot, renderElementIntoDOM} from '../../helpers/DOMHelpers.js';

const {assert} = chai;

const renderTextPrompt = (data: TextPrompt.TextPrompt.TextPromptData): TextPrompt.TextPrompt.TextPrompt => {
  const component = new TextPrompt.TextPrompt.TextPrompt();
  component.data = data;
  return component;
};

const defaultTextPromptData: TextPrompt.TextPrompt.TextPromptData = {
  prefix: 'Open',
  suggestion: 'File',
};

describe('TextPrompt', () => {
  it('renders one text prompt correctly', () => {
    const component = renderTextPrompt(defaultTextPromptData);
    renderElementIntoDOM(component);
    assertShadowRoot(component.shadowRoot);

    const textPromptPrefixs = component.shadowRoot.querySelectorAll('.prefix');
    assert.strictEqual(textPromptPrefixs.length, 1);
    assertElements(textPromptPrefixs, HTMLSpanElement);

    const textPromptInputs = component.shadowRoot.querySelectorAll('.text-prompt-input');
    assert.strictEqual(textPromptInputs.length, 1);
    assertElements(textPromptInputs, HTMLDivElement);
    assert.deepEqual(component.data, defaultTextPromptData);
  });

  describe('data setter', () => {
    it('set prefix correctly', () => {
      const component = renderTextPrompt(defaultTextPromptData);
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      component.setPrefix('Run');

      const textPromptPrefixs = component.shadowRoot.querySelectorAll('.prefix');
      assert.strictEqual(textPromptPrefixs.length, 1);
      assert.strictEqual(textPromptPrefixs[0].textContent, 'Run ');
    });
    it('set suggestion correctly', () => {
      const component = renderTextPrompt(defaultTextPromptData);
      renderElementIntoDOM(component);
      assertShadowRoot(component.shadowRoot);

      component.setSuggestion('Command');

      const textPromptInputs = component.shadowRoot.querySelectorAll('.text-prompt-input');
      assert.strictEqual(textPromptInputs.length, 1);
      assert.strictEqual(textPromptInputs[0].getAttribute('suggestion'), ' Command');
    });
  });
});
