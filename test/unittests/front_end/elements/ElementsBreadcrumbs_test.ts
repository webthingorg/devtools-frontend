import {crumbsToRender} from '../../../../front_end/elements/ElementsBreadcrumbs.js';
import {DOMNode} from '../../../../front_end/elements/ElementsBreadcrumbsUtils.js';
import {renderElementIntoDOM, resetTestDOM} from '../helpers/helpers_test.js';

const {assert} = chai;

interface MakeCrumbOptions extends Partial<DOMNode> {
  attributes?: {[x: string]: string}
}

const makeCrumb = (overrides: MakeCrumbOptions = {}) => {
  const attributes = overrides.attributes || {};
  const newCrumb: DOMNode = {
    nodeType: Node.ELEMENT_NODE,
    id: 1,
    pseudoType: '',
    shadowRootType: '',
    nodeName: 'body',
    nodeNameNicelyCased: 'body',
    legacyDomNode: {},
    highlightNode: () => {},
    clearHighlight: () => {},
    getAttribute: x => attributes[x] || '',
    ...overrides,
  };
  return newCrumb;
};

describe('ElementsBreadcrumbs', () => {
  describe('crumbsToRender', () => {
    it('returns an empty array when there is no selected node', () => {
      const result = crumbsToRender([], null);
      assert.deepEqual(result, []);
    });

    it('excludes the document node', () => {
      const documentCrumb = makeCrumb({
        nodeType: Node.DOCUMENT_NODE,
        id: 1,
        nodeName: 'document',
        nodeNameNicelyCased: 'document',
      });

      const bodyCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 2,
        nodeName: 'body',
        nodeNameNicelyCased: 'body',
      });

      const result = crumbsToRender([documentCrumb, bodyCrumb], bodyCrumb);

      assert.deepEqual(result, [
        {
          title: {
            main: 'body',
            extras: {},
          },
          selected: true,
          node: bodyCrumb,
          originalNode: bodyCrumb.legacyDomNode,
        },
      ]);
    });

    it('adds any IDs and classes to nodes to show in the title', () => {
      const bodyCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 2,
        nodeName: 'body',
        nodeNameNicelyCased: 'body',
        attributes: {
          class: 'class1 class2',
          id: 'id',
        },
      });

      const result = crumbsToRender([bodyCrumb], bodyCrumb);

      assert.equal(result.length, 1);
      assert.deepEqual(result[0].title, {
        main: 'body',
        extras: {
          classes: ['class1', 'class2'],
          id: 'id',
        },
      });
    });
  });

  describe('rendering breadcrumbs', () => {
    beforeEach(resetTestDOM);

    it('renders all the breadcrumbs provided and highlights the active one', () => {
      const component = document.createElement('devtools-elements-breadcrumbs');

      renderElementIntoDOM(component);

      document.body.appendChild(component);

      const bodyCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 2,
        nodeName: 'body',
        nodeNameNicelyCased: 'body',
      });

      const divCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 3,
        nodeName: 'div',
        nodeNameNicelyCased: 'div',
        attributes: {
          id: 'test-id',
        },
      });

      component.update([divCrumb, bodyCrumb], bodyCrumb);

      if (!component.shadowRoot) {
        assert.fail('Expected breadcrumbs shadowRoot to exist');
        return;
      }

      const crumbs = Array.from(component.shadowRoot.querySelectorAll('[data-crumb]'));

      const crumbTitles = crumbs.map(crumb => {
        return crumb.textContent ? crumb.textContent.trim() : '';
      });

      assert.deepEqual(crumbTitles, ['body', 'div#test-id']);
    });

    it('shows the scrolling icons if the crumbs do not fit in their container', () => {
      const thinWrapper = document.createElement('div');
      thinWrapper.style.width = '100px';

      const component = document.createElement('devtools-elements-breadcrumbs');
      thinWrapper.appendChild(component);

      renderElementIntoDOM(thinWrapper);

      const bodyCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 2,
        nodeName: 'body',
        nodeNameNicelyCased: 'body',
        attributes: {
          class: 'test-class-1 test-class-2 test-class-3',
        },
      });

      const divCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 3,
        nodeName: 'div',
        nodeNameNicelyCased: 'div',
        attributes: {
          id: 'test-id-with-a-really-long-name',
        },
      });

      component.update([divCrumb, bodyCrumb], bodyCrumb);


      if (!component.shadowRoot) {
        assert.fail('Expected breadcrumbs shadowRoot to exist');
        return;
      }

      const scrollButtons = component.shadowRoot.querySelectorAll<HTMLButtonElement>('button.overflow');

      if (!scrollButtons) {
        assert.fail('Expected to find some scrollButtons');
        return;
      }

      assert.equal(scrollButtons.length, 2, 'there are two scroll buttons');

      const leftButton = scrollButtons[0];
      const rightButton = scrollButtons[1];

      assert.isTrue(leftButton.disabled);
      assert.isFalse(rightButton.disabled);
    });
  });
});
