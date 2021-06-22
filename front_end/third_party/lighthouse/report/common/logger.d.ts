/**
 * Logs messages via a UI butter.
 */
export class Logger {
    /**
     * @param {Element} element
     */
    constructor(element: Element);
    el: Element;
    _id: NodeJS.Timeout;
    /**
     * Shows a butter bar.
     * @param {string} msg The message to show.
     * @param {boolean=} autoHide True to hide the message after a duration.
     *     Default is true.
     */
    log(msg: string, autoHide?: boolean | undefined): void;
    /**
     * @param {string} msg
     */
    warn(msg: string): void;
    /**
     * @param {string} msg
     */
    error(msg: string): void;
    /**
     * Explicitly hides the butter bar.
     */
    hide(): void;
}
