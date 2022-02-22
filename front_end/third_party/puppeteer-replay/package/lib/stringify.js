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
import { LineWriterImpl } from './LineWriterImpl.js';
import { PuppeteerStringifyExtension } from './PuppeteerStringifyExtension.js';
export async function stringify(flow, opts) {
    var _a, _b, _c, _d;
    if (!opts) {
        opts = {};
    }
    let ext = opts.extension;
    if (!ext) {
        ext = new PuppeteerStringifyExtension();
    }
    if (!opts.indentation) {
        opts.indentation = '  ';
    }
    const out = new LineWriterImpl(opts.indentation);
    await ((_a = ext.beforeAllSteps) === null || _a === void 0 ? void 0 : _a.call(ext, out, flow));
    for (const step of flow.steps) {
        await ((_b = ext.beforeEachStep) === null || _b === void 0 ? void 0 : _b.call(ext, out, step, flow));
        await ext.stringifyStep(out, step, flow);
        await ((_c = ext.afterEachStep) === null || _c === void 0 ? void 0 : _c.call(ext, out, step, flow));
    }
    await ((_d = ext.afterAllSteps) === null || _d === void 0 ? void 0 : _d.call(ext, out, flow));
    return out.toString();
}
