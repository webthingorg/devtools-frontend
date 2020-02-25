import {crumbsToRender} from '../../../../front_end/elements/ElementsBreadcrumbs.js';

const {assert} = chai;

describe('ElementsBreadcrumbs', () => {
  describe('crumbsToRender', () => {
    it('returns an empty array when there is no selected node', () => {
      const result = crumbsToRender([], null);
      assert.deepEqual(result, []);
    });
  });
});
