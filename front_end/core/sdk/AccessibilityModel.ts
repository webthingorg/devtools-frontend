// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';

import type {DOMNode} from './DOMModel.js';
import {DOMModel} from './DOMModel.js';
import {DeferredDOMNode} from './DOMModel.js';
import type {Target} from './Target.js';
import {Capability} from './Target.js';
import {SDKModel} from './SDKModel.js';

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum CoreAxPropertyName {
  Name = 'name',
  Description = 'description',
  Value = 'value',
  Role = 'role',
}

export interface CoreOrProtocolAxProperty {
  name: CoreAxPropertyName|Protocol.Accessibility.AXPropertyName;
  value: Protocol.Accessibility.AXValue;
}

export class AccessibilityNode {
  private readonly accessibilityModelInternal: AccessibilityModel;
  private readonly agent: ProtocolProxyApi.AccessibilityApi;
  private readonly idInternal: Protocol.Accessibility.AXNodeId;
  private readonly backendDOMNodeIdInternal: Protocol.DOM.BackendNodeId|null;
  private readonly deferredDOMNodeInternal: DeferredDOMNode|null;
  private readonly ignoredInternal: boolean;
  private readonly ignoredReasonsInternal: Protocol.Accessibility.AXProperty[]|undefined;
  private readonly roleInternal: Protocol.Accessibility.AXValue|null;
  private readonly nameInternal: Protocol.Accessibility.AXValue|null;
  private readonly descriptionInternal: Protocol.Accessibility.AXValue|null;
  private readonly valueInternal: Protocol.Accessibility.AXValue|null;
  private readonly propertiesInternal: Protocol.Accessibility.AXProperty[]|null;
  private childIdsInternal: Protocol.Accessibility.AXNodeId[]|null;
  private parentNodeInternal: AccessibilityNode|null;

  constructor(accessibilityModel: AccessibilityModel, payload: Protocol.Accessibility.AXNode) {
    this.accessibilityModelInternal = accessibilityModel;
    this.agent = accessibilityModel.getAgent();

    this.idInternal = payload.nodeId;
    accessibilityModel.setAXNodeForAXId(this.idInternal, this);
    if (payload.backendDOMNodeId) {
      accessibilityModel.setAXNodeForBackendDOMNodeId(payload.backendDOMNodeId, this);
      this.backendDOMNodeIdInternal = payload.backendDOMNodeId;
      this.deferredDOMNodeInternal = new DeferredDOMNode(accessibilityModel.target(), payload.backendDOMNodeId);
    } else {
      this.backendDOMNodeIdInternal = null;
      this.deferredDOMNodeInternal = null;
    }
    this.ignoredInternal = payload.ignored;
    if (this.ignoredInternal && 'ignoredReasons' in payload) {
      this.ignoredReasonsInternal = payload.ignoredReasons;
    }

    this.roleInternal = payload.role || null;
    this.nameInternal = payload.name || null;
    this.descriptionInternal = payload.description || null;
    this.valueInternal = payload.value || null;
    this.propertiesInternal = payload.properties || null;
    this.childIdsInternal = payload.childIds || null;
    this.parentNodeInternal = null;
  }

  id(): Protocol.Accessibility.AXNodeId {
    return this.idInternal;
  }

  childIds(): Protocol.Accessibility.AXNodeId[]|null {
    return this.childIdsInternal;
  }

  accessibilityModel(): AccessibilityModel {
    return this.accessibilityModelInternal;
  }

  ignored(): boolean {
    return this.ignoredInternal;
  }

  ignoredReasons(): Protocol.Accessibility.AXProperty[]|null {
    return this.ignoredReasonsInternal || null;
  }

  role(): Protocol.Accessibility.AXValue|null {
    return this.roleInternal || null;
  }

  coreProperties(): CoreOrProtocolAxProperty[] {
    const properties: CoreOrProtocolAxProperty[] = [];

    if (this.nameInternal) {
      properties.push({name: CoreAxPropertyName.Name, value: this.nameInternal});
    }
    if (this.descriptionInternal) {
      properties.push({name: CoreAxPropertyName.Description, value: this.descriptionInternal});
    }
    if (this.valueInternal) {
      properties.push({name: CoreAxPropertyName.Value, value: this.valueInternal});
    }

    return properties;
  }

  name(): Protocol.Accessibility.AXValue|null {
    return this.nameInternal || null;
  }

  description(): Protocol.Accessibility.AXValue|null {
    return this.descriptionInternal || null;
  }

  value(): Protocol.Accessibility.AXValue|null {
    return this.valueInternal || null;
  }

  properties(): Protocol.Accessibility.AXProperty[]|null {
    return this.propertiesInternal || null;
  }

  parentNode(): AccessibilityNode|null {
    return this.parentNodeInternal;
  }

  setParentNode(parentNode: AccessibilityNode|null): void {
    this.parentNodeInternal = parentNode;
  }

  isDOMNode(): boolean {
    return Boolean(this.backendDOMNodeIdInternal);
  }

  backendDOMNodeId(): Protocol.DOM.BackendNodeId|null {
    return this.backendDOMNodeIdInternal;
  }

  deferredDOMNode(): DeferredDOMNode|null {
    return this.deferredDOMNodeInternal;
  }

  highlightDOMNode(): void {
    const deferredNode = this.deferredDOMNode();
    if (!deferredNode) {
      return;
    }
    // Highlight node in page.
    deferredNode.highlight();
  }

  children(): AccessibilityNode[] {
    if (!this.childIdsInternal) {
      return [];
    }

    const children = [];
    for (const childId of this.childIdsInternal) {
      const child = this.accessibilityModelInternal.axNodeForId(childId);
      if (child) {
        children.push(child);
      }
    }

    return children;
  }

  numChildren(): number {
    if (!this.childIdsInternal) {
      return 0;
    }
    return this.childIdsInternal.length;
  }

  hasOnlyUnloadedChildren(): boolean {
    if (!this.childIdsInternal || !this.childIdsInternal.length) {
      return false;
    }

    return this.childIdsInternal.every(id => this.accessibilityModelInternal.axNodeForId(id) === null);
  }

  // Only the root node gets a frameId, so nodes have to walk up the tree to find their frameId.
  getFrameId(): Protocol.Page.FrameId|null {
    const domNode = this.accessibilityModel().domNodeforAXNode(this);
    if (!domNode) {
      return null;
    }
    return domNode.frameId();
  }
}

export class AccessibilityModel extends SDKModel<void> {
  agent: ProtocolProxyApi.AccessibilityApi;
  private axIdToAXNode: Map<Protocol.Accessibility.AXNodeId, AccessibilityNode>;
  private readonly backendDOMNodeIdToAXNode: Map<Protocol.DOM.BackendNodeId, AccessibilityNode>;
  private readonly backendDOMNodeIdToDOMNode: Map<Protocol.DOM.BackendNodeId, DOMNode|null>;
  private readonly backendDOMNodeIdToDependentAXNodeIds:
      Map<Protocol.DOM.BackendNodeId, Protocol.Accessibility.AXNodeId[]>;

  constructor(target: Target) {
    super(target);
    this.agent = target.accessibilityAgent();
    this.resumeModel();

    this.axIdToAXNode = new Map();
    this.backendDOMNodeIdToAXNode = new Map();
    this.backendDOMNodeIdToDOMNode = new Map();
    this.backendDOMNodeIdToDependentAXNodeIds = new Map();
  }

  clear(): void {
    this.axIdToAXNode.clear();
  }

  async resumeModel(): Promise<void> {
    await this.agent.invoke_enable();
  }

  async suspendModel(): Promise<void> {
    await this.agent.invoke_disable();
  }

  async requestPartialAXTree(node: DOMNode, fetchRelatives?: boolean): Promise<void> {
    const {nodes} = await this.agent.invoke_getPartialAXTree({nodeId: node.id, fetchRelatives});
    if (!nodes) {
      return;
    }

    for (const payload of nodes) {
      new AccessibilityNode(this, payload);
    }

    for (const axNode of this.axIdToAXNode.values()) {
      for (const axChild of axNode.children()) {
        axChild.setParentNode(axNode);
      }
    }
  }

  private async pushNodesToFrontend(backendIds: Set<Protocol.DOM.BackendNodeId>): Promise<void> {
    const domModel = this.target().model(DOMModel);
    if (!domModel) {
      return;
    }
    const newNodesToTrack = await domModel.pushNodesByBackendIdsToFrontend(backendIds);
    newNodesToTrack?.forEach((value, key) => this.backendDOMNodeIdToDOMNode.set(key, value));
  }

  private getRelatedNodeBackendNodeIds(node: AccessibilityNode): Protocol.DOM.BackendNodeId[] {
    const ids: Protocol.DOM.BackendNodeId[] = [];
    const sources = node.name()?.sources;
    if (!sources) {
      return ids;
    }
    for (const source of sources) {
      if (!source.superseded && source.type === Protocol.Accessibility.AXValueSourceType.RelatedElement) {
        if (!source.attributeValue?.relatedNodes) {
          continue;
        }
        for (const relatedNodeInfo of source.attributeValue.relatedNodes) {
          ids.push(relatedNodeInfo.backendDOMNodeId);
        }
      }
      if (!source.superseded && source.type === Protocol.Accessibility.AXValueSourceType.Contents) {
        const childIds = node.children().map(child => child.backendDOMNodeId());
        childIds.forEach(child => {
          if (child) {
            ids.push(child);
          }
        });
      }
    }
    return ids;
  }

  private createNodesFromPayload(payloadNodes: Protocol.Accessibility.AXNode[]): AccessibilityNode[] {
    const backendIds: Set<Protocol.DOM.BackendNodeId> = new Set();
    const accessibilityNodes = payloadNodes.map(node => {
      node.name?.relatedNodes?.forEach(
          relNode => this.removeDependentForBackendNodeId(node.nodeId, relNode.backendDOMNodeId));
      const sdkNode = new AccessibilityNode(this, node);
      const backendId = sdkNode.backendDOMNodeId();
      if (backendId) {
        backendIds.add(backendId);
      }
      return sdkNode;
    });
    this.pushNodesToFrontend(backendIds);

    for (const sdkNode of accessibilityNodes) {
      for (const sdkChild of sdkNode.children()) {
        sdkChild.setParentNode(sdkNode);
      }
      for (const backendId of this.getRelatedNodeBackendNodeIds(sdkNode)) {
        this.addDependentForBackendNodeId(sdkNode.id(), backendId);
      }
    }
    return accessibilityNodes;
  }

  async requestRootNode(depth: number = 2, frameId?: Protocol.Page.FrameId): Promise<AccessibilityNode|undefined> {
    const {nodes} = await this.agent.invoke_getFullAXTree({depth, frameId});
    if (!nodes) {
      return;
    }
    const axNodes = this.createNodesFromPayload(nodes);
    const root = axNodes[0];
    return root;
  }

  async requestAXChildren(nodeId: Protocol.Accessibility.AXNodeId, frameId?: Protocol.Page.FrameId):
      Promise<AccessibilityNode[]> {
    const {nodes} = await this.agent.invoke_getChildAXNodes({id: nodeId, frameId});
    if (!nodes) {
      return [];
    }
    const axNodes = this.createNodesFromPayload(nodes);
    return axNodes;
  }

  async requestAndLoadSubTreeToNode(node: DOMNode): Promise<AccessibilityNode|null> {
    // Node may have already been loaded, so don't bother requesting it again.
    const loadedAXNode = this.axNodeForDOMNode(node);
    if (loadedAXNode) {
      return loadedAXNode;
    }

    const {nodes} = await this.agent.invoke_getPartialAXTree({nodeId: node.id, fetchRelatives: true});
    if (!nodes) {
      return null;
    }
    const ancestors = this.createNodesFromPayload(nodes);
    // Request top level children nodes.
    for (const node of ancestors) {
      await this.requestAXChildren(node.id());
    }

    return this.axNodeForDOMNode(node);
  }

  async updateNode(axNode: AccessibilityNode): Promise<void> {
    const axNodeBackendId = axNode.backendDOMNodeId();
    if (!axNodeBackendId) {
      return;
    }
    const backendIdsToUpdate = [axNodeBackendId];
    for (const axId of this.dependentsForBackendNodeId(axNodeBackendId)) {
      const backendId = this.axIdToAXNode.get(axId)?.backendDOMNodeId();
      if (backendId) {
        backendIdsToUpdate.push(backendId);
      }
    }

    for (const backendId of backendIdsToUpdate) {
      const {nodes} = await this.agent.invoke_getPartialAXTree({backendNodeId: backendId, fetchRelatives: false});
      if (!nodes) {
        return;
      }
      this.createNodesFromPayload(nodes);
    }
  }

  private removeDependentForBackendNodeId(
      dependentId: Protocol.Accessibility.AXNodeId, backendNodeId: Protocol.DOM.BackendNodeId): void {
    const deps = this.backendDOMNodeIdToDependentAXNodeIds.get(backendNodeId);
    if (!deps) {
      return;
    }
    const index = deps.indexOf(dependentId);
    if (index > 0) {
      deps.splice(index, 1);
    }
  }

  private addDependentForBackendNodeId(
      dependentId: Protocol.Accessibility.AXNodeId, backendNodeId: Protocol.DOM.BackendNodeId): void {
    const deps = this.backendDOMNodeIdToDependentAXNodeIds.get(backendNodeId);
    if (!deps) {
      this.backendDOMNodeIdToDependentAXNodeIds.set(backendNodeId, [dependentId]);
    } else {
      deps.push(dependentId);
    }
  }

  private dependentsForBackendNodeId(backendNodeId: Protocol.DOM.BackendNodeId): Protocol.Accessibility.AXNodeId[] {
    const allDeps: Set<Protocol.Accessibility.AXNodeId> = new Set();
    const dependentsToProcess = Array.from(this.backendDOMNodeIdToDependentAXNodeIds.get(backendNodeId) || []);
    const nodeId = dependentsToProcess.shift();
    while (nodeId) {
      const backendId = this.axNodeForId(nodeId)?.backendDOMNodeId();
      if (backendId) {
        allDeps.add(nodeId);
        const transitiveDependents = this.backendDOMNodeIdToDependentAXNodeIds.get(backendNodeId);
        if (transitiveDependents) {
          dependentsToProcess.push(...transitiveDependents);
        }
      }
    }
    return Array.from(allDeps);
  }

  axNodeForId(axId: Protocol.Accessibility.AXNodeId): AccessibilityNode|null {
    return this.axIdToAXNode.get(axId) || null;
  }

  setAXNodeForAXId(axId: Protocol.Accessibility.AXNodeId, axNode: AccessibilityNode): void {
    this.axIdToAXNode.set(axId, axNode);
  }

  axNodeForDOMNode(domNode: DOMNode|null): AccessibilityNode|null {
    if (!domNode) {
      return null;
    }
    return this.backendDOMNodeIdToAXNode.get(domNode.backendNodeId()) ?? null;
  }

  domNodeforAXNode(axNode: AccessibilityNode): DOMNode|null {
    const backendDOMNodeId = axNode.backendDOMNodeId();
    if (!backendDOMNodeId) {
      return null;
    }
    return this.backendDOMNodeIdToDOMNode.get(backendDOMNodeId) ?? null;
  }

  setAXNodeForBackendDOMNodeId(backendDOMNodeId: Protocol.DOM.BackendNodeId, axNode: AccessibilityNode): void {
    this.backendDOMNodeIdToAXNode.set(backendDOMNodeId, axNode);
  }

  getAgent(): ProtocolProxyApi.AccessibilityApi {
    return this.agent;
  }
}

SDKModel.register(AccessibilityModel, {capabilities: Capability.DOM, autostart: false});
