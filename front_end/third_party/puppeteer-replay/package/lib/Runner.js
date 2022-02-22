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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Runner_flow, _Runner_extension, _Runner_nextStep;
import { PuppeteerRunnerOwningBrowserExtension } from './PuppeteerRunnerExtension.js';
export class Runner {
    /**
     * @internal
     */
    constructor(flow, extension) {
        _Runner_flow.set(this, void 0);
        _Runner_extension.set(this, void 0);
        _Runner_nextStep.set(this, 0);
        __classPrivateFieldSet(this, _Runner_flow, flow, "f");
        __classPrivateFieldSet(this, _Runner_extension, extension, "f");
    }
    /**
     * @param stepIdx - Run the flow up until the step with the `stepIdx` index.
     */
    async run(stepIdx) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var _j;
        if (stepIdx === undefined) {
            stepIdx = __classPrivateFieldGet(this, _Runner_flow, "f").steps.length;
        }
        if (__classPrivateFieldGet(this, _Runner_nextStep, "f") === 0) {
            await ((_b = (_a = __classPrivateFieldGet(this, _Runner_extension, "f")).beforeAllSteps) === null || _b === void 0 ? void 0 : _b.call(_a, __classPrivateFieldGet(this, _Runner_flow, "f")));
        }
        while (__classPrivateFieldGet(this, _Runner_nextStep, "f") < stepIdx &&
            __classPrivateFieldGet(this, _Runner_nextStep, "f") < __classPrivateFieldGet(this, _Runner_flow, "f").steps.length) {
            await ((_d = (_c = __classPrivateFieldGet(this, _Runner_extension, "f")).beforeEachStep) === null || _d === void 0 ? void 0 : _d.call(_c, __classPrivateFieldGet(this, _Runner_flow, "f").steps[__classPrivateFieldGet(this, _Runner_nextStep, "f")], __classPrivateFieldGet(this, _Runner_flow, "f")));
            await __classPrivateFieldGet(this, _Runner_extension, "f").runStep(__classPrivateFieldGet(this, _Runner_flow, "f").steps[__classPrivateFieldGet(this, _Runner_nextStep, "f")], __classPrivateFieldGet(this, _Runner_flow, "f"));
            await ((_f = (_e = __classPrivateFieldGet(this, _Runner_extension, "f")).afterEachStep) === null || _f === void 0 ? void 0 : _f.call(_e, __classPrivateFieldGet(this, _Runner_flow, "f").steps[__classPrivateFieldGet(this, _Runner_nextStep, "f")], __classPrivateFieldGet(this, _Runner_flow, "f")));
            __classPrivateFieldSet(this, _Runner_nextStep, (_j = __classPrivateFieldGet(this, _Runner_nextStep, "f"), _j++, _j), "f");
        }
        if (__classPrivateFieldGet(this, _Runner_nextStep, "f") >= __classPrivateFieldGet(this, _Runner_flow, "f").steps.length) {
            await ((_h = (_g = __classPrivateFieldGet(this, _Runner_extension, "f")).afterAllSteps) === null || _h === void 0 ? void 0 : _h.call(_g, __classPrivateFieldGet(this, _Runner_flow, "f")));
            return true;
        }
        return false;
    }
}
_Runner_flow = new WeakMap(), _Runner_extension = new WeakMap(), _Runner_nextStep = new WeakMap();
export async function createRunner(flow, extension) {
    if (!extension) {
        const { default: puppeteer } = await import('puppeteer');
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();
        extension = new PuppeteerRunnerOwningBrowserExtension(browser, page);
    }
    return new Runner(flow, extension);
}
