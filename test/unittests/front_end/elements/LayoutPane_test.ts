// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {LayoutPane} from '../../../../front_end/elements/LayoutPane.js';
import {assertShadowRoot, renderElementIntoDOM} from '../helpers/DOMHelpers.js';

const {assert} = chai;

describe('LayoutPane', () => {
  it('renders settings', async () => {
    const component = new LayoutPane();
    renderElementIntoDOM(component);

    component.data = {
      settings: [
        {
          name: 'booleanSetting',
          type: 'boolean',
          value: false,
          title: 'Boolean setting title',
          options: [
            {
              title: 'Set true',
              value: true,
            },
            {
              title: 'Set false',
              value: false,
            },
          ],
        },
        {
          name: 'enumSetting',
          type: 'enum',
          value: 'both',
          title: 'Enum setting title',
          options: [
            {
              title: 'Set both',
              value: 'both',
            },
            {
              title: 'Set none',
              value: 'none',
            },
          ],
        },
      ],
      theme: 'light',
    };

    function getSettings(selector: string) {
      assertShadowRoot(component.shadowRoot);
      return Array.from(component.shadowRoot.querySelectorAll(selector)).map(setting => {
        return {
          label: setting.querySelector('[data-label]')!.textContent,
          input: setting.querySelector('[data-input]')!.tagName,
        };
      });
    }

    assert.deepEqual(getSettings('[data-enum-setting]'), [{label: 'Enum setting title', input: 'SELECT'}]);
    assert.deepEqual(getSettings('[data-boolean-setting]'), [{label: 'Boolean setting title', input: 'INPUT'}]);
  });

  it('sends event when a setting is changed', async () => {
    const component = new LayoutPane();
    renderElementIntoDOM(component);

    component.data = {
      settings: [
        {
          name: 'booleanSetting',
          type: 'boolean',
          value: false,
          title: 'Boolean setting title',
          options: [
            {
              title: 'Set true',
              value: true,
            },
            {
              title: 'Set false',
              value: false,
            },
          ],
        },
      ],
      theme: 'light',
    };

    assertShadowRoot(component.shadowRoot);

    const input = component.shadowRoot.querySelector('[data-input]') as HTMLInputElement;

    const eventPromise = new Promise(resolve => {
      component.addEventListener('setting-changed', event => {
        resolve(event);
      }, false);
    });

    input.click();

    await eventPromise;
  });
});
