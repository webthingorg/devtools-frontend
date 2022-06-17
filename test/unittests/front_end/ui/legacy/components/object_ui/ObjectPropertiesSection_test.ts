// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../../../front_end/core/sdk/sdk.js';
import * as ObjectUI from '../../../../../../../front_end/ui/legacy/components/object_ui/object_ui.js';
import * as UI from '../../../../../../../front_end/ui/legacy/legacy.js';

import {describeWithRealConnection, getExecutionContext} from '../../../../helpers/RealConnection.js';
import {someMutations} from '../../../../helpers/MutationHelpers.js';
import {assertNotNullOrUndefined} from '../../../../../../../front_end/core/platform/platform.js';

describeWithRealConnection('ObjectPropertiesSection', () => {
  async function setupTreeOutline(code: string) {
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const target = targetManager.mainTarget();
    assertNotNullOrUndefined(target);
    const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
    assertNotNullOrUndefined(runtimeModel);
    const executionContext = await getExecutionContext(runtimeModel);
    UI.Context.Context.instance().setFlavor(SDK.RuntimeModel.ExecutionContext, executionContext);

    const {result} = await ObjectUI.JavaScriptREPL.JavaScriptREPL.evaluateAndBuildPreview(
        code, false /* throwOnSideEffect */, true /* replMode */, 500 /* timeout */);
    if (!(result && 'object' in result && result.object)) {
      throw new Error('Cannot evaluate test object');
    }
    const {properties} =
        await result.object.getAllProperties(false /* accessorPropertiesOnly */, false /* generatePreview */);

    assertNotNullOrUndefined(properties);
    const treeOutline = new ObjectUI.ObjectPropertiesSection.ObjectPropertiesSectionsTreeOutline({readOnly: true});
    ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement.populateWithProperties(
        treeOutline.rootElement(), properties, null, true /* skipProto */, false /* skipGettersAndSetters */,
        result.object);

    return treeOutline;
  }

  it('can reveal private accessor values', async () => {
    const VALUE = '42';
    const treeOutline = await setupTreeOutline(`(() => {
      class A {
        get #bar() { return ${VALUE}; }
      };
      return new A();
    })()`);

    const propertiesSection =
        treeOutline.rootElement().firstChild() as ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement;

    propertiesSection.update();

    const calculateValueButton =
        propertiesSection.valueElement.querySelector('.object-value-calculate-value-button') as HTMLElement;
    assertNotNullOrUndefined(calculateValueButton);
    const mutations = someMutations(propertiesSection.listItemElement);
    calculateValueButton.click();
    await mutations;

    assert.strictEqual(VALUE, propertiesSection.valueElement.innerHTML);
  });

  it('visually distinguishes important DOM properties for checkboxe inputs', async () => {
    const treeOutline = await setupTreeOutline(`(() => {
      const input = document.createElement("input");
      input.setAttribute("type", "checkbox");
      return input;
    })()`);

    const webidlProperties = treeOutline.rootElement().childrenListElement.querySelectorAll('[webidl="true"]');
    const expected = new Set<string>([
      'checked: false',
      'required: false',
      'type: "checkbox"',
      'value: "on"',
    ]);
    const notExpected = new Set<string>([
      'accept: ""',
      'files: FileList',
      'multiple: false',
    ]);

    for (const element of webidlProperties) {
      const textContent = element.querySelector('.name-and-value')?.textContent;
      if (textContent && expected.has(textContent)) {
        expected.delete(textContent);
      }
      if (textContent && notExpected.has(textContent)) {
        notExpected.delete(textContent);
      }
    }

    assert.strictEqual(expected.size, 0, 'Not all expected properties were found');
    assert.strictEqual(notExpected.size, 3, 'Unexpected properties were found');
  });

  it('visually distinguishes important DOM properties for file inputs', async () => {
    const treeOutline = await setupTreeOutline(`(() => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      return input;
    })()`);

    const webidlProperties = treeOutline.rootElement().childrenListElement.querySelectorAll('[webidl="true"]');
    const notExpected = new Set<string>([
      'checked: false',
      'type: "checkbox"',
      'value: "on"',
    ]);
    const expected = new Set<string>([
      'accept: ""',
      'files: FileList',
      'multiple: false',
      'required: false',
    ]);

    for (const element of webidlProperties) {
      const textContent = element.querySelector('.name-and-value')?.textContent;
      if (textContent && expected.has(textContent)) {
        expected.delete(textContent);
      }
      if (textContent && notExpected.has(textContent)) {
        notExpected.delete(textContent);
      }
    }

    assert.strictEqual(expected.size, 0, 'Not all expected properties were found');
    assert.strictEqual(notExpected.size, 3, 'Unexpected properties were found');
  });
});
