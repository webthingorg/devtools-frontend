export class ReportRenderer {
    /**
     * @param {DOM} dom
     */
    constructor(dom: DOM);
    /** @type {DOM} */
    _dom: DOM;
    /** @type {ParentNode} */
    _templateContext: ParentNode;
    /**
     * @param {LH.Result} result
     * @param {Element} container Parent element to render the report into.
     * @return {!Element}
     */
    renderReport(result: any, container: Element): Element;
    /**
     * Define a custom element for <templates> to be extracted from. For example:
     *     this.setTemplateContext(new DOMParser().parseFromString(htmlStr, 'text/html'))
     * @param {ParentNode} context
     */
    setTemplateContext(context: ParentNode): void;
    /**
     * @param {LH.ReportResult} report
     * @return {DocumentFragment}
     */
    _renderReportTopbar(report: any): DocumentFragment;
    /**
     * @return {DocumentFragment}
     */
    _renderReportHeader(): DocumentFragment;
    /**
     * @param {LH.ReportResult} report
     * @return {DocumentFragment}
     */
    _renderReportFooter(report: any): DocumentFragment;
    /**
     * Returns a div with a list of top-level warnings, or an empty div if no warnings.
     * @param {LH.ReportResult} report
     * @return {Node}
     */
    _renderReportWarnings(report: any): Node;
    /**
     * @param {LH.ReportResult} report
     * @param {CategoryRenderer} categoryRenderer
     * @param {Record<string, CategoryRenderer>} specificCategoryRenderers
     * @return {!DocumentFragment[]}
     */
    _renderScoreGauges(report: any, categoryRenderer: CategoryRenderer, specificCategoryRenderers: Record<string, CategoryRenderer>): DocumentFragment[];
    /**
     * @param {LH.ReportResult} report
     * @return {!DocumentFragment}
     */
    _renderReport(report: any): DocumentFragment;
}
export type DOM = import('./dom.js').DOM;
import { CategoryRenderer } from "./category-renderer.js";
