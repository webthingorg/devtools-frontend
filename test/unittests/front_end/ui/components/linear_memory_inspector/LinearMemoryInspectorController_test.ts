// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../../front_end/core/sdk/sdk.js';
import type * as Bindings from '../../../../../../front_end/models/bindings/bindings.js';
import * as LinearMemoryInspector from '../../../../../../front_end/ui/components/linear_memory_inspector/linear_memory_inspector.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';

const {assert} = chai;
const {LinearMemoryInspectorController, ValueInterpreterDisplayUtils} = LinearMemoryInspector;

class MockRemoteObject extends SDK.RemoteObject.LocalJSONObject {
  private objSubtype?: string;

  constructor(array: ArrayBuffer) {
    super(array);
  }

  arrayBufferByteLength() {
    return this.value.byteLength;
  }

  get subtype(): string|undefined {
    return 'arraybuffer';
  }
}

function createWrapper(array: Uint8Array) {
  const mockRemoteObj = new MockRemoteObject(array.buffer);
  const mockRemoteArrayBuffer = new SDK.RemoteObject.RemoteArrayBuffer(mockRemoteObj);
  return new LinearMemoryInspectorController.RemoteArrayBufferWrapper(mockRemoteArrayBuffer);
}

describeWithEnvironment('LinearMemoryInspectorController', () => {
  it('throws an error on an invalid (out-of-bounds) memory range request', async () => {
    const array = new Uint8Array([2, 4, 6, 2, 4]);
    const wrapper = createWrapper(array);
    try {
      await LinearMemoryInspectorController.LinearMemoryInspectorController.getMemoryRange(wrapper, 10, 20);
      throw new Error('Function did now throw.');
    } catch (e) {
      const error = e as Error;
      assert.strictEqual(error.message, 'Requested range is out of bounds.');
    }
  });

  it('throws an error on an invalid memory range request', async () => {
    const array = new Uint8Array([2, 4, 6, 2, 4]);
    const wrapper = createWrapper(array);
    try {
      await LinearMemoryInspectorController.LinearMemoryInspectorController.getMemoryRange(wrapper, 20, 10);
      throw new Error('Function did now throw.');
    } catch (e) {
      const error = e as Error;
      assert.strictEqual(error.message, 'Requested range is out of bounds.');
    }
  });

  it('can pull updated data on memory range request', async () => {
    const array = new Uint8Array([2, 4, 6, 2, 4]);
    const wrapper = createWrapper(array);
    const valuesBefore =
        await LinearMemoryInspectorController.LinearMemoryInspectorController.getMemoryRange(wrapper, 0, array.length);

    assert.strictEqual(valuesBefore.length, array.length);
    for (let i = 0; i < array.length; ++i) {
      assert.strictEqual(valuesBefore[i], array[i]);
    }

    const changedIndex = 0;
    const changedValue = 10;
    array[changedIndex] = changedValue;
    const valuesAfter =
        await LinearMemoryInspectorController.LinearMemoryInspectorController.getMemoryRange(wrapper, 0, array.length);

    assert.strictEqual(valuesAfter.length, valuesBefore.length);
    for (let i = 0; i < valuesBefore.length; ++i) {
      if (i === changedIndex) {
        assert.strictEqual(valuesAfter[i], changedValue);
      } else {
        assert.strictEqual(valuesAfter[i], valuesBefore[i]);
      }
    }
  });

  it('triggers saving and loading of settings on settings changed event', () => {
    const instance = LinearMemoryInspectorController.LinearMemoryInspectorController.instance();

    const valueTypes =
        new Set([ValueInterpreterDisplayUtils.ValueType.Int16, ValueInterpreterDisplayUtils.ValueType.Float32]);
    const valueTypeModes = new Map(
        [[ValueInterpreterDisplayUtils.ValueType.Int16, ValueInterpreterDisplayUtils.ValueTypeMode.Hexadecimal]]);
    const settings = {
      valueTypes,
      modes: valueTypeModes,
      endianness: ValueInterpreterDisplayUtils.Endianness.Little,
    };
    const defaultSettings = instance.loadSettings();
    instance.saveSettings(settings);

    assert.notDeepEqual(defaultSettings, settings);

    const actualSettings = instance.loadSettings();
    assert.deepEqual(actualSettings, settings);
  });

  it('retrieves size of non-pointer ValueNode', () => {
    const expectedSize = 20;
    const mockValueNode = {
      sourceType: {
        typeMap: new Map<number, object>([
          [1, {}],
        ]),
        typeInfo: {
          size: expectedSize,
          members: [{name: 'not_a_pointer', typeId: 1}],
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const size = LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectSize(mockValueNode);
    assert.strictEqual(size, expectedSize);
  });

  it('retrieves object size for a pointer ValueNode', () => {
    const expectedSize = 8;
    const pointerSize = 4;
    const nestedValueNode = {
      sourceType: {
        typeInfo: {
          size: expectedSize,
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const pointerValueNode = {
      sourceType: {
        typeMap: new Map<number, object>([
          [1, nestedValueNode.sourceType],
        ]),
        typeInfo: {
          size: pointerSize,
          members: [{name: '*', typeId: 1}],
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const size = LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectSize(pointerValueNode);
    assert.strictEqual(size, expectedSize);
  });

  it('retrieves pointer size for a pointer-to-pointer ValueNode', () => {
    const expectedSize = 4;
    const pointerSize = 4;
    const nestedValueNode = {
      sourceType: {
        typeInfo: {
          size: 8,
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const nestedPointerValueNode = {
      sourceType: {
        typeInfo: {
          size: expectedSize,
          members: [{name: '*', typeId: 2}],
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const pointerValueNode = {
      sourceType: {
        typeMap: new Map<number, object>([
          [1, nestedPointerValueNode.sourceType],
          [2, nestedValueNode.sourceType],
        ]),
        typeInfo: {
          size: pointerSize,
          members: [{name: '*', typeId: 1}],
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const size = LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectSize(pointerValueNode);
    assert.strictEqual(size, expectedSize);
  });

  it('throws an error when retrieving size of non-conforming (multiple pointer members) ValueNode', () => {
    const expectedSize = 8;
    const pointerSize = 4;
    const nestedValueNode = {
      sourceType: {
        typeInfo: {
          size: expectedSize,
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    const pointerValueNode = {
      sourceType: {
        typeMap: new Map<number, object>([
          [1, nestedValueNode.sourceType],
          [2, nestedValueNode.sourceType],
        ]),
        typeInfo: {
          size: pointerSize,
          members: [{name: '*', typeId: 1}, {name: '*', typeId: 2}],
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    try {
      LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectSize(pointerValueNode);
      throw new Error('Function did now throw an error.');
    } catch (e) {
      const error = e as Error;
      assert.strictEqual(error.message, 'The number of pointers in typeInfo.members should not be greater than one.');
    }
  });

  it('throws an error when retrieving size of non-conforming (typedId not in typeMap) ValueNode', () => {
    const pointerValueNode = {
      sourceType: {
        typeMap: new Map<number, object>([
          [42, {}],
        ]),
        typeInfo: {
          size: 4,
          members: [{name: '*', typeId: 1}],
        },
      },
    } as Bindings.DebuggerLanguagePlugins.ValueNode;

    try {
      LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectSize(pointerValueNode);
      throw new Error('Function did now throw an error.');
    } catch (e) {
      const error = e as Error;
      assert.strictEqual(error.message, 'Cannot find the source type information for typeId 1.');
    }
  });

  it('returns undefined when error happens in evaluateExpression', async () => {
    const callFrame = {
      evaluate: ({}) => {
        return new Promise(resolve => {
          resolve({error: 'This is a test error'} as SDK.RuntimeModel.EvaluationResult);
        });
      },
    } as SDK.DebuggerModel.CallFrame;

    const instance = LinearMemoryInspectorController.LinearMemoryInspectorController.instance();
    const result = await instance.evaluateExpression(callFrame, 'variableName');
    assert.strictEqual(result, undefined);
  });

  it('returns undefined when exceptionDetails is set on the result of evaluateExpression', async () => {
    const callFrame = {
      evaluate: ({}) => {
        return new Promise(resolve => {
          resolve({
            object: {type: 'object'} as SDK.RemoteObject.RemoteObject,
            exceptionDetails: {text: 'This is a test exception\'s detail text'},
          } as SDK.RuntimeModel.EvaluationResult);
        });
      },
    } as SDK.DebuggerModel.CallFrame;
    const instance = LinearMemoryInspectorController.LinearMemoryInspectorController.instance();
    const result = await instance.evaluateExpression(callFrame, 'myCar.manufacturer');
    assert.strictEqual(result, undefined);
  });

  it('returns RemoteObject when no exception happens in evaluateExpression', async () => {
    const callFrame = {
      evaluate: ({}) => {
        return new Promise(resolve => {
          resolve({
            object: {type: 'object'} as SDK.RemoteObject.RemoteObject,
          } as SDK.RuntimeModel.EvaluationResult);
        });
      },
    } as SDK.DebuggerModel.CallFrame;
    const instance = LinearMemoryInspectorController.LinearMemoryInspectorController.instance();
    const result = await instance.evaluateExpression(callFrame, 'myCar.manufacturer');
    assert.deepEqual(result, {type: 'object'} as SDK.RemoteObject.RemoteObject);
  });

  it('extracts array type correctly', () => {
    const obj = {description: 'int[]'} as Bindings.DebuggerLanguagePlugins.ValueNode;
    const extractedType =
        LinearMemoryInspector.LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectType(obj);
    assert.strictEqual(extractedType, 'int[]');
  });

  it('extracts multi-level pointer correctly', () => {
    const obj = {description: 'int **'} as Bindings.DebuggerLanguagePlugins.ValueNode;
    const extractedType =
        LinearMemoryInspector.LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectType(obj);
    assert.strictEqual(extractedType, 'int *');
  });

  it('extracts reference type correctly', () => {
    const obj = {description: 'int &'} as Bindings.DebuggerLanguagePlugins.ValueNode;
    const extractedType =
        LinearMemoryInspector.LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectType(obj);
    assert.strictEqual(extractedType, 'int');
  });

  it('extracts pointer type correctly', () => {
    const obj = {description: 'int *'} as Bindings.DebuggerLanguagePlugins.ValueNode;
    const extractedType =
        LinearMemoryInspector.LinearMemoryInspectorController.LinearMemoryInspectorController.extractObjectType(obj);
    assert.strictEqual(extractedType, 'int');
  });
});

describe('RemoteArrayBufferWrapper', () => {
  it('correctly wraps the remote object', async () => {
    const array = new Uint8Array([2, 4, 6, 2, 4]);
    const wrapper = createWrapper(array);

    assert.strictEqual(wrapper.length(), array.length);

    const extractedArray = await wrapper.getRange(0, 3);
    assert.lengthOf(extractedArray, 3);

    for (let i = 0; i < 3; ++i) {
      assert.deepEqual(array[i], extractedArray[i]);
    }
  });
});
