export class DetailsRenderer {
    /**
     * @param {DOM} dom
     * @param {{fullPageScreenshot?: LH.Artifacts.FullPageScreenshot}} [options]
     */
    constructor(dom: DOM, options?: {
        fullPageScreenshot?: any;
    });
    _dom: import("./dom.js").DOM;
    _fullPageScreenshot: any;
    /** @type {ParentNode} */
    _templateContext: ParentNode;
    /**
     * @param {ParentNode} context
     */
    setTemplateContext(context: ParentNode): void;
    /**
     * @param {AuditDetails} details
     * @return {Element|null}
     */
    render(details: any): Element | null;
    /**
     * @param {{value: number, granularity?: number}} details
     * @return {Element}
     */
    _renderBytes(details: {
        value: number;
        granularity?: number;
    }): Element;
    /**
     * @param {{value: number, granularity?: number, displayUnit?: string}} details
     * @return {Element}
     */
    _renderMilliseconds(details: {
        value: number;
        granularity?: number;
        displayUnit?: string;
    }): Element;
    /**
     * @param {string} text
     * @return {HTMLElement}
     */
    renderTextURL(text: string): HTMLElement;
    /**
     * @param {{text: string, url: string}} details
     * @return {HTMLElement}
     */
    _renderLink(details: {
        text: string;
        url: string;
    }): HTMLElement;
    /**
     * @param {string} text
     * @return {HTMLDivElement}
     */
    _renderText(text: string): HTMLDivElement;
    /**
     * @param {{value: number, granularity?: number}} details
     * @return {Element}
     */
    _renderNumeric(details: {
        value: number;
        granularity?: number;
    }): Element;
    /**
     * Create small thumbnail with scaled down image asset.
     * @param {string} details
     * @return {Element}
     */
    _renderThumbnail(details: string): Element;
    /**
     * @param {string} type
     * @param {*} value
     */
    _renderUnknown(type: string, value: any): HTMLDetailsElement;
    /**
     * Render a details item value for embedding in a table. Renders the value
     * based on the heading's valueType, unless the value itself has a `type`
     * property to override it.
     * @param {TableItemValue} value
     * @param {LH.Audit.Details.OpportunityColumnHeading} heading
     * @return {Element|null}
     */
    _renderTableValue(value: any, heading: any): Element | null;
    /**
     * Get the headings of a table-like details object, converted into the
     * OpportunityColumnHeading type until we have all details use the same
     * heading format.
     * @param {Table|OpportunityTable} tableLike
     * @return {OpportunityTable['headings']}
     */
    _getCanonicalizedHeadingsFromTable(tableLike: Table | OpportunityTable): any;
    /**
     * Get the headings of a table-like details object, converted into the
     * OpportunityColumnHeading type until we have all details use the same
     * heading format.
     * @param {Table['headings'][number]} heading
     * @return {OpportunityTable['headings'][number]}
     */
    _getCanonicalizedHeading(heading: any): any;
    /**
     * @param {Exclude<LH.Audit.Details.TableColumnHeading['subItemsHeading'], undefined>} subItemsHeading
     * @param {LH.Audit.Details.TableColumnHeading} parentHeading
     * @return {LH.Audit.Details.OpportunityColumnHeading['subItemsHeading']}
     */
    _getCanonicalizedsubItemsHeading(subItemsHeading: Exclude<any['subItemsHeading'], undefined>, parentHeading: any): any;
    /**
     * Returns a new heading where the values are defined first by `heading.subItemsHeading`,
     * and secondly by `heading`. If there is no subItemsHeading, returns null, which will
     * be rendered as an empty column.
     * @param {LH.Audit.Details.OpportunityColumnHeading} heading
     * @return {LH.Audit.Details.OpportunityColumnHeading | null}
     */
    _getDerivedsubItemsHeading(heading: any): any | null;
    /**
     * @param {TableItem} item
     * @param {(LH.Audit.Details.OpportunityColumnHeading | null)[]} headings
     */
    _renderTableRow(item: any, headings: (any | null)[]): HTMLTableRowElement;
    /**
     * Renders one or more rows from a details table item. A single table item can
     * expand into multiple rows, if there is a subItemsHeading.
     * @param {TableItem} item
     * @param {LH.Audit.Details.OpportunityColumnHeading[]} headings
     */
    _renderTableRowsFromItem(item: any, headings: any[]): DocumentFragment;
    /**
     * @param {OpportunityTable|Table} details
     * @return {Element}
     */
    _renderTable(details: OpportunityTable | Table): Element;
    /**
     * @param {LH.Audit.Details.List} details
     * @return {Element}
     */
    _renderList(details: any): Element;
    /**
     * @param {LH.Audit.Details.NodeValue} item
     * @return {Element}
     */
    renderNode(item: any): Element;
    /**
     * @param {LH.Audit.Details.SourceLocationValue} item
     * @return {Element|null}
     * @protected
     */
    protected renderSourceLocation(item: any): Element | null;
    /**
     * @param {LH.Audit.Details.Filmstrip} details
     * @return {Element}
     */
    _renderFilmstrip(details: any): Element;
    /**
     * @param {string} text
     * @return {Element}
     */
    _renderCode(text: string): Element;
}
export type DOM = import('./dom.js').DOM;
export type AuditDetails = any;
export type OpportunityTable = any;
export type Table = any;
export type TableItem = any;
export type TableItemValue = any;
