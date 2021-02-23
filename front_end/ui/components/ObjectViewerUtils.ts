// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {TreeNode} from './TreeOutlineUtils.js';

type JSONItem = string|number|boolean|Date|JSONObject|JSONArray|null;

// TODO: is this a good idea?!
export interface JSONObject {
  [x: string]: JSONItem;
}

export interface JSONArray extends Array<JSONItem> {}

type MetaDataType = 'object'|'array'|'date'|'boolean'|'number'|'string'|'null';
export type ObjectMetaData = {
  dataType: MetaDataType,
  rawValue: unknown,
  rawKey: string,
}|{dataType: MetaDataType, rawValue: unknown, index: number};

function convertArrrayToTree(jsonArray: JSONArray): TreeNode<ObjectMetaData>[] {
  return jsonArray.map((item, index) => {
    if (Array.isArray(item)) {
      const node: TreeNode<ObjectMetaData> = {
        treeNodeData: {
          dataType: 'array',
          index,
          rawValue: item,
        },
        children: () => Promise.resolve(convertArrrayToTree(item)),
      };
      return node;
    }
    if (typeof item === 'object' && !(item instanceof Date) && item !== null) {
      const node: TreeNode<ObjectMetaData> = {
        treeNodeData: {
          dataType: 'object',
          rawValue: item,
          index,
        },
        children: () => Promise.resolve(convertObjectToTree(item)),
      };
      return node;
    }
    if (item instanceof Date) {
      return convertJSONDateToTreeNode(item, {index});
    }
    return convertPrimitiveToTreeNode(item, {index});
  });
}

type NodeKeyOrIndex = {
  rawKey: string,
}|{index: number};

function convertPrimitiveToTreeNode(
    input: string|number|boolean|null, keyOrIndex: NodeKeyOrIndex): TreeNode<ObjectMetaData> {
  if (input === null) {
    return {
      treeNodeData: {
        dataType: 'null',
        rawValue: null,
        ...keyOrIndex,
      },
    };
  }

  const typeOfItem = typeof input;
  if (typeOfItem === 'string' || typeOfItem === 'number' || typeOfItem === 'boolean') {
    const node: TreeNode<ObjectMetaData> = {
      treeNodeData: {
        dataType: typeOfItem,
        rawValue: input,
        ...keyOrIndex,
      },
    };
    return node;
  }
  throw new Error(`Invalid node ${input}`);
}
function convertJSONDateToTreeNode(input: Date, keyOrIndex: NodeKeyOrIndex): TreeNode<ObjectMetaData> {
  const node: TreeNode<ObjectMetaData> = {
    treeNodeData: {
      dataType: 'date',
      rawValue: input,
      ...keyOrIndex,
    },
  };
  return node;
}

export function convertObjectToTree(object: JSONObject): TreeNode<ObjectMetaData>[] {
  const tree: TreeNode<ObjectMetaData>[] = [];
  Object.keys(object).forEach(key => {
    const value = object[key];
    if (Array.isArray(value)) {
      const node: TreeNode<ObjectMetaData> = {
        treeNodeData: {
          dataType: 'array',
          rawValue: value,
          rawKey: key,
        },
        children: () => Promise.resolve(convertArrrayToTree(value)),
      };
      tree.push(node);
    } else if (typeof value === 'object' && !(value instanceof Date) && value !== null) {
      const node: TreeNode<ObjectMetaData> = {
        treeNodeData: {
          dataType: 'object',
          rawValue: value,
          rawKey: key,
        },
        children: () => Promise.resolve(convertObjectToTree(value)),
      };
      tree.push(node);
    } else if (value instanceof Date) {
      tree.push(convertJSONDateToTreeNode(value, {rawKey: key}));
    } else {
      tree.push(convertPrimitiveToTreeNode(value, {rawKey: key}));
    }
  });

  return tree;
}
