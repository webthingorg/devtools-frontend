// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import {describeWithRealConnection} from '../../helpers/RealConnection.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';

const {assert} = chai;

describeWithRealConnection('StylesSidebarPane', async () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  it('escapes URL as CSS comments', () => {
    assert.strictEqual(Elements.StylesSidebarPane.escapeUrlAsCssComment('https://abc.com/'), 'https://abc.com/');
    assert.strictEqual(Elements.StylesSidebarPane.escapeUrlAsCssComment('https://abc.com/*/'), 'https://abc.com/*/');
    assert.strictEqual(
        Elements.StylesSidebarPane.escapeUrlAsCssComment('https://abc.com/*/?q=*'), 'https://abc.com/*/?q=*');
    assert.strictEqual(
        Elements.StylesSidebarPane.escapeUrlAsCssComment('https://abc.com/*/?q=*/'), 'https://abc.com/*/?q=*%2F');
    assert.strictEqual(
        Elements.StylesSidebarPane.escapeUrlAsCssComment('https://abc.com/*/?q=*/#hash'),
        'https://abc.com/*/?q=*%2F#hash');
  });

  describe('rebuildSectionsForMatchedStyleRulesForTest', () => {
    it('should add @position-fallback section to the end', async () => {
      const stylesSidebarPane = Elements.StylesSidebarPane.StylesSidebarPane.instance({forceNew: true});
      const matchedStyles = await SDK.CSSMatchedStyles.CSSMatchedStyles.create({
        cssModel: stylesSidebarPane.cssModel() as SDK.CSSModel.CSSModel,
        node: stylesSidebarPane.node() as SDK.DOMModel.DOMNode,
        inlinePayload: null,
        attributesPayload: null,
        matchedPayload: [],
        pseudoPayload: [],
        inheritedPayload: [],
        inheritedPseudoPayload: [],
        animationsPayload: [],
        parentLayoutNodeId: undefined,
        positionFallbackRules: [{
          name: {text: '--compass'},
          tryRules: [{
            origin: Protocol.CSS.StyleSheetOrigin.Regular,
            style: {
              cssProperties: [{name: 'bottom', value: 'anchor(--anchor-name bottom)'}],
              shorthandEntries: [],
            },
          }],
        }],
        propertyRules: [],
        cssPropertyRegistrations: [],
      });

      const sectionBlocks =
          await stylesSidebarPane.rebuildSectionsForMatchedStyleRulesForTest(matchedStyles, new Map(), new Map());

      assert.strictEqual(sectionBlocks.length, 2);
      assert.strictEqual(sectionBlocks[1].titleElement()?.textContent, '@position-fallback --compass');
      assert.strictEqual(sectionBlocks[1].sections.length, 1);
      assert.instanceOf(sectionBlocks[1].sections[0], Elements.StylePropertiesSection.TryRuleSection);
    });
  });
});

describe('IdleCallbackManager', () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  // IdleCallbackManager delegates work using requestIdleCallback, which does not generally execute requested callbacks
  // in order. This test verifies that callbacks do happen in order even if timeouts are run out.
  it('schedules callbacks in order', async () => {
    // Override the default timeout with a very short one
    class QuickIdleCallbackManager extends Elements.StylesSidebarPane.IdleCallbackManager {
      protected override scheduleIdleCallback(_: number): void {
        super.scheduleIdleCallback(1);
      }
    }

    const timeout = (time: number) => new Promise<void>(resolve => setTimeout(resolve, time));

    const elements: number[] = [];

    const callbacks = new QuickIdleCallbackManager();
    callbacks.schedule(() => elements.push(0));
    callbacks.schedule(() => elements.push(1));
    callbacks.schedule(() => elements.push(2));
    callbacks.schedule(() => elements.push(3));
    await timeout(10);
    callbacks.schedule(() => elements.push(4));
    callbacks.schedule(() => elements.push(5));
    callbacks.schedule(() => elements.push(6));
    callbacks.schedule(() => elements.push(7));
    await timeout(10);

    await callbacks.awaitDone();

    assert.deepEqual(elements, [0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
