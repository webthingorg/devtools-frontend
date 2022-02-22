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
import { assertAllStepTypesAreHandled, typeableInputTypes, } from './SchemaUtils.js';
export class PuppeteerRunnerExtension extends RunnerExtension {
    constructor(browser, page, opts) {
        super();
        this.browser = browser;
        this.page = page;
        this.timeout = (opts === null || opts === void 0 ? void 0 : opts.timeout) || 5000;
    }
    async runStep(step, flow) {
        const timeout = step.timeout || this.timeout;
        const page = this.page;
        const browser = this.browser;
        const waitForVisible = true;
        const targetPage = await getTargetPageForStep(browser, page, step, timeout);
        let targetFrame = null;
        if (!targetPage && step.target) {
            const frames = page.frames();
            for (const f of frames) {
                if (f.isOOPFrame() && f.url() === step.target) {
                    targetFrame = f;
                    break;
                }
            }
            if (!targetFrame) {
                targetFrame = await page.waitForFrame(step.target, { timeout });
            }
        }
        const pageOrFrame = targetPage || targetFrame;
        if (!pageOrFrame) {
            throw new Error('Target is not found for step: ' + JSON.stringify(step));
        }
        const frame = await getFrame(pageOrFrame, step);
        const assertedEventsPromise = waitForEvents(pageOrFrame, step, timeout);
        switch (step.type) {
            case 'click':
                {
                    const element = await waitForSelectors(step.selectors, frame, {
                        timeout,
                        visible: waitForVisible,
                    });
                    if (!element) {
                        throw new Error('Could not find element: ' + step.selectors[0]);
                    }
                    await scrollIntoViewIfNeeded(element, timeout);
                    await element.click({
                        offset: {
                            x: step.offsetX,
                            y: step.offsetY,
                        },
                    });
                    await element.dispose();
                }
                break;
            case 'emulateNetworkConditions':
                {
                    await page.emulateNetworkConditions(step);
                }
                break;
            case 'keyDown':
                {
                    await page.keyboard.down(step.key);
                    await page.waitForTimeout(100);
                }
                break;
            case 'keyUp':
                {
                    await page.keyboard.up(step.key);
                    await page.waitForTimeout(100);
                }
                break;
            case 'close':
                {
                    if ('close' in pageOrFrame) {
                        await pageOrFrame.close();
                    }
                }
                break;
            case 'change':
                {
                    const element = await waitForSelectors(step.selectors, frame, {
                        timeout,
                        visible: waitForVisible,
                    });
                    await scrollIntoViewIfNeeded(element, timeout);
                    const inputType = await element.evaluate(
                    /* c8 ignore next 1 */
                    (el) => el.type);
                    if (typeableInputTypes.has(inputType)) {
                        const textToType = await element.evaluate((el, newValue) => {
                            /* c8 ignore next 13 */
                            const input = el;
                            if (newValue.length <= input.value.length ||
                                !newValue.startsWith(input.value)) {
                                input.value = '';
                                return newValue;
                            }
                            const originalValue = input.value;
                            // Move cursor to the end of the common prefix.
                            input.value = '';
                            input.value = originalValue;
                            return newValue.substring(originalValue.length);
                        }, step.value);
                        await element.type(textToType);
                    }
                    else {
                        await element.focus();
                        await element.evaluate((el, value) => {
                            /* c8 ignore next 4 */
                            const input = el;
                            input.value = value;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }, step.value);
                    }
                    await element.dispose();
                }
                break;
            case 'setViewport': {
                if ('setViewport' in pageOrFrame) {
                    await pageOrFrame.setViewport(step);
                }
                break;
            }
            case 'scroll': {
                if ('selectors' in step) {
                    const element = await waitForSelectors(step.selectors, frame, {
                        timeout,
                        visible: waitForVisible,
                    });
                    await scrollIntoViewIfNeeded(element, timeout);
                    await element.evaluate((e, x, y) => {
                        /* c8 ignore next 2 */
                        e.scrollTop = y;
                        e.scrollLeft = x;
                    }, step.x || 0, step.y || 0);
                    await element.dispose();
                }
                else {
                    await frame.evaluate((x, y) => {
                        /* c8 ignore next 1 */
                        window.scroll(x, y);
                    }, step.x || 0, step.y || 0);
                }
                break;
            }
            case 'navigate': {
                await frame.goto(step.url);
                break;
            }
            case 'waitForElement': {
                try {
                    await waitForElement(step, frame, timeout);
                }
                catch (err) {
                    if (err.message === 'Timed out') {
                        throw new Error('waitForElement timed out. The element(s) could not be found.');
                    }
                    else {
                        throw err;
                    }
                }
                break;
            }
            case 'waitForExpression': {
                await frame.waitForFunction(step.expression, {
                    timeout,
                });
                break;
            }
            case 'customStep': {
                // TODO implement these steps
                break;
            }
            default:
                assertAllStepTypesAreHandled(step);
        }
        await assertedEventsPromise;
    }
}
export class PuppeteerRunnerOwningBrowserExtension extends PuppeteerRunnerExtension {
    async afterAllSteps() {
        await this.browser.close();
    }
}
async function getFrame(pageOrFrame, step) {
    let frame = 'mainFrame' in pageOrFrame ? pageOrFrame.mainFrame() : pageOrFrame;
    if ('frame' in step && step.frame) {
        for (const index of step.frame) {
            frame = frame.childFrames()[index];
        }
    }
    return frame;
}
async function getTargetPageForStep(browser, page, step, timeout) {
    if (!step.target || step.target === 'main') {
        return page;
    }
    const target = await browser.waitForTarget((t) => t.url() === step.target, {
        timeout,
    });
    const targetPage = await target.page();
    if (!targetPage) {
        return null;
    }
    targetPage.setDefaultTimeout(timeout);
    return targetPage;
}
async function waitForEvents(targetPage, step, timeout) {
    const promises = [];
    if (step.assertedEvents) {
        for (const event of step.assertedEvents) {
            switch (event.type) {
                case 'navigation': {
                    promises.push(targetPage.waitForNavigation({
                        timeout,
                    }));
                    continue;
                }
                default:
                    throw new Error(`Event type ${event.type} is not supported`);
            }
        }
    }
    await Promise.all(promises);
}
async function waitForElement(step, frame, timeout) {
    const count = step.count || 1;
    const operator = step.operator || '>=';
    const comp = {
        '==': (a, b) => a === b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
    };
    const compFn = comp[operator];
    await waitForFunction(async () => {
        const elements = await querySelectorsAll(step.selectors, frame);
        const result = compFn(elements.length, count);
        await Promise.all(elements.map((element) => element.dispose()));
        return result;
    }, timeout);
}
async function scrollIntoViewIfNeeded(element, timeout) {
    await waitForConnected(element, timeout);
    const isInViewport = await element.isIntersectingViewport({ threshold: 0 });
    if (isInViewport) {
        return;
    }
    await element.evaluate((element) => {
        /* c8 ignore next 1 */
        element.scrollIntoView({
            block: 'center',
            inline: 'center',
            behavior: 'auto',
        });
    });
    await waitForInViewport(element, timeout);
}
async function waitForConnected(element, timeout) {
    await waitForFunction(async () => {
        /* c8 ignore next 1 */
        return await element.evaluate((el) => el.isConnected);
    }, timeout);
}
async function waitForInViewport(element, timeout) {
    await waitForFunction(async () => {
        return await element.isIntersectingViewport({ threshold: 0 });
    }, timeout);
}
async function waitForSelectors(selectors, frame, options) {
    for (const selector of selectors) {
        try {
            return await waitForSelector(selector, frame, options);
        }
        catch (err) {
            console.error('error in waitForSelectors', err);
            // TODO: report the error somehow
        }
    }
    throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
}
async function waitForSelector(selector, frame, options) {
    if (!Array.isArray(selector)) {
        selector = [selector];
    }
    if (!selector.length) {
        throw new Error('Empty selector provided to waitForSelector');
    }
    let element = null;
    for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (!element) {
            element = await frame.waitForSelector(part, options);
        }
        else {
            const oldElement = element;
            element = await element.waitForSelector(part, options);
            await oldElement.dispose();
        }
        if (!element) {
            throw new Error('Could not find element: ' + selector.join('>>'));
        }
        if (i < selector.length - 1) {
            // if not the last part, try to navigate into shadowRoot
            const oldElement = element;
            element = (await element.evaluateHandle((el) => el.shadowRoot ? el.shadowRoot : el)).asElement();
            await oldElement.dispose();
        }
    }
    if (!element) {
        throw new Error('Could not find element: ' + selector.join('|'));
    }
    return element;
}
async function querySelectorsAll(selectors, frame) {
    for (const selector of selectors) {
        const result = await querySelectorAll(selector, frame);
        if (result.length) {
            return result;
        }
    }
    return [];
}
async function querySelectorAll(selector, frame) {
    if (!Array.isArray(selector)) {
        selector = [selector];
    }
    if (!selector.length) {
        throw new Error('Empty selector provided to querySelectorAll');
    }
    let elements = [];
    for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (i === 0) {
            elements = await frame.$$(part);
        }
        else {
            const tmpElements = elements;
            elements = [];
            for (const el of tmpElements) {
                elements.push(...(await el.$$(part)));
                await el.dispose();
            }
        }
        if (elements.length === 0) {
            return [];
        }
        if (i < selector.length - 1) {
            const tmpElements = [];
            // if not the last part, try to navigate into shadowRoot
            for (const el of elements) {
                const newEl = (await el.evaluateHandle((el) => el.shadowRoot ? el.shadowRoot : el)).asElement();
                if (newEl) {
                    tmpElements.push(newEl);
                }
                await el.dispose();
            }
            elements = tmpElements;
        }
    }
    return elements;
}
async function waitForFunction(fn, timeout) {
    let isActive = true;
    setTimeout(() => {
        isActive = false;
    }, timeout);
    while (isActive) {
        const result = await fn();
        if (result) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Timed out');
}
