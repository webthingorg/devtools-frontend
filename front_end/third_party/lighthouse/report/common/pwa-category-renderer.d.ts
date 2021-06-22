export class PwaCategoryRenderer extends CategoryRenderer {
    /**
     * Alters SVG id references so multiple instances of an SVG element can coexist
     * in a single page. If `svgRoot` has a `<defs>` block, gives all elements defined
     * in it unique ids, then updates id references (`<use xlink:href="...">`,
     * `fill="url(#...)"`) to the altered ids in all descendents of `svgRoot`.
     * @param {SVGElement} svgRoot
     */
    static _makeSvgReferencesUnique(svgRoot: SVGElement): void;
    /**
     * Returns the group IDs found in auditRefs.
     * @param {Array<LH.ReportResult.AuditRef>} auditRefs
     * @return {!Set<string>}
     */
    _getGroupIds(auditRefs: Array<any>): Set<string>;
    /**
     * Returns the group IDs whose audits are all considered passing.
     * @param {Array<LH.ReportResult.AuditRef>} auditRefs
     * @return {Set<string>}
     */
    _getPassingGroupIds(auditRefs: Array<any>): Set<string>;
    /**
     * Returns a tooltip string summarizing group pass rates.
     * @param {Array<LH.ReportResult.AuditRef>} auditRefs
     * @param {Record<string, LH.Result.ReportGroup>} groupDefinitions
     * @return {string}
     */
    _getGaugeTooltip(auditRefs: Array<any>, groupDefinitions: Record<string, any>): string;
    /**
     * Render non-manual audits in groups, giving a badge to any group that has
     * all passing audits.
     * @param {Array<LH.ReportResult.AuditRef>} auditRefs
     * @param {Object<string, LH.Result.ReportGroup>} groupDefinitions
     * @return {Element}
     */
    _renderAudits(auditRefs: Array<any>, groupDefinitions: {
        [x: string]: any;
    }): Element;
}
import { CategoryRenderer } from "./category-renderer.js";
