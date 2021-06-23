export class CategoryRenderer {
    /**
     * @param {DOM} dom
     * @param {DetailsRenderer} detailsRenderer
     */
    constructor(dom: DOM, detailsRenderer: DetailsRenderer);
    /** @type {DOM} */
    dom: DOM;
    /** @type {DetailsRenderer} */
    detailsRenderer: DetailsRenderer;
    /** @type {ParentNode} */
    templateContext: ParentNode;
    /**
     * Display info per top-level clump. Define on class to avoid race with Util init.
     */
    get _clumpTitles(): {
        warning: string;
        manual: string;
        passed: string;
        notApplicable: string;
    };
    /**
     * @param {LH.ReportResult.AuditRef} audit
     * @return {Element}
     */
    renderAudit(audit: any): Element;
    /**
     * Populate an DOM tree with audit details. Used by renderAudit and renderOpportunity
     * @param {LH.ReportResult.AuditRef} audit
     * @param {DocumentFragment} tmpl
     * @return {!Element}
     */
    populateAuditValues(audit: any, tmpl: DocumentFragment): Element;
    /**
     * @return {Element}
     */
    _createChevron(): Element;
    /**
     * @param {Element} element DOM node to populate with values.
     * @param {number|null} score
     * @param {string} scoreDisplayMode
     * @return {!Element}
     */
    _setRatingClass(element: Element, score: number | null, scoreDisplayMode: string): Element;
    /**
     * @param {LH.ReportResult.Category} category
     * @param {Record<string, LH.Result.ReportGroup>} groupDefinitions
     * @return {DocumentFragment}
     */
    renderCategoryHeader(category: any, groupDefinitions: Record<string, any>): DocumentFragment;
    /**
     * Renders the group container for a group of audits. Individual audit elements can be added
     * directly to the returned element.
     * @param {LH.Result.ReportGroup} group
     * @return {Element}
     */
    renderAuditGroup(group: any): Element;
    /**
     * Takes an array of auditRefs, groups them if requested, then returns an
     * array of audit and audit-group elements.
     * @param {Array<LH.ReportResult.AuditRef>} auditRefs
     * @param {Object<string, LH.Result.ReportGroup>} groupDefinitions
     * @return {Array<Element>}
     */
    _renderGroupedAudits(auditRefs: Array<any>, groupDefinitions: {
        [x: string]: any;
    }): Array<Element>;
    /**
     * Take a set of audits, group them if they have groups, then render in a top-level
     * clump that can't be expanded/collapsed.
     * @param {Array<LH.ReportResult.AuditRef>} auditRefs
     * @param {Object<string, LH.Result.ReportGroup>} groupDefinitions
     * @return {Element}
     */
    renderUnexpandableClump(auditRefs: Array<any>, groupDefinitions: {
        [x: string]: any;
    }): Element;
    /**
     * Take a set of audits and render in a top-level, expandable clump that starts
     * in a collapsed state.
     * @param {Exclude<TopLevelClumpId, 'failed'>} clumpId
     * @param {{auditRefs: Array<LH.ReportResult.AuditRef>, description?: string}} clumpOpts
     * @return {!Element}
     */
    renderClump(clumpId: Exclude<TopLevelClumpId, 'failed'>, { auditRefs, description }: {
        auditRefs: Array<any>;
        description?: string;
    }): Element;
    /**
     * @param {ParentNode} context
     */
    setTemplateContext(context: ParentNode): void;
    /**
     * @param {LH.ReportResult.Category} category
     * @param {Record<string, LH.Result.ReportGroup>} groupDefinitions
     * @return {DocumentFragment}
     */
    renderScoreGauge(category: any, groupDefinitions: Record<string, any>): DocumentFragment;
    /**
     * Returns true if an LH category has any non-"notApplicable" audits.
     * @param {LH.ReportResult.Category} category
     * @return {boolean}
     */
    hasApplicableAudits(category: any): boolean;
    /**
     * Define the score arc of the gauge
     * Credit to xgad for the original technique: https://codepen.io/xgad/post/svg-radial-progress-meters
     * @param {SVGCircleElement} arcElem
     * @param {number} percent
     */
    _setGaugeArc(arcElem: SVGCircleElement, percent: number): void;
    /**
     * @param {LH.ReportResult.AuditRef} audit
     * @return {boolean}
     */
    _auditHasWarning(audit: any): boolean;
    /**
     * Returns the id of the top-level clump to put this audit in.
     * @param {LH.ReportResult.AuditRef} auditRef
     * @return {TopLevelClumpId}
     */
    _getClumpIdForAuditRef(auditRef: any): TopLevelClumpId;
    /**
     * Renders a set of top level sections (clumps), under a status of failed, warning,
     * manual, passed, or notApplicable. The result ends up something like:
     *
     * failed clump
     *   ├── audit 1 (w/o group)
     *   ├── audit 2 (w/o group)
     *   ├── audit group
     *   |  ├── audit 3
     *   |  └── audit 4
     *   └── audit group
     *      ├── audit 5
     *      └── audit 6
     * other clump (e.g. 'manual')
     *   ├── audit 1
     *   ├── audit 2
     *   ├── …
     *   ⋮
     * @param {LH.ReportResult.Category} category
     * @param {Object<string, LH.Result.ReportGroup>} [groupDefinitions]
     * @return {Element}
     */
    render(category: any, groupDefinitions?: {
        [x: string]: any;
    }): Element;
    /**
     * Create a non-semantic span used for hash navigation of categories
     * @param {Element} element
     * @param {string} id
     */
    createPermalinkSpan(element: Element, id: string): void;
}
export type DOM = import('./dom.js').DOM;
export type ReportRenderer = import('./report-renderer.js').ReportRenderer;
export type DetailsRenderer = import('./details-renderer.js').DetailsRenderer;
export type TopLevelClumpId = 'failed' | 'warning' | 'manual' | 'passed' | 'notApplicable';
