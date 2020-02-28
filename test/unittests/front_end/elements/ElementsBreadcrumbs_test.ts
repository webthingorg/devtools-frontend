import {crumbsToRender} from '../../../../front_end/elements/ElementsBreadcrumbs.js';
import {DOMNode} from '../../../../front_end/elements/ElementsBreadcrumbsUtils.js';

const {assert} = chai;

const makeCrumb = (overrides: Partial<DOMNode> = {}): DOMNode => {
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
    getAttribute: () => '',
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

      const result = crumbsToRender(
          [
            documentCrumb,
            bodyCrumb,
          ],
          bodyCrumb);

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
        getAttribute: (attr: string) => {
          if (attr === 'class') {
            return 'class1 class2';
          } else if (attr === 'id') {
            return 'id';
          } else {
            assert.fail(`getAttribute unexpectedly called with argument ${attr}`);
            return '';
          }
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
    it('renders all the breadcrumbs provided and highlights the active one', () => {
      const container = document.createElement('devtools-elements-breadcrumbs');

      document.body.appendChild(container);

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
        getAttribute(attr) {
          if (attr === 'id') {
            return 'test-id';
          } else {
            return '';
          }
        },
      });

      container.update([divCrumb, bodyCrumb], bodyCrumb);

      if (!container.shadowRoot) {
        assert.fail('Expected breadcrumbs shadowRoot to exist');
        return;
      }

      const crumbs = Array.from(container.shadowRoot.querySelectorAll('[data-crumb]'));

      const crumbTitles = crumbs.map(crumb => {
        if (crumb.textContent) {
          return crumb.textContent.trim();
        } else {
          assert.fail('crumb unexpectedly had no textContent');
          return '';
        }
      });

      assert.deepEqual(crumbTitles, ['body', 'div#test-id']);
    });

    it('shows the scrolling icons if the crumbs do not fit', () => {
      const thinWrapper = document.createElement('div');
      thinWrapper.style.width = '100px';

      const container = document.createElement('devtools-elements-breadcrumbs');
      thinWrapper.appendChild(container);
      document.body.appendChild(thinWrapper);

      const bodyCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 2,
        nodeName: 'body',
        nodeNameNicelyCased: 'body',
        getAttribute(attr) {
          if (attr === 'class') {
            return 'test-class1 test-class2 test-class3 test-class4';
          } else {
            return '';
          }
        },
      });

      const divCrumb = makeCrumb({
        nodeType: Node.ELEMENT_NODE,
        id: 3,
        nodeName: 'div',
        nodeNameNicelyCased: 'div',
        getAttribute(attr) {
          if (attr === 'id') {
            return 'test-id-with-a-really-long-id-name';
          } else {
            return '';
          }
        },
      });

      container.update([divCrumb, bodyCrumb], bodyCrumb);

      if (!container.shadowRoot) {
        assert.fail('Expected breadcrumbs shadowRoot to exist');
        return;
      }

      const scrollButtons = container.shadowRoot.querySelectorAll('button.overflow');
      if (!scrollButtons) {
        assert.fail('Expected to find some scrollButtons');
        return;
      }

      assert.equal(scrollButtons.length, 2, 'there are two scroll buttons');

      const leftButton = scrollButtons[0];
      const rightButton = scrollButtons[1];

      assert.equal(leftButton.getAttribute('disabled'), '');
      assert.equal(rightButton.getAttribute('disabled'), null);

      // const crumbs = Array.from(container.shadowRoot.querySelectorAll('[data-crumb]'));

      // const bodyCrumb = crumbs.find(crumb => {
      //   crumb.node
      // })

      // const crumbTitles = crumbs.map(crumb => {
      //   return crumb.textContent?.trim();
      // });

      // assert.deepEqual(crumbTitles, ['body', 'div#test-id']);
    });
  });
});
