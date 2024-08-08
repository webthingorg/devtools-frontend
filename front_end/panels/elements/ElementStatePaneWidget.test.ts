// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import {createTarget, stubNoopSettings} from '../../testing/EnvironmentHelpers.js';
import {
  describeWithMockConnection,
} from '../../testing/MockConnection.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as Elements from './elements.js';

describeWithMockConnection('ElementStatePaneWidget', () => {
  let target: SDK.Target.Target;
  let view: Elements.ElementStatePaneWidget.ElementStatePaneWidget;

  const pseudoClasses = [
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

  beforeEach(() => {
    stubNoopSettings();
    target = createTarget();
  });

  const checkHiddenCheckboxes = async (
      nodeName: string, expectedPseudoClasses: string[], formAssociated: boolean = false,
      attribute?: [string, string]) => {
    view = new Elements.ElementStatePaneWidget.ElementStatePaneWidget();
    const tableUpdatedPromise = new Promise<void>(
        resolve => sinon.stub(view, 'updateElementSpecificStatesTableForTest').callsFake(resolve),
    );

    const model = target.model(SDK.DOMModel.DOMModel);
    assert.exists(model);

    const node = new SDK.DOMModel.DOMNode(model);

    sinon.stub(node, 'nodeType').returns(Node.ELEMENT_NODE);
    sinon.stub(node, 'nodeName').returns(nodeName);
    sinon.stub(node, 'enclosingElementOrSelf').returns(node);
    sinon.stub(node, 'callFunction').resolves({value: formAssociated});
    if (attribute) {
      sinon.stub(node, 'getAttribute').withArgs(attribute[0]).returns(attribute[1]);
    }

    const header = view.contentElement.querySelector('.force-specific-element-header');
    assert.instanceOf(header, HTMLDetailsElement);
    header.click();

    UI.Context.Context.instance().setFlavor(SDK.DOMModel.DOMNode, node);

    await tableUpdatedPromise;

    for (const pseudoClass of pseudoClasses) {
      const div = view.contentElement.querySelector(`#${pseudoClass}`);
      assert.instanceOf(div, HTMLDivElement);
      assert.strictEqual(!div.hidden, expectedPseudoClasses.includes(div.id), `Wrong state for ${div.id}`);
    }
  };

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

    for (const pseudoClass of pseudoClasses) {
      const div = view.contentElement.querySelector(`#${pseudoClass}`);
      assert.exists(div);
      const span = div.children[0];
      const shadowRoot = span.shadowRoot;
      const input = shadowRoot?.querySelector('input');
      assert.exists(input, 'The span element doesn\'t have an input element');
      input.click();

      const args = checkboxes.lastCall.args;
      assert.strictEqual(args[0], node, 'Called forcePseudoState with wrong node');
      assert.strictEqual(args[1], pseudoClass, 'Called forcePseudoState with wrong pseudo-state');
      assert.strictEqual(args[2], true, 'Called forcePseudoState with wrong enable state');
    }
  });

  it('Shows the specific pseudo-classes for input', async () => {
    await checkHiddenCheckboxes(
        'input',
        [
          'enabled',
          'disabled',
          'valid',
          'invalid',
          'user-valid',
          'user-invalid',
          'required',
          'optional',
          'read-write',
          'placeholder-shown',
          'autofill',
        ],
    );
  });

  it('Shows the specific pseudo-classes for button', async () => {
    await checkHiddenCheckboxes(
        'button',
        ['enabled', 'disabled', 'valid', 'invalid', 'read-only'],
    );
  });

  it('Shows the specific pseudo-classes for fieldset', async () => {
    await checkHiddenCheckboxes(
        'fieldset',
        ['enabled', 'disabled', 'valid', 'invalid', 'read-only'],
    );
  });

  it('Shows the specific pseudo-classes for textarea', async () => {
    await checkHiddenCheckboxes(
        'textarea',
        [
          'enabled',
          'disabled',
          'valid',
          'invalid',
          'user-valid',
          'user-invalid',
          'required',
          'optional',
          'read-write',
          'placeholder-shown',
        ],
    );
  });

  it('Shows the specific pseudo-classes for select', async () => {
    await checkHiddenCheckboxes(
        'select',
        ['enabled', 'disabled', 'valid', 'invalid', 'user-valid', 'user-invalid', 'required', 'optional', 'read-only'],
    );
  });

  it('Shows the specific pseudo-classes for option', async () => {
    await checkHiddenCheckboxes(
        'option',
        ['enabled', 'disabled', 'checked', 'read-only'],
    );
  });

  it('Shows the specific pseudo-classes for optgroup', async () => {
    await checkHiddenCheckboxes(
        'optgroup',
        ['enabled', 'disabled', 'read-only'],
    );
  });

  it('Shows the specific pseudo-classes for FormAssociated', async () => {
    await checkHiddenCheckboxes(
        'CustomFormAssociatedElement',
        ['enabled', 'disabled', 'valid', 'invalid', 'read-only'],
        true,
    );
  });

  it('Shows the specific pseudo-classes for object, output and img', async () => {
    await checkHiddenCheckboxes(
        'object',
        ['valid', 'invalid', 'read-only'],
    );

    await checkHiddenCheckboxes(
        'output',
        ['valid', 'invalid', 'read-only'],
    );

    await checkHiddenCheckboxes(
        'img',
        ['valid', 'invalid', 'read-only'],
    );
  });
  it('Shows the specific pseudo-classes for progress', async () => {
    await checkHiddenCheckboxes(
        'progress',
        ['read-only', 'indeterminate'],
    );
  });

  it('Shows the specific pseudo-classes for a and area with href', async () => {
    await checkHiddenCheckboxes(
        'a',
        ['visited', 'link', 'read-only'],
        false,
        ['href', 'www.google.com'],
    );

    await checkHiddenCheckboxes(
        'a',
        ['visited', 'link', 'read-only'],
        false,
        ['href', 'www.google.com'],
    );
  });

  it('Shows the specific pseudo-classes for radio or checkbox inputs', async () => {
    await checkHiddenCheckboxes(
        'input',
        [
          'enabled',
          'disabled',
          'valid',
          'invalid',
          'user-valid',
          'user-invalid',
          'required',
          'optional',
          'read-write',
          'placeholder-shown',
          'autofill',
          'checked',
          'indeterminate',
        ],
        false,
        ['type', 'checkbox'],
    );
    await checkHiddenCheckboxes(
        'input',
        [
          'enabled',
          'disabled',
          'valid',
          'invalid',
          'user-valid',
          'user-invalid',
          'required',
          'optional',
          'read-write',
          'placeholder-shown',
          'autofill',
          'checked',
          'indeterminate',
        ],
        false,
        ['type', 'radio'],
    );
  });
});
