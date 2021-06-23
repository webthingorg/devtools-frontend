export class Util {
    static get PASS_THRESHOLD(): number;
    static get MS_DISPLAY_VALUE(): string;
    /**
     * Returns a new LHR that's reshaped for slightly better ergonomics within the report rendereer.
     * Also, sets up the localized UI strings used within renderer and makes changes to old LHRs to be
     * compatible with current renderer.
     * The LHR passed in is not mutated.
     * TODO(team): we all agree the LHR shape change is technical debt we should fix
     * @param {LH.Result} result
     * @return {LH.ReportResult}
     */
    static prepareReportResult(result: any): any;
    /**
     * Used to determine if the "passed" for the purposes of showing up in the "failed" or "passed"
     * sections of the report.
     *
     * @param {{score: (number|null), scoreDisplayMode: string}} audit
     * @return {boolean}
     */
    static showAsPassed(audit: {
        score: (number | null);
        scoreDisplayMode: string;
    }): boolean;
    /**
     * Convert a score to a rating label.
     * @param {number|null} score
     * @param {string=} scoreDisplayMode
     * @return {string}
     */
    static calculateRating(score: number | null, scoreDisplayMode?: string | undefined): string;
    /**
     * Split a string by markdown code spans (enclosed in `backticks`), splitting
     * into segments that were enclosed in backticks (marked as `isCode === true`)
     * and those that outside the backticks (`isCode === false`).
     * @param {string} text
     * @return {Array<{isCode: true, text: string}|{isCode: false, text: string}>}
     */
    static splitMarkdownCodeSpans(text: string): Array<{
        isCode: true;
        text: string;
    } | {
        isCode: false;
        text: string;
    }>;
    /**
     * Split a string on markdown links (e.g. [some link](https://...)) into
     * segments of plain text that weren't part of a link (marked as
     * `isLink === false`), and segments with text content and a URL that did make
     * up a link (marked as `isLink === true`).
     * @param {string} text
     * @return {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>}
     */
    static splitMarkdownLink(text: string): Array<{
        isLink: true;
        text: string;
        linkHref: string;
    } | {
        isLink: false;
        text: string;
    }>;
    /**
     * @param {URL} parsedUrl
     * @param {{numPathParts?: number, preserveQuery?: boolean, preserveHost?: boolean}=} options
     * @return {string}
     */
    static getURLDisplayName(parsedUrl: URL, options?: {
        numPathParts?: number;
        preserveQuery?: boolean;
        preserveHost?: boolean;
    }): string;
    /**
     * Split a URL into a file, hostname and origin for easy display.
     * @param {string} url
     * @return {{file: string, hostname: string, origin: string}}
     */
    static parseURL(url: string): {
        file: string;
        hostname: string;
        origin: string;
    };
    /**
     * @param {string|URL} value
     * @return {!URL}
     */
    static createOrReturnURL(value: string | URL): URL;
    /**
     * Gets the tld of a domain
     *
     * @param {string} hostname
     * @return {string} tld
     */
    static getTld(hostname: string): string;
    /**
     * Returns a primary domain for provided hostname (e.g. www.example.com -> example.com).
     * @param {string|URL} url hostname or URL object
     * @returns {string}
     */
    static getRootDomain(url: string | URL): string;
    /**
     * @param {LH.Config.Settings} settings
     * @return {!Array<{name: string, description: string}>}
     */
    static getEnvironmentDisplayValues(settings: any): Array<{
        name: string;
        description: string;
    }>;
    /**
     * @param {LH.Config.Settings} settings
     * @return {{deviceEmulation: string, networkThrottling: string, cpuThrottling: string}}
     */
    static getEmulationDescriptions(settings: any): {
        deviceEmulation: string;
        networkThrottling: string;
        cpuThrottling: string;
    };
    /**
     * Returns only lines that are near a message, or the first few lines if there are
     * no line messages.
     * @param {LH.Audit.Details.SnippetValue['lines']} lines
     * @param {LH.Audit.Details.SnippetValue['lineMessages']} lineMessages
     * @param {number} surroundingLineCount Number of lines to include before and after
     * the message. If this is e.g. 2 this function might return 5 lines.
     */
    static filterRelevantLines(lines: any, lineMessages: any, surroundingLineCount: number): any;
    /**
     * @param {string} categoryId
     */
    static isPluginCategory(categoryId: string): boolean;
}
export namespace Util {
    const reportJson: any | null;
    function getUniqueSuffix(): number;
    const i18n: I18n<typeof Util['UIStrings']>;
    namespace UIStrings {
        const varianceDisclaimer: string;
        const calculatorLink: string;
        const showRelevantAudits: string;
        const opportunityResourceColumnLabel: string;
        const opportunitySavingsColumnLabel: string;
        const errorMissingAuditInfo: string;
        const errorLabel: string;
        const warningHeader: string;
        const warningAuditsGroupTitle: string;
        const passedAuditsGroupTitle: string;
        const notApplicableAuditsGroupTitle: string;
        const manualAuditsGroupTitle: string;
        const toplevelWarningsMessage: string;
        const crcInitialNavigation: string;
        const crcLongestDurationLabel: string;
        const snippetExpandButtonLabel: string;
        const snippetCollapseButtonLabel: string;
        const lsPerformanceCategoryDescription: string;
        const labDataTitle: string;
        const thirdPartyResourcesLabel: string;
        const viewTreemapLabel: string;
        const dropdownPrintSummary: string;
        const dropdownPrintExpanded: string;
        const dropdownCopyJSON: string;
        const dropdownSaveHTML: string;
        const dropdownSaveJSON: string;
        const dropdownViewer: string;
        const dropdownSaveGist: string;
        const dropdownDarkTheme: string;
        const runtimeSettingsTitle: string;
        const runtimeSettingsUrl: string;
        const runtimeSettingsFetchTime: string;
        const runtimeSettingsDevice: string;
        const runtimeSettingsNetworkThrottling: string;
        const runtimeSettingsCPUThrottling: string;
        const runtimeSettingsChannel: string;
        const runtimeSettingsUA: string;
        const runtimeSettingsUANetwork: string;
        const runtimeSettingsBenchmark: string;
        const runtimeSettingsAxeVersion: string;
        const footerIssue: string;
        const runtimeNoEmulation: string;
        const runtimeMobileEmulation: string;
        const runtimeDesktopEmulation: string;
        const runtimeUnknown: string;
        const throttlingProvided: string;
    }
}
export type I18n<T> = import('./i18n').I18n<T>;
