import * as puppeteer from 'puppeteer';
interface BrowserAndPages {
    browser: puppeteer.Browser;
    target: puppeteer.Page;
    frontend: puppeteer.Page;
}
export declare let resetPages: (...enabledExperiments: string[]) => void;
export declare const getElementPosition: (selector: string, root?: puppeteer.JSHandle<any> | undefined) => Promise<{
    x?: undefined;
    y?: undefined;
} | {
    x: any;
    y: any;
}>;
export declare const click: (selector: string, options?: {
    root?: puppeteer.JSHandle<any> | undefined;
    clickOptions?: puppeteer.ClickOptions | undefined;
} | undefined) => Promise<void>;
export declare const $: (selector: string, root?: puppeteer.JSHandle<any> | undefined) => Promise<puppeteer.JSHandle<any>>;
export declare const $$: (selector: string, root?: puppeteer.JSHandle<any> | undefined) => Promise<puppeteer.JSHandle<any>>;
export declare const waitFor: (selector: string, root?: puppeteer.JSHandle<any> | undefined, maxTotalTimeout?: number) => Promise<puppeteer.JSHandle<any>>;
export declare const debuggerStatement: (frontend: puppeteer.Page) => Promise<void>;
export declare const store: (browser: puppeteer.Browser, target: puppeteer.Page, frontend: puppeteer.Page, reset: (...enabledExperiments: string[]) => void) => void;
export declare const getBrowserAndPages: () => BrowserAndPages;
export declare const assertScreenshotUnchanged: (page: puppeteer.Page, fileName: string, options?: Partial<puppeteer.ScreenshotOptions>) => Promise<unknown>;
export declare const resourcesPath = "http://localhost:8090/test/e2e/resources";
export {};
