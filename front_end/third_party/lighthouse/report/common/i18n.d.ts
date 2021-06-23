/**
 * @template T
 */
export class I18n<T> {
    /**
     * @param {LH.Locale} locale
     * @param {T} strings
     */
    constructor(locale: any, strings: T);
    _numberDateLocale: any;
    _numberFormatter: Intl.NumberFormat;
    _percentFormatter: Intl.NumberFormat;
    _strings: T;
    get strings(): T;
    /**
     * Format number.
     * @param {number} number
     * @param {number=} granularity Number of decimal places to include. Defaults to 0.1.
     * @return {string}
     */
    formatNumber(number: number, granularity?: number | undefined): string;
    /**
     * Format percent.
     * @param {number} number 0–1
     * @return {string}
     */
    formatPercent(number: number): string;
    /**
     * @param {number} size
     * @param {number=} granularity Controls how coarse the displayed value is, defaults to 0.1
     * @return {string}
     */
    formatBytesToKiB(size: number, granularity?: number | undefined): string;
    /**
     * @param {number} size
     * @param {number=} granularity Controls how coarse the displayed value is, defaults to 0.1
     * @return {string}
     */
    formatBytesToMiB(size: number, granularity?: number | undefined): string;
    /**
     * @param {number} size
     * @param {number=} granularity Controls how coarse the displayed value is, defaults to 1
     * @return {string}
     */
    formatBytes(size: number, granularity?: number | undefined): string;
    /**
     * @param {number} size
     * @param {number=} granularity Controls how coarse the displayed value is, defaults to 0.1
     * @return {string}
     */
    formatBytesWithBestUnit(size: number, granularity?: number | undefined): string;
    /**
     * Format bytes with a constant number of fractional digits, i.e for a granularity of 0.1, 10 becomes '10.0'
     * @param {number} granularity Controls how coarse the displayed value is
     * @return {Intl.NumberFormat}
     */
    _byteFormatterForGranularity(granularity: number): Intl.NumberFormat;
    /**
     * @param {number} ms
     * @param {number=} granularity Controls how coarse the displayed value is, defaults to 10
     * @return {string}
     */
    formatMilliseconds(ms: number, granularity?: number | undefined): string;
    /**
     * @param {number} ms
     * @param {number=} granularity Controls how coarse the displayed value is, defaults to 0.1
     * @return {string}
     */
    formatSeconds(ms: number, granularity?: number | undefined): string;
    /**
     * Format time.
     * @param {string} date
     * @return {string}
     */
    formatDateTime(date: string): string;
    /**
     * Converts a time in milliseconds into a duration string, i.e. `1d 2h 13m 52s`
     * @param {number} timeInMilliseconds
     * @return {string}
     */
    formatDuration(timeInMilliseconds: number): string;
}
