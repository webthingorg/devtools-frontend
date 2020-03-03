import {assert} from 'chai';

import {$} from '../../shared/helper.js';

export async function assertContentOfSelectedElementsNode(expectedTextContent: string) {
  const selectedTextContent = await (await $('.selected[role="treeitem"]')).evaluate(node => node.textContent);
  assert.equal(selectedTextContent, expectedTextContent);
}
