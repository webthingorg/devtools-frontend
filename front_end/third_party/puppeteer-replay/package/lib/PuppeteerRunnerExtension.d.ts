/**
    Copyright 2022 Google LLC

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 */
import { RunnerExtension } from './RunnerExtension.js';
import { UserFlow, Step, Key } from './Schema.js';
export declare class PuppeteerRunnerExtension extends RunnerExtension {
    protected browser: Browser;
    protected page: Page;
    protected timeout: number;
    constructor(browser: Browser, page: Page, opts?: {
        timeout?: number;
    });
    runStep(step: Step, flow: UserFlow): Promise<void>;
}
export declare class PuppeteerRunnerOwningBrowserExtension extends PuppeteerRunnerExtension {
    afterAllSteps(): Promise<void>;
}
interface WaitForOptions {
    timeout: number;
    visible: boolean;
}
declare type EvaluateFn<T = any> = string | ((arg1: T, ...args: any[]) => any);
declare type EvaluateFnReturnType<T extends EvaluateFn> = T extends (...args: any[]) => infer R ? R : any;
declare type SerializableOrJSHandle = Serializable | JSHandle;
declare type JSONArray = readonly Serializable[];
interface JSONObject {
    [key: string]: Serializable;
}
declare type Serializable = number | string | boolean | null | BigInt | JSONArray | JSONObject;
declare type UnwrapPromiseLike<T> = T extends PromiseLike<infer U> ? U : T;
interface Target {
    url(): string;
    page(): Promise<Page | null>;
}
export interface WaitForTargetOptions {
    /**
     * Maximum wait time in milliseconds. Pass `0` to disable the timeout.
     * @defaultValue 30 seconds.
     */
    timeout?: number;
}
interface Browser {
    close(): Promise<void>;
    waitForTarget(predicate: (x: Target) => boolean, options?: WaitForTargetOptions): Promise<Target>;
}
interface JSHandle<HandleObjectType = unknown> {
    evaluate<T extends EvaluateFn<HandleObjectType>>(...args: any[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    evaluateHandle(...args: any[]): Promise<JSHandle<Element>>;
    asElement(): ElementHandle<Element> | null;
}
interface ElementHandle<ElementType extends Element> extends JSHandle<ElementType> {
    isIntersectingViewport(opts: {
        threshold: number;
    }): Promise<boolean>;
    dispose(): Promise<void>;
    click(opts: {
        offset: {
            x: number;
            y: number;
        };
    }): Promise<void>;
    type(input: string): Promise<void>;
    focus(): Promise<void>;
    $$<T extends Element = Element>(selector: string): Promise<Array<ElementHandle<T>>>;
    waitForSelector(selector: string, options?: {
        visible?: boolean;
        hidden?: boolean;
        timeout?: number;
    }): Promise<ElementHandle<Element> | null>;
    asElement(): ElementHandle<ElementType> | null;
}
interface Page {
    setDefaultTimeout(timeout: number): void;
    frames(): Frame[];
    emulateNetworkConditions(conditions: any): void;
    keyboard: {
        type(value: string): Promise<void>;
        down(key: Key): Promise<void>;
        up(key: Key): Promise<void>;
    };
    waitForTimeout(timeout: number): Promise<void>;
    close(): Promise<void>;
    setViewport(viewport: any): Promise<void>;
    mainFrame(): Frame;
    waitForNavigation(opts: {
        timeout: number;
    }): Promise<unknown>;
    $$<T extends Element = Element>(selector: string): Promise<Array<ElementHandle<T>>>;
    waitForFrame(url: string, opts: {
        timeout: number;
    }): Promise<Frame>;
}
interface Frame {
    waitForSelector(part: string, options: WaitForOptions): Promise<ElementHandle<Element> | null>;
    isOOPFrame(): boolean;
    url(): string;
    evaluate<T extends EvaluateFn>(pageFunction: T, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    goto(url: string): Promise<unknown>;
    waitForFunction(expr: string, opts: {
        timeout: number;
    }): Promise<unknown>;
    childFrames(): Frame[];
    waitForNavigation(opts: {
        timeout: number;
    }): Promise<unknown>;
    $$<T extends Element = Element>(selector: string): Promise<Array<ElementHandle<T>>>;
}
export {};
