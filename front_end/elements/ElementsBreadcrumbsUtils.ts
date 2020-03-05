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


export const makeCrumbTitle = (main: string, extras = {}): CrumbTitle => {
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
