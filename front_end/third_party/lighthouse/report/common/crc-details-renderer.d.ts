export class CriticalRequestChainRenderer {
    /**
     * Create render context for critical-request-chain tree display.
     * @param {LH.Audit.SimpleCriticalRequestNode} tree
     * @return {{tree: LH.Audit.SimpleCriticalRequestNode, startTime: number, transferSize: number}}
     */
    static initTree(tree: any): {
        tree: any;
        startTime: number;
        transferSize: number;
    };
    /**
     * Helper to create context for each critical-request-chain node based on its
     * parent. Calculates if this node is the last child, whether it has any
     * children itself and what the tree looks like all the way back up to the root,
     * so the tree markers can be drawn correctly.
     * @param {LH.Audit.SimpleCriticalRequestNode} parent
     * @param {string} id
     * @param {number} startTime
     * @param {number} transferSize
     * @param {Array<boolean>=} treeMarkers
     * @param {boolean=} parentIsLastChild
     * @return {CRCSegment}
     */
    static createSegment(parent: any, id: string, startTime: number, transferSize: number, treeMarkers?: Array<boolean> | undefined, parentIsLastChild?: boolean | undefined): CRCSegment;
    /**
     * Creates the DOM for a tree segment.
     * @param {DOM} dom
     * @param {DocumentFragment} tmpl
     * @param {CRCSegment} segment
     * @param {DetailsRenderer} detailsRenderer
     * @return {Node}
     */
    static createChainNode(dom: DOM, tmpl: DocumentFragment, segment: CRCSegment, detailsRenderer: DetailsRenderer): Node;
    /**
     * Recursively builds a tree from segments.
     * @param {DOM} dom
     * @param {DocumentFragment} tmpl
     * @param {CRCSegment} segment
     * @param {Element} elem Parent element.
     * @param {LH.Audit.Details.CriticalRequestChain} details
     * @param {DetailsRenderer} detailsRenderer
     */
    static buildTree(dom: DOM, tmpl: DocumentFragment, segment: CRCSegment, elem: Element, details: any, detailsRenderer: DetailsRenderer): void;
    /**
     * @param {DOM} dom
     * @param {ParentNode} templateContext
     * @param {LH.Audit.Details.CriticalRequestChain} details
     * @param {DetailsRenderer} detailsRenderer
     * @return {Element}
     */
    static render(dom: DOM, templateContext: ParentNode, details: any, detailsRenderer: DetailsRenderer): Element;
}
export type DOM = import('./dom.js').DOM;
export type DetailsRenderer = import('./details-renderer.js').DetailsRenderer;
export type CRCSegment = {
    node: any[string];
    isLastChild: boolean;
    hasChildren: boolean;
    startTime: number;
    transferSize: number;
    treeMarkers: Array<boolean>;
};
