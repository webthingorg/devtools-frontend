export class ReportUIFeatures {
    /**
     * The popup's window.name is keyed by version+url+fetchTime, so we reuse/select tabs correctly.
     * @param {LH.Result} json
     * @protected
     */
    protected static computeWindowNameSuffix(json: any): string;
    /**
     * Opens a new tab to the online viewer and sends the local page's JSON results
     * to the online viewer using postMessage.
     * @param {LH.Result} json
     * @protected
     */
    protected static openTabAndSendJsonReportToViewer(json: any): void;
    /**
     * Opens a new tab to the treemap app and sends the JSON results using URL.fragment
     * @param {LH.Result} json
     */
    static openTreemap(json: any): void;
    /**
     * Opens a new tab to an external page and sends data using postMessage.
     * @param {{lhr: LH.Result} | LH.Treemap.Options} data
     * @param {string} url
     * @param {string} windowName
     * @protected
     */
    protected static openTabAndSendData(data: {
        lhr: any;
    } | any, url: string, windowName: string): void;
    /**
     * Opens a new tab to an external page and sends data via base64 encoded url params.
     * @param {{lhr: LH.Result} | LH.Treemap.Options} data
     * @param {string} url_
     * @param {string} windowName
     * @protected
     */
    protected static openTabWithUrlData(data: {
        lhr: any;
    } | any, url_: string, windowName: string): Promise<void>;
    /**
     * @param {DOM} dom
     */
    constructor(dom: DOM);
    /** @type {LH.Result} */
    json: any;
    /** @type {DOM} */
    _dom: DOM;
    /** @type {Document} */
    _document: Document;
    /** @type {ParentNode} */
    _templateContext: ParentNode;
    /** @type {DropDown} */
    _dropDown: DropDown;
    /** @type {boolean} */
    _copyAttempt: boolean;
    /** @type {HTMLElement} */
    topbarEl: HTMLElement;
    /** @type {HTMLElement} */
    scoreScaleEl: HTMLElement;
    /** @type {HTMLElement} */
    stickyHeaderEl: HTMLElement;
    /** @type {HTMLElement} */
    highlightEl: HTMLElement;
    /**
     * Handle media query change events.
     * @param {MediaQueryList|MediaQueryListEvent} mql
     */
    onMediaQueryChange(mql: MediaQueryList | MediaQueryListEvent): void;
    /**
     * Handle copy events.
     * @param {ClipboardEvent} e
     */
    onCopy(e: ClipboardEvent): void;
    /**
     * Handler for tool button.
     * @param {Event} e
     */
    onDropDownMenuClick(e: Event): void;
    /**
     * Keyup handler for the document.
     * @param {KeyboardEvent} e
     */
    onKeyUp(e: KeyboardEvent): void;
    /**
     * Collapses all audit `<details>`.
     * open a `<details>` element.
     */
    collapseAllDetails(): void;
    /**
     * Expands all audit `<details>`.
     * Ideally, a print stylesheet could take care of this, but CSS has no way to
     * open a `<details>` element.
     */
    expandAllDetails(): void;
    /**
     * @private
     * @param {boolean} [force]
     */
    private _toggleDarkTheme;
    _updateStickyHeaderOnScroll(): void;
    /**
     * Adds tools button, print, and other functionality to the report. The method
     * should be called whenever the report needs to be re-rendered.
     * @param {LH.Result} report
     */
    initFeatures(report: any): void;
    /**
     * Define a custom element for <templates> to be extracted from. For example:
     *     this.setTemplateContext(new DOMParser().parseFromString(htmlStr, 'text/html'))
     * @param {ParentNode} context
     */
    setTemplateContext(context: ParentNode): void;
    /**
     * @param {{container?: Element, text: string, icon?: string, onClick: () => void}} opts
     */
    addButton(opts: {
        container?: Element;
        text: string;
        icon?: string;
        onClick: () => void;
    }): HTMLButtonElement;
    /**
     * Finds the first scrollable ancestor of `element`. Falls back to the document.
     * @param {Element} element
     * @return {Node}
     */
    _getScrollParent(element: Element): Node;
    _enableFireworks(): void;
    /**
     * Fires a custom DOM event on target.
     * @param {string} name Name of the event.
     * @param {Node=} target DOM node to fire the event on.
     * @param {*=} detail Custom data to include.
     */
    _fireEventOn(name: string, target?: Node | undefined, detail?: any | undefined): void;
    _setupMediaQueryListeners(): void;
    _setupThirdPartyFilter(): void;
    /**
     * @param {Element} el
     */
    _setupElementScreenshotOverlay(el: Element): void;
    /**
     * From a table with URL entries, finds the rows containing third-party URLs
     * and returns them.
     * @param {HTMLElement[]} rowEls
     * @param {string} finalUrl
     * @return {Array<HTMLElement>}
     */
    _getThirdPartyRows(rowEls: HTMLElement[], finalUrl: string): Array<HTMLElement>;
    _setupStickyHeaderElements(): void;
    /**
     * Copies the report JSON to the clipboard (if supported by the browser).
     */
    onCopyButtonClick(): void;
    /**
     * Resets the state of page before capturing the page for export.
     * When the user opens the exported HTML page, certain UI elements should
     * be in their closed state (not opened) and the templates should be unstamped.
     */
    _resetUIState(): void;
    _print(): void;
    /**
     * Sets up listeners to collapse audit `<details>` when the user closes the
     * print dialog, all `<details>` are collapsed.
     */
    _setUpCollapseDetailsAfterPrinting(): void;
    /**
     * Returns the html that recreates this report.
     * @return {string}
     * @protected
     */
    protected getReportHtml(): string;
    /**
     * Save json as a gist. Unimplemented in base UI features.
     * @protected
     */
    protected saveAsGist(): void;
    /**
     * Downloads a file (blob) using a[download].
     * @param {Blob|File} blob The file to save.
     * @private
     */
    protected _saveFile(blob: Blob|File): Promise<void>;
}
export type DOM = import('./dom').DOM;
declare class DropDown {
    /**
     * @param {DOM} dom
     */
    constructor(dom: DOM);
    /** @type {DOM} */
    _dom: DOM;
    /** @type {HTMLElement} */
    _toggleEl: HTMLElement;
    /** @type {HTMLElement} */
    _menuEl: HTMLElement;
    /**
     * Keydown handler for the document.
     * @param {KeyboardEvent} e
     */
    onDocumentKeyDown(e: KeyboardEvent): void;
    /**
     * Click handler for tools button.
     * @param {Event} e
     */
    onToggleClick(e: Event): void;
    /**
     * Handler for tool button.
     * @param {KeyboardEvent} e
     */
    onToggleKeydown(e: KeyboardEvent): void;
    /**
     * Focus out handler for the drop down menu.
     * @param {FocusEvent} e
     */
    onMenuFocusOut(e: FocusEvent): void;
    /**
     * Handler for tool DropDown.
     * @param {KeyboardEvent} e
     */
    onMenuKeydown(e: KeyboardEvent): void;
    /**
     * @param {?HTMLElement=} startEl
     * @returns {HTMLElement}
     */
    _getNextMenuItem(startEl?: (HTMLElement | null) | undefined): HTMLElement;
    /**
     * @param {Array<Node>} allNodes
     * @param {?HTMLElement=} startNode
     * @returns {HTMLElement}
     */
    _getNextSelectableNode(allNodes: Array<Node>, startNode?: (HTMLElement | null) | undefined): HTMLElement;
    /**
     * @param {?HTMLElement=} startEl
     * @returns {HTMLElement}
     */
    _getPreviousMenuItem(startEl?: (HTMLElement | null) | undefined): HTMLElement;
    /**
     * @param {function(MouseEvent): any} menuClickHandler
     */
    setup(menuClickHandler: (arg0: MouseEvent) => any): void;
    close(): void;
    /**
     * @param {HTMLElement} firstFocusElement
     */
    open(firstFocusElement: HTMLElement): void;
}
export {};
