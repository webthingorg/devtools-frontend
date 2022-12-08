// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import {createTarget} from '../../../helpers/EnvironmentHelpers.js';
import {
  clearAllMockConnectionResponseHandlers,
  clearMockConnectionResponseHandler,
  describeWithMockConnection,
  setMockConnectionResponseHandler,
} from '../../../helpers/MockConnection.js';

import type * as Protocol from '../../../../../../front_end/generated/protocol.js';
import * as SDK from '../../../../../../front_end/core/sdk/sdk.js';
import {loadModelDataFromTraceFile} from '../../../helpers/TraceHelpers.js';

describeWithMockConnection('DOMNodeLookup', () => {
  beforeEach(async () => {
    clearAllMockConnectionResponseHandlers();
    TraceModel.SDKServices.DOMNodeLookup._TEST_clearCache();
  });

  it('returns the DOM Node for the given node ID', async () => {
    // Create a mock target, dom model, document and node.
    const target = createTarget();
    const domModel = target.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      assert.fail('DOM model not found.');
    }
    const documentNode = {nodeId: 1 as Protocol.DOM.NodeId};
    const domNode = new SDK.DOMModel.DOMNode(domModel);
    domNode.id = 2 as Protocol.DOM.NodeId;

    // Set related CDP methods responses to return our mock document and node.
    setMockConnectionResponseHandler('DOM.pushNodesByBackendIdsToFrontend', () => ({nodeIds: [domNode.id]}));
    setMockConnectionResponseHandler('DOM.getDocument', () => ({root: documentNode}));

    // Register the mock document and node in DOMModel, these use the mock responses set above.
    await domModel.requestDocument();
    domModel.registerNode(domNode);

    const modelData = await loadModelDataFromTraceFile('cls-single-frame.json.gz');
    const result = await TraceModel.SDKServices.DOMNodeLookup.forNodeId(modelData, 1 as Protocol.DOM.BackendNodeId);
    assert.strictEqual(result, domNode);

    // Clear the mock and re-set it to return nothing to test the bad path.
    clearMockConnectionResponseHandler('DOM.pushNodesByBackendIdsToFrontend');
    setMockConnectionResponseHandler('DOM.pushNodesByBackendIdsToFrontend', () => ({nodeIds: []}));
    const doesNotExistResult =
        await TraceModel.SDKServices.DOMNodeLookup.forNodeId(modelData, 99 as Protocol.DOM.BackendNodeId);
    assert.isNull(doesNotExistResult);
  });

  it('caches the call and does not look up a node more than once per model data', async () => {
    // Create a mock target, dom model, document and node.
    const target = createTarget();
    const domModel = target.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      assert.fail('DOM model not found.');
    }
    const documentNode = {nodeId: 1 as Protocol.DOM.NodeId};
    const domNode = new SDK.DOMModel.DOMNode(domModel);
    domNode.id = 2 as Protocol.DOM.NodeId;
    const pushNodesSpy = sinon.spy(domModel, 'pushNodesByBackendIdsToFrontend');

    // Set related CDP methods responses to return our mock document and node.
    setMockConnectionResponseHandler('DOM.pushNodesByBackendIdsToFrontend', () => ({nodeIds: [domNode.id]}));
    setMockConnectionResponseHandler('DOM.getDocument', () => ({root: documentNode}));
    await domModel.requestDocument();
    domModel.registerNode(domNode);

    // The model data is only used as a cache key, so we don't need it to be real to test this.
    const modelData1 = {} as unknown as TraceModel.Handlers.Types.TraceParseData;
    const modelData2 = {} as unknown as TraceModel.Handlers.Types.TraceParseData;
    const result = await TraceModel.SDKServices.DOMNodeLookup.forNodeId(modelData1, 1 as Protocol.DOM.BackendNodeId);
    assert.isNotNull(result);
    // Look it up again to test the cache.
    await TraceModel.SDKServices.DOMNodeLookup.forNodeId(modelData1, 1 as Protocol.DOM.BackendNodeId);
    await TraceModel.SDKServices.DOMNodeLookup.forNodeId(modelData2, 1 as Protocol.DOM.BackendNodeId);
    // The call with the new model data did not hit the cache.
    assert.strictEqual(pushNodesSpy.callCount, 2);
  });
});
