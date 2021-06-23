export class PerformanceCategoryRenderer extends CategoryRenderer {
    /**
     * @param {LH.ReportResult.AuditRef} audit
     * @return {!Element}
     */
    _renderMetric(audit: any): Element;
    /**
     * @param {LH.ReportResult.AuditRef} audit
     * @param {number} scale
     * @return {!Element}
     */
    _renderOpportunity(audit: any, scale: number): Element;
    /**
     * Get an audit's wastedMs to sort the opportunity by, and scale the sparkline width
     * Opportunities with an error won't have a details object, so MIN_VALUE is returned to keep any
     * erroring opportunities last in sort order.
     * @param {LH.ReportResult.AuditRef} audit
     * @return {number}
     */
    _getWastedMs(audit: any): number;
    /**
     * Get a link to the interactive scoring calculator with the metric values.
     * @param {LH.ReportResult.AuditRef[]} auditRefs
     * @return {string}
     */
    _getScoringCalculatorHref(auditRefs: any[]): string;
    /**
     * Render the control to filter the audits by metric. The filtering is done at runtime by CSS only
     * @param {LH.ReportResult.AuditRef[]} filterableMetrics
     * @param {HTMLDivElement} categoryEl
     */
    renderMetricAuditFilter(filterableMetrics: any[], categoryEl: HTMLDivElement): void;
}
export type DOM = import('./dom.js').DOM;
import { CategoryRenderer } from "./category-renderer.js";
