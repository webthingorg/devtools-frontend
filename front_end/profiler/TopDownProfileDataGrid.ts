/*
 * Copyright (C) 2009 280 North Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable rulesdir/no_underscored_properties */

import * as SDK from '../sdk/sdk.js'; // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js'; // eslint-disable-line no-unused-vars

import { Formatter, ProfileDataGridNode, ProfileDataGridTree } from './ProfileDataGrid.js'; // eslint-disable-line no-unused-vars

// Transformation: updatePropertyDeclarations
export class TopDownProfileDataGridNode extends ProfileDataGridNode {
  _remainingChildren: SDK.ProfileTreeModel.ProfileNode[];
  // Transformation: updateParameters
  constructor(profileNode: SDK.ProfileTreeModel.ProfileNode, owningTree: TopDownProfileDataGridTree) {
    const hasChildren = Boolean(profileNode.children && profileNode.children.length);

    super(profileNode, owningTree, hasChildren);

    this._remainingChildren = profileNode.children;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  static _sharedPopulate(container: TopDownProfileDataGridTree | TopDownProfileDataGridNode): void {
    const children = container._remainingChildren;
    const childrenLength = children.length;

    for (let i = 0; i < childrenLength; ++i) {
      container.appendChild(new TopDownProfileDataGridNode(children[i], (container.tree as TopDownProfileDataGridTree)));
    }

    container._remainingChildren = [];
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  static _excludeRecursively(container: TopDownProfileDataGridTree | TopDownProfileDataGridNode, aCallUID: string): void {
    if (container._remainingChildren.length > 0) {
      (container as TopDownProfileDataGridNode).populate();
    }

    container.save();

    const children = container.children;
    let index = container.children.length;

    while (index--) {
      TopDownProfileDataGridNode._excludeRecursively((children[index] as TopDownProfileDataGridNode), aCallUID);
    }

    const child = container.childrenByCallUID.get(aCallUID);

    if (child) {
      ProfileDataGridNode.merge(container, child, true);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  populateChildren(): void {
    TopDownProfileDataGridNode._sharedPopulate(this);
  }
}

// Transformation: updatePropertyDeclarations
export class TopDownProfileDataGridTree extends ProfileDataGridTree {
  _remainingChildren: SDK.ProfileTreeModel.ProfileNode[];
  children?: ProfileDataGridNode[];
  total?: number;
  // Transformation: updateParameters
  constructor(formatter: Formatter, searchableView: UI.SearchableView.SearchableView, rootProfileNode: SDK.ProfileTreeModel.ProfileNode, total: number) {
    super(formatter, searchableView, total);
    this._remainingChildren = rootProfileNode.children;
    ProfileDataGridNode.populate(this);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  focus(profileDataGridNode: ProfileDataGridNode): void {
    if (!profileDataGridNode) {
      return;
    }

    this.save();
    profileDataGridNode.savePosition();

    this.children = [profileDataGridNode];
    this.total = profileDataGridNode.total;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  exclude(profileDataGridNode: ProfileDataGridNode): void {
    if (!profileDataGridNode) {
      return;
    }

    this.save();

    TopDownProfileDataGridNode._excludeRecursively(this, profileDataGridNode.callUID);

    if (this.lastComparator) {
      this.sort(this.lastComparator, true);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  restore(): void {
    if (!this._savedChildren) {
      return;
    }

    this.children[0].restorePosition();

    super.restore();
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  populateChildren(): void {
    TopDownProfileDataGridNode._sharedPopulate(this);
  }
}
