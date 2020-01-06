/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Keep track of all created Protocol objects for later use,
// including AudioContexts, AudioNodes, and AudioParams.
export class ContextStorage {
  constructor() {
    /** @type {!Map<!Protocol.WebAudio.GraphObjectId, !Protocol.WebAudio.BaseAudioContext>} */
    this._contextMapById = new Map();

    /**
     * For each context, track AudioNodes so that the properties of AudioNodes can be
     * fetched later.
     * @type {!Map<!Protocol.WebAudio.GraphObjectId,
     *             !Map<Protocol.WebAudio.GraphObjectId,
     *                 (!Protocol.WebAudio.AudioNode | !Protocol.WebAudio.AudioListener)>>}
     */
    this._nodeMapByContextId = new Map();

    /**
     * For each context, track AudioParams so that the properties of AudioParams can be
     * fetched later.
     * @type {!Map<!Protocol.WebAudio.GraphObjectId,
     *            !Map<Protocol.WebAudio.GraphObjectId, !Protocol.WebAudio.AudioParam>>}
     */
    this._paramMapByContextId = new Map();
  }

  clear() {
    this._contextMapById.clear();
    this._nodeMapByContextId.clear();
    this._paramMapByContextId.clear();
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   */
  hasContext(contextId) {
    return this._contextMapById.has(contextId);
  }

  /**
   * @param {!Protocol.WebAudio.BaseAudioContext} context
   */
  setContext(context) {
    this._contextMapById.set(context.contextId, context);
  }

  /**
   * @param {!Protocol.WebAudio.BaseAudioContext} context
   */
  createContext(context) {
    this._contextMapById.set(context.contextId, context);
    this._nodeMapByContextId.set(context.contextId, new Map());
    this._paramMapByContextId.set(context.contextId, new Map());
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   */
  destroyContext(contextId) {
    if (!this._contextMapById.has(contextId))
      {return;}

    this._contextMapById.delete(contextId);
    this._nodeMapByContextId.delete(contextId);
    this._paramMapByContextId.delete(contextId);
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.AudioNode | !Protocol.WebAudio.AudioListener} node
   */
  addNode(contextId, node) {
    if (this._nodeMapByContextId.has(contextId)) {
      const nodeMap = this._nodeMapByContextId.get(contextId);
      nodeMap.set(node.nodeId, node);
    }
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.GraphObjectId} nodeId
   */
  removeNode(contextId, nodeId) {
    const nodeMap = this._nodeMapByContextId.get(contextId);
    nodeMap.delete(nodeId);
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.AudioParam} param
   */
  addParam(contextId, param) {
    if (this._paramMapByContextId.has(contextId)) {
      const paramMap = this._paramMapByContextId.get(contextId);
      paramMap.set(param.paramId, param);
    }
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.GraphObjectId} nodeId
   * @param {!Protocol.WebAudio.GraphObjectId} paramId
   */
  removeParam(contextId, nodeId, paramId) {
    const paramMap = this._paramMapByContextId.get(contextId);
    paramMap.delete(paramId);
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.GraphObjectId} nodeId
   * @return {?Protocol.WebAudio.AudioNode | ?Protocol.WebAudio.AudioListener}
   */
  getNodeById(contextId, nodeId) {
    const nodeMap = this._nodeMapByContextId.get(contextId);
    return nodeMap.get(nodeId);
  }

  /**
   * @param {!Protocol.WebAudio.GraphObjectId} contextId
   * @param {!Protocol.WebAudio.GraphObjectId} paramId
   * @return {?Protocol.WebAudio.AudioParam}
   */
  getParamById(contextId, paramId) {
    const paramMap = this._paramMapByContextId.get(contextId);
    return paramMap.get(paramId);
  }
}

/* Legacy exported object */
self.WebAudio = self.WebAudio || {};

/* Legacy exported object */
WebAudio = WebAudio || {};

/**
 * @constructor
 */
WebAudio.ContextStorage = ContextStorage;
