// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';

export class ExecutionError extends Error {}

const MAX_DEPTH = 5;

function stringifyDOMNode(domNode: SDK.DOMModel.DOMNode): string {
  const attributesText = `${domNode.attributes().map(attribute => `${attribute.name}="${attribute.value}"`).join(' ')}`;
  return `<${domNode.nodeNameInCorrectCase()}${attributesText ? ` ${attributesText}` : ''}>${
      domNode.childNodeCount() > 0 ? '...' : ''}</${domNode.nodeNameInCorrectCase()}>`;
}

async function stringifyObjectTypeRemoteObject(
    object: SDK.RemoteObject.RemoteObject, executionContext: SDK.RuntimeModel.ExecutionContext,
    currentDepth: number): Promise<string> {
  console.assert(object.type === Protocol.Runtime.RemoteObjectType.Object);

  // Stringify a DOM node.
  if (object.objectId && object.subtype === Protocol.Runtime.RemoteObjectSubtype.Node) {
    const domModel = executionContext.runtimeModel.target().model(SDK.DOMModel.DOMModel);
    if (domModel) {
      const domNode = await domModel.pushNodeToFrontend(object.objectId);
      if (domNode) {
        return stringifyDOMNode(domNode);
      }
    }
  }

  // Stringify an array.
  if (object.subtype === Protocol.Runtime.RemoteObjectSubtype.Array) {
    const properties = await object.getOwnProperties(/* generatePreview */ false, /* nonIndexedPropertiesOnly */ false);
    const contents =
        await Promise
            .all((properties.properties || [])
                     .map(
                         async property => property.name !== 'length' && property.value ?
                             await stringifyRemoteObject(property.value, executionContext, currentDepth + 1) :
                             Promise.resolve('')))
            .then(contents => contents.filter(Boolean).join(', '));
    return `[${contents}]`;
  }

  if (object.subtype === Protocol.Runtime.RemoteObjectSubtype.Map ||
      object.subtype === Protocol.Runtime.RemoteObjectSubtype.Set) {
    return `${object.description}`;
  }

  // Stringify a non-specific object.
  // Special case `CSSStyleDeclaration` as we don't need the initial properties that map index of the properties to their kebab case property name equivalents.
  // TODO(ergunsh): Remove the default values from `CSSStyleDeclaration` result.
  const nonIndexedPropertiesOnly = object.className === 'CSSStyleDeclaration';
  const properties = await object.getOwnProperties(/* generatePreview */ false, nonIndexedPropertiesOnly);
  const contents =
      await Promise
          .all((properties.properties || [])
                   .map(
                       async property => property.value ?
                           `${property.name}: ${
                               await stringifyRemoteObject(property.value, executionContext, currentDepth + 1)}` :
                           Promise.resolve('')))
          .then(contents => contents.filter(Boolean).join(', '));
  return `{${contents}}`;
}

async function stringifyRemoteObject(
    object: SDK.RemoteObject.RemoteObject, executionContext: SDK.RuntimeModel.ExecutionContext,
    currentDepth: number = 0): Promise<string> {
  // TODO(ergunsh): Find a way to detect cycles.
  if (currentDepth >= MAX_DEPTH) {
    return '(max depth)';
  }

  switch (object.type) {
    case Protocol.Runtime.RemoteObjectType.String:
      return `'${object.value}'`;
    case Protocol.Runtime.RemoteObjectType.Bigint:
      return `${object.value}n`;
    case Protocol.Runtime.RemoteObjectType.Boolean:
    case Protocol.Runtime.RemoteObjectType.Number:
      return `${object.value}`;
    case Protocol.Runtime.RemoteObjectType.Undefined:
      return 'undefined';
    case Protocol.Runtime.RemoteObjectType.Symbol:
    case Protocol.Runtime.RemoteObjectType.Function:
      return `${object.description}`;
    case Protocol.Runtime.RemoteObjectType.Object:
      return stringifyObjectTypeRemoteObject(object, executionContext, currentDepth);
    default:
      throw new Error('Unknown type to stringify ' + object.type);
  }
}

export class FreestylerEvaluateAction {
  static async execute(code: string, executionContext: SDK.RuntimeModel.ExecutionContext): Promise<string> {
    const response = await executionContext.evaluate(
        {
          expression: code,
          replMode: true,
          includeCommandLineAPI: true,
          returnByValue: false,
          silent: false,
          generatePreview: true,
          allowUnsafeEvalBlockedByCSP: false,
        },
        /* userGesture */ false, /* awaitPromise */ true);

    if (!response) {
      throw new Error('Response is not found');
    }

    if ('error' in response) {
      throw new ExecutionError(response.error);
    }

    if (response.exceptionDetails) {
      // TODO(ergunsh): We can return the exception message so that it can tweak the code to run.
      throw new ExecutionError(response.exceptionDetails.exception?.description || 'JS exception');
    }

    return stringifyRemoteObject(response.object, executionContext);
  }
}
