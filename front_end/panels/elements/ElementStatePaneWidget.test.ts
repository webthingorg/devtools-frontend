// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable no-console */

// eslint-disable-next-line rulesdir/commented_out_import
// import type * as Protocol from '../../generated/protocol.js';
import * as SDK from '../../core/sdk/sdk.js';
import {createTarget, stubNoopSettings} from '../../testing/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
  // setMockConnectionResponseHandler,
} from '../../testing/MockConnection.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as Elements from './elements.js';

// const NODE_ID = 1 as Protocol.DOM.NodeId;

describeWithMockConnection('ElementStatePaneWidget', () => {
  let target: SDK.Target.Target;
  let view: Elements.ElementStatePaneWidget.ElementStatePaneWidget;

  beforeEach(() => {
    stubNoopSettings();
    target = createTarget();
    // setMockConnectionResponseHandler('DOM.getNodesForSubtreeByStyle', () => ({nodeIds: []}));
  });

  it('Calls the right backend functions', async () => {
    view = new Elements.ElementStatePaneWidget.ElementStatePaneWidget();

    const model = target.model(SDK.DOMModel.DOMModel);
    assert.exists(model);

    const node = new SDK.DOMModel.DOMNode(model);

    sinon.stub(node, 'nodeType').returns(Node.ELEMENT_NODE);
    sinon.stub(node, 'nodeName').returns('input');
    sinon.stub(node, 'enclosingElementOrSelf').returns(node);
    const checkboxes = sinon.spy(node.domModel().cssModel(), 'forcePseudoState');

    UI.Context.Context.instance().setFlavor(SDK.DOMModel.DOMNode, node);

    const container = view.contentElement.querySelector('.specific-pseudo-states');
    assert.exists(container, 'The specific-pseudo-states element container doesn\'t exist');

    for (const div of container.children) {
      const span = div.children[0];
      const shadowRoot = span.shadowRoot;
      const input = shadowRoot?.querySelector('input');
      assert.exists(input, 'The span element doesn\'t have an input element');
      input.click();
    }

    const expectedStateCalls = [
      'enabled',
      'disabled',
      'valid',
      'invalid',
      'user-valid',
      'user-invalid',
      'required',
      'optional',
      'read-only',
      'read-write',
      'in-range',
      'out-of-range',
      'visited',
      'link',
      'checked',
      'indeterminate',
      'placeholder-shown',
      'autofill',
    ];

    assert.strictEqual(checkboxes.callCount, expectedStateCalls.length);
    for (let callCount = 0; callCount < checkboxes.callCount; callCount++) {
      const args = checkboxes.getCall(callCount).args;
      assert.strictEqual(args[0], node, 'Called forcePseudoState with wrong node');
      assert.strictEqual(args[1], expectedStateCalls[callCount], 'Called forcePseudoState with wrong pseudo-state');
      assert.strictEqual(args[2], true, 'Called forcePseudoState with wrong enable state');
    }
  });
});
