import {ls} from '../common/UIString';

export interface DOMNode {
  parentNode?: DOMNode;
  id: number;
  nodeType: number;
  pseudoType: string;
  shadowRootType: string;
  nodeName: string;
  nodeNameNicelyCased: string;
  legacyDomNode: unknown;
  highlightNode: () => void;
  clearHighlight: () => void;
  getAttribute: (attr: string) => string;
}

export type UserScrollPosition = 'start'|'middle'|'end';

export interface Crumb {
  title: CrumbTitle;
  selected: boolean;
  node: DOMNode;
  originalNode: unknown;
}

export interface CrumbTitle {
  main: string;
  extras: {id?: string; classes?: string[];};
}


const makeCrumbTitle = (main: string, extras = {}): CrumbTitle => {
  return {
    main,
    extras,
  };
};

export class NodeSelectedEvent extends Event {
  data: unknown

  constructor(private node: DOMNode) {
    super('node-selected', {});
    this.data = node.legacyDomNode;
  }
}

export const determineElementTitle = (domNode: DOMNode): CrumbTitle => {
  switch (domNode.nodeType) {
    case Node.ELEMENT_NODE:
      if (domNode.pseudoType) {
        return makeCrumbTitle('::' + domNode.pseudoType);
      }
      const crumbTitle: CrumbTitle = makeCrumbTitle(domNode.nodeNameNicelyCased);

      const id = domNode.getAttribute('id');
      if (id) {
        crumbTitle.extras.id = id;
      }

      const classAttribute = domNode.getAttribute('class');
      if (classAttribute) {
        const classes = new Set(classAttribute.split(/\s+/));
        crumbTitle.extras.classes = Array.from(classes);
      }

      return crumbTitle;

    case Node.TEXT_NODE:
      return makeCrumbTitle(ls`(text)`);
    case Node.COMMENT_NODE:
      return makeCrumbTitle('<!-->');
    case Node.DOCUMENT_TYPE_NODE:
      return makeCrumbTitle('<!doctype>');
    case Node.DOCUMENT_FRAGMENT_NODE:
      return makeCrumbTitle(domNode.shadowRootType ? '#shadow-root' : domNode.nodeNameNicelyCased);
    default:
      return makeCrumbTitle(domNode.nodeNameNicelyCased);
  }
};
