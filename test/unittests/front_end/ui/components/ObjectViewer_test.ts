// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UIComponents from '../../../../../front_end/ui/components/components.js';

interface ResolvedNode {
  treeNodeData: UIComponents.ObjectViewerUtils.ObjectMetaData;
  resolvedChildren?: ResolvedNode[];
}

/**
 * A TreeNode's children are resolved lazily so that we only evaluate its
 * children when we go to expand that node in the tree. However, for the tests
 * that check how we convert objects into tree nodes, we need the full set of
 * children to test against, so this helper takes a TreeNode[] and converts it
 * to a ResolvedNode[] where we've fetched and stored all the children.
 */
async function resolveAllChildren(
    tree: UIComponents.TreeOutlineUtils.TreeNode<UIComponents.ObjectViewerUtils.ObjectMetaData>[]):
    Promise<ResolvedNode[]> {
  const resolvedTree: ResolvedNode[] = [];
  for (const node of tree) {
    if (!node.children) {
      resolvedTree.push(node);
      continue;
    }
    const children = await node.children();
    resolvedTree.push({
      treeNodeData: node.treeNodeData,
      resolvedChildren: await resolveAllChildren(children),
    });
  }
  return resolvedTree;
}

async function convertToTreeAndResolveChildren(input: UIComponents.ObjectViewerUtils.JSONObject):
    Promise<ResolvedNode[]> {
  const tree = UIComponents.ObjectViewerUtils.convertObjectToTree(input);
  return await resolveAllChildren(tree);
}

describe('ObjectViewer', () => {
  describe('converting a JSON object into an array of TreeNodes', () => {
    it('can parse a basic object', async () => {
      const input = {
        name: 'jack',
        age: 28,
      };
      const tree = await convertToTreeAndResolveChildren(input);
      assert.deepEqual(tree, [
        {
          treeNodeData: {
            dataType: 'string',
            rawValue: 'jack',
            rawKey: 'name',
          },
        },
        {
          treeNodeData: {
            dataType: 'number',
            rawValue: 28,
            rawKey: 'age',
          },
        },
      ]);
    });
  });

  it('can parse nested objects', async () => {
    const input = {
      name: 'jack',
      friends: {
        tim: true,
      },
    };
    const tree = await convertToTreeAndResolveChildren(input);
    assert.deepEqual(tree, [
      {
        treeNodeData: {
          dataType: 'string',
          rawValue: 'jack',
          rawKey: 'name',
        },
      },
      {
        treeNodeData: {
          dataType: 'object',
          rawValue: {tim: true},
          rawKey: 'friends',
        },
        resolvedChildren: [
          {
            treeNodeData: {
              dataType: 'boolean',
              rawKey: 'tim',
              rawValue: true,
            },
          },
        ],
      },
    ]);
  });

  it('can handle nested objects', async () => {
    const input = {
      name: 'jack',
      friends: {
        tim: true,
        andres: {
          paul: true,
        },
      },
    };
    const tree = await convertToTreeAndResolveChildren(input);
    assert.deepEqual(tree, [
      {
        treeNodeData: {
          dataType: 'string',
          rawValue: 'jack',
          rawKey: 'name',
        },
      },
      {
        treeNodeData: {
          dataType: 'object',
          rawValue: {tim: true, andres: {paul: true}},
          rawKey: 'friends',
        },
        resolvedChildren: [
          {
            treeNodeData: {
              dataType: 'boolean',
              rawValue: true,
              rawKey: 'tim',
            },
          },
          {
            treeNodeData: {
              dataType: 'object',
              rawValue: {paul: true},
              rawKey: 'andres',
            },
            resolvedChildren: [
              {
                treeNodeData: {
                  dataType: 'boolean',
                  rawValue: true,
                  rawKey: 'paul',
                },
              },
            ],
          },
        ],
      },
    ]);
  });

  it('can handle dates', async () => {
    const date = new Date();
    const input = {
      name: 'jack',
      someDate: date,
    };
    const tree = await convertToTreeAndResolveChildren(input);
    assert.deepEqual(tree, [
      {
        treeNodeData: {
          dataType: 'string',
          rawValue: 'jack',
          rawKey: 'name',
        },
      },
      {
        treeNodeData: {
          dataType: 'date',
          rawValue: date,
          rawKey: 'someDate',
        },
      },
    ]);
  });

  it('can handle null', async () => {
    const input = {
      name: 'jack',
      foo: null,
    };
    const tree = await convertToTreeAndResolveChildren(input);
    assert.deepEqual(tree, [
      {
        treeNodeData: {
          dataType: 'string',
          rawValue: 'jack',
          rawKey: 'name',
        },
      },
      {
        treeNodeData: {
          dataType: 'null',
          rawValue: null,
          rawKey: 'foo',
        },
      },
    ]);
  });


  it('renders arrays with indexes for the keys', async () => {
    const input = {
      name: 'jack',
      friends: ['andres', 'tim', 'paul'],
    };
    const tree = await convertToTreeAndResolveChildren(input);
    assert.deepEqual(tree, [
      {
        treeNodeData: {
          dataType: 'string',
          rawValue: 'jack',
          rawKey: 'name',
        },
      },
      {
        treeNodeData: {
          dataType: 'array',
          rawValue: ['andres', 'tim', 'paul'],
          rawKey: 'friends',
        },
        resolvedChildren: [
          {
            treeNodeData: {
              'dataType': 'string',
              index: 0,
              rawValue: 'andres',
            },
          },
          {
            treeNodeData: {
              'dataType': 'string',
              index: 1,
              rawValue: 'tim',
            },
          },
          {
            treeNodeData: {
              'dataType': 'string',
              index: 2,
              rawValue: 'paul',
            },
          },
        ],
      },
    ]);
  });

  it('can handle deeply nested arrays', async () => {
    const input = {
      name: 'jack',
      friends: ['andres', ['tim', ['paul']]],
    };
    const tree = await convertToTreeAndResolveChildren(input);
    assert.deepEqual(tree, [
      {
        treeNodeData: {
          dataType: 'string',
          rawValue: 'jack',
          rawKey: 'name',
        },
      },
      {
        treeNodeData: {
          dataType: 'array',
          rawValue: ['andres', ['tim', ['paul']]],
          rawKey: 'friends',
        },
        resolvedChildren: [
          {
            treeNodeData: {
              dataType: 'string',
              index: 0,
              rawValue: 'andres',
            },
          },
          {
            treeNodeData: {
              dataType: 'array',
              index: 1,
              rawValue: ['tim', ['paul']],
            },
            resolvedChildren: [
              {
                treeNodeData: {
                  rawValue: 'tim',
                  index: 0,
                  dataType: 'string',
                },
              },
              {
                treeNodeData: {
                  dataType: 'array',
                  index: 1,
                  rawValue: [
                    'paul',
                  ],
                },
                resolvedChildren: [
                  {
                    treeNodeData: {
                      dataType: 'string',
                      rawValue: 'paul',
                      index: 0,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
});
