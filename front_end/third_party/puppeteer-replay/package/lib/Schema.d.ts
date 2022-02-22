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
export declare type Target = string;
export declare type Pattern = string;
export declare type Selector = string | string[];
export declare type FrameSelector = number[];
export interface NavigationEvent {
    type: 'navigation';
    url?: Pattern;
    title?: Pattern;
}
export declare type AssertedEvent = NavigationEvent;
export interface BaseStep {
    type: string;
    timeout?: number;
    assertedEvents?: AssertedEvent[];
}
export interface StepWithTarget extends BaseStep {
    /**
     * Defaults to main
     */
    target?: Target;
}
export interface StepWithFrame extends StepWithTarget {
    /**
     * Defaults to main frame
     */
    frame?: FrameSelector;
}
export interface StepWithSelectors extends StepWithFrame {
    selectors: Selector[];
}
export interface ClickStep extends StepWithSelectors {
    type: 'click';
    /**
     * in px, relative to the top-left corner of the element content box. Defaults to the center of the element
     */
    offsetX: number;
    /**
     * in px, relative to the top-left corner of the element content box. Defaults to the center of the element
     */
    offsetY: number;
}
export interface ChangeStep extends StepWithSelectors {
    type: 'change';
    value: string;
}
export interface EmulateNetworkConditionsStep extends StepWithTarget {
    type: 'emulateNetworkConditions';
    download: number;
    upload: number;
    latency: number;
}
export interface KeyDownStep extends StepWithTarget {
    type: 'keyDown';
    key: Key;
}
export interface KeyUpStep extends StepWithTarget {
    type: 'keyUp';
    key: Key;
}
export interface CloseStep extends StepWithTarget {
    type: 'close';
}
export interface SetViewportStep extends StepWithTarget {
    type: 'setViewport';
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
}
export interface ScrollPageStep extends StepWithFrame {
    type: 'scroll';
    /**
     * Absolute scroll x position in px. Defaults to 0
     */
    x?: number;
    /**
     * Absolute scroll y position in px. Defaults to 0
     */
    y?: number;
}
export interface ScrollElementStep extends ScrollPageStep {
    selectors: Selector[];
}
export declare type ScrollStep = ScrollPageStep | ScrollElementStep;
export interface NavigateStep extends StepWithTarget {
    type: 'navigate';
    url: string;
}
export interface CustomStepParams {
    type: 'customStep';
    name: string;
    parameters: unknown;
}
export declare type CustomStep = (CustomStepParams & StepWithTarget) | (CustomStepParams & StepWithFrame);
export declare type UserStep = ClickStep | ChangeStep | EmulateNetworkConditionsStep | KeyDownStep | KeyUpStep | CloseStep | SetViewportStep | ScrollStep | NavigateStep | CustomStep;
/**
 * `waitForElement` allows waiting for the presence (or absence) of the number of
 * elements identified by the selector.
 *
 * For example, the following step would wait for less than three elements
 * to be on the page that match the selector `.my-class`.
 *
 * ```
 * {
 *   "type": "waitForElement",
 *   "selectors": [".my-class"],
 *   "operator": "<=",
 *   "count": 2,
 * }
 * ```
 */
export interface WaitForElementStep extends StepWithSelectors {
    type: 'waitForElement';
    /**
     * Defaults to '=='
     */
    operator?: '>=' | '==' | '<=';
    /**
     * Defaults to 1
     */
    count?: number;
}
/**
 * `waitForExpression` allows for a JavaScript expression to resolve to truthy value.
 *
 * For example, the following step pauses for two seconds and then resolves to true
 * allowing the replay to continue.
 *
 * ```
 * {
 *   "type": "waitForElement",
 *   "expression": "new Promise(resole => setTimeout(() => resolve(true), 2000))",
 * }
 * ```
 */
export interface WaitForExpressionStep extends StepWithFrame {
    type: 'waitForExpression';
    expression: string;
}
export declare type AssertionStep = WaitForElementStep | WaitForExpressionStep;
export declare type Step = UserStep | AssertionStep;
export interface UserFlow {
    /**
     * Human-readble title describing the recorder user flow.
     */
    title: string;
    /**
     * Timeout in milliseconds.
     */
    timeout?: number;
    /**
     * The name of the attribute to use to generate selectors instead of regular
     * CSS selectors. For example, specifying `data-testid` would generate the
     * selector `[data-testid=value]` for the element `<div data-testid=value>`.
     */
    selectorAttribute?: string;
    steps: Step[];
}
