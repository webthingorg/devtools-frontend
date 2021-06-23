export class DOM {
    /**
     * @param {Document} document
     */
    constructor(document: Document);
    /** @type {Document} */
    _document: Document;
    /** @type {string} */
    _lighthouseChannel: string;
    /**
     * @template {string} T
     * @param {T} name
     * @param {string=} className
     * @param {Object<string, (string|undefined)>=} attrs Attribute key/val pairs.
     *     Note: if an attribute key has an undefined value, this method does not
     *     set the attribute on the node.
     * @return {HTMLElementByTagName[T]}
     */
    createElement<T extends string>(name: T, className?: string | undefined, attrs?: {
        [x: string]: (string | undefined);
    } | undefined): HTMLElementByTagName[T];
    /**
     * @param {string} namespaceURI
     * @param {string} name
     * @param {string=} className
     * @param {Object<string, (string|undefined)>=} attrs Attribute key/val pairs.
     *     Note: if an attribute key has an undefined value, this method does not
     *     set the attribute on the node.
     * @return {Element}
     */
    createElementNS(namespaceURI: string, name: string, className?: string | undefined, attrs?: {
        [x: string]: (string | undefined);
    } | undefined): Element;
    /**
     * @return {!DocumentFragment}
     */
    createFragment(): DocumentFragment;
    /**
     * @template {string} T
     * @param {Element} parentElem
     * @param {T} elementName
     * @param {string=} className
     * @param {Object<string, (string|undefined)>=} attrs Attribute key/val pairs.
     *     Note: if an attribute key has an undefined value, this method does not
     *     set the attribute on the node.
     * @return {HTMLElementByTagName[T]}
     */
    createChildOf<T_2 extends string>(parentElem: Element, elementName: T_2, className?: string | undefined, attrs?: {
        [x: string]: (string | undefined);
    } | undefined): HTMLElementByTagName[T_2];
    /**
     * @param {string} selector
     * @param {ParentNode} context
     * @return {!DocumentFragment} A clone of the template content.
     * @throws {Error}
     */
    cloneTemplate(selector: string, context: ParentNode): DocumentFragment;
    /**
     * Resets the "stamped" state of the templates.
     */
    resetTemplates(): void;
    /**
     * @param {string} text
     * @return {Element}
     */
    convertMarkdownLinkSnippets(text: string): Element;
    /**
     * @param {string} markdownText
     * @return {Element}
     */
    convertMarkdownCodeSnippets(markdownText: string): Element;
    /**
     * The channel to use for UTM data when rendering links to the documentation.
     * @param {string} lighthouseChannel
     */
    setLighthouseChannel(lighthouseChannel: string): void;
    /**
     * @return {Document}
     */
    document(): Document;
    /**
     * TODO(paulirish): import and conditionally apply the DevTools frontend subclasses instead of this
     * @return {boolean}
     */
    isDevTools(): boolean;
    /**
     * Guaranteed context.querySelector. Always returns an element or throws if
     * nothing matches query.
     * @template {string} T
     * @param {T} query
     * @param {ParentNode} context
     * @return {ParseSelector<T>}
     */
    find<T_4 extends string>(query: T_4, context: ParentNode): import("typed-query-selector/parser").ParseSelector<T_4, Element>;
    /**
     * Helper for context.querySelectorAll. Returns an Array instead of a NodeList.
     * @template {string} T
     * @param {T} query
     * @param {ParentNode} context
     */
    findAll<T_6 extends string>(query: T_6, context: ParentNode): Element[];
}
export type HTMLElementByTagName = HTMLElementTagNameMap & {
    [id: string]: HTMLElement;
};
export type ParseSelector<T extends string> = import('typed-query-selector/parser').ParseSelector<T, Element>;
