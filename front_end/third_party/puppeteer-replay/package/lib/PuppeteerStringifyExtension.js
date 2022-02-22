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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PuppeteerStringifyExtension_instances, _PuppeteerStringifyExtension_appendTarget, _PuppeteerStringifyExtension_appendFrame, _PuppeteerStringifyExtension_appendContext, _PuppeteerStringifyExtension_appendWaitForSelector, _PuppeteerStringifyExtension_appendClickStep, _PuppeteerStringifyExtension_appendChangeStep, _PuppeteerStringifyExtension_appendEmulateNetworkConditionsStep, _PuppeteerStringifyExtension_appendKeyDownStep, _PuppeteerStringifyExtension_appendKeyUpStep, _PuppeteerStringifyExtension_appendCloseStep, _PuppeteerStringifyExtension_appendViewportStep, _PuppeteerStringifyExtension_appendScrollStep, _PuppeteerStringifyExtension_appendStepType, _PuppeteerStringifyExtension_appendNavigationStep, _PuppeteerStringifyExtension_appendWaitExpressionStep, _PuppeteerStringifyExtension_appendWaitForElementStep;
import { StringifyExtension } from './StringifyExtension.js';
import { assertAllStepTypesAreHandled, typeableInputTypes, } from './SchemaUtils.js';
export class PuppeteerStringifyExtension extends StringifyExtension {
    constructor() {
        super(...arguments);
        _PuppeteerStringifyExtension_instances.add(this);
    }
    async beforeAllSteps(out, flow) {
        out.appendLine("const puppeteer = require('puppeteer'); // v13.0.0 or later");
        out.appendLine('');
        out.appendLine('(async () => {').startBlock();
        out.appendLine('const browser = await puppeteer.launch();');
        out.appendLine('const page = await browser.newPage();');
        out.appendLine(`const timeout = ${flow.timeout || defaultTimeout};`);
        out.appendLine('page.setDefaultTimeout(timeout);');
        out.appendLine('');
        for (const line of helpers.split('\n')) {
            out.appendLine(line);
        }
    }
    async afterAllSteps(out, flow) {
        out.appendLine('');
        out.appendLine('await browser.close();').endBlock();
        out.appendLine('})();');
    }
    async stringifyStep(out, step, flow) {
        out.appendLine('{').startBlock();
        if (step.timeout !== undefined) {
            out.appendLine(`const timeout = ${step.timeout};`);
        }
        __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendContext).call(this, out, step);
        if (step.assertedEvents) {
            out.appendLine('const promises = [];');
            for (const event of step.assertedEvents) {
                switch (event.type) {
                    case 'navigation': {
                        out.appendLine(`promises.push(${'frame' in step && step.frame ? 'frame' : 'targetPage'}.waitForNavigation());`);
                        break;
                    }
                    default:
                        throw new Error(`Event type ${event.type} is not supported`);
                }
            }
        }
        __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendStepType).call(this, out, step);
        if (step.assertedEvents) {
            out.appendLine('await Promise.all(promises);');
        }
        out.endBlock().appendLine('}');
    }
}
_PuppeteerStringifyExtension_instances = new WeakSet(), _PuppeteerStringifyExtension_appendTarget = function _PuppeteerStringifyExtension_appendTarget(out, target) {
    if (target === 'main') {
        out.appendLine('const targetPage = page;');
    }
    else {
        out.appendLine(`const target = await browser.waitForTarget(t => t.url() === ${formatAsJSLiteral(target)}, { timeout });`);
        out.appendLine('const targetPage = await target.page();');
        out.appendLine('targetPage.setDefaultTimeout(timeout);');
    }
}, _PuppeteerStringifyExtension_appendFrame = function _PuppeteerStringifyExtension_appendFrame(out, path) {
    out.appendLine('let frame = targetPage.mainFrame();');
    for (const index of path) {
        out.appendLine(`frame = frame.childFrames()[${index}];`);
    }
}, _PuppeteerStringifyExtension_appendContext = function _PuppeteerStringifyExtension_appendContext(out, step) {
    // TODO fix optional target: should it be main?
    __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendTarget).call(this, out, step.target || 'main');
    // TODO fix optional frame: should it be required?
    if (step.frame) {
        __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendFrame).call(this, out, step.frame);
    }
}, _PuppeteerStringifyExtension_appendWaitForSelector = function _PuppeteerStringifyExtension_appendWaitForSelector(out, step) {
    out.appendLine(`const element = await waitForSelectors(${JSON.stringify(step.selectors)}, ${step.frame ? 'frame' : 'targetPage'}, { timeout, visible: true });`);
    out.appendLine('await scrollIntoViewIfNeeded(element, timeout);');
}, _PuppeteerStringifyExtension_appendClickStep = function _PuppeteerStringifyExtension_appendClickStep(out, step) {
    __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendWaitForSelector).call(this, out, step);
    out.appendLine(`await element.click({ offset: { x: ${step.offsetX}, y: ${step.offsetY}} });`);
}, _PuppeteerStringifyExtension_appendChangeStep = function _PuppeteerStringifyExtension_appendChangeStep(out, step) {
    __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendWaitForSelector).call(this, out, step);
    out.appendLine('const type = await element.evaluate(el => el.type);');
    out.appendLine(`if (${JSON.stringify(Array.from(typeableInputTypes))}.includes(type)) {`);
    out.appendLine(`  await element.type(${formatAsJSLiteral(step.value)});`);
    out.appendLine('} else {');
    out.appendLine('  await element.focus();');
    out.appendLine('  await element.evaluate((el, value) => {');
    out.appendLine('    el.value = value;');
    out.appendLine("    el.dispatchEvent(new Event('input', { bubbles: true }));");
    out.appendLine("    el.dispatchEvent(new Event('change', { bubbles: true }));");
    out.appendLine(`  }, ${JSON.stringify(step.value)});`);
    out.appendLine('}');
}, _PuppeteerStringifyExtension_appendEmulateNetworkConditionsStep = function _PuppeteerStringifyExtension_appendEmulateNetworkConditionsStep(out, step) {
    out.appendLine('await targetPage.emulateNetworkConditions({');
    out.appendLine(`  offline: ${!step.download && !step.upload},`);
    out.appendLine(`  downloadThroughput: ${step.download},`);
    out.appendLine(`  uploadThroughput: ${step.upload},`);
    out.appendLine(`  latency: ${step.latency},`);
    out.appendLine('});');
}, _PuppeteerStringifyExtension_appendKeyDownStep = function _PuppeteerStringifyExtension_appendKeyDownStep(out, step) {
    out.appendLine(`await targetPage.keyboard.down(${JSON.stringify(step.key)});`);
}, _PuppeteerStringifyExtension_appendKeyUpStep = function _PuppeteerStringifyExtension_appendKeyUpStep(out, step) {
    out.appendLine(`await targetPage.keyboard.up(${JSON.stringify(step.key)});`);
}, _PuppeteerStringifyExtension_appendCloseStep = function _PuppeteerStringifyExtension_appendCloseStep(out, _step) {
    out.appendLine('await targetPage.close()');
}, _PuppeteerStringifyExtension_appendViewportStep = function _PuppeteerStringifyExtension_appendViewportStep(out, step) {
    out.appendLine(`await targetPage.setViewport(${JSON.stringify({
        width: step.width,
        height: step.height,
    })})`);
}, _PuppeteerStringifyExtension_appendScrollStep = function _PuppeteerStringifyExtension_appendScrollStep(out, step) {
    if ('selectors' in step) {
        __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendWaitForSelector).call(this, out, step);
        out.appendLine(`await element.evaluate((el, x, y) => { el.scrollTop = y; el.scrollLeft = x; }, ${step.x}, ${step.y});`);
    }
    else {
        out.appendLine(`await targetPage.evaluate((x, y) => { window.scroll(x, y); }, ${step.x}, ${step.y})`);
    }
}, _PuppeteerStringifyExtension_appendStepType = function _PuppeteerStringifyExtension_appendStepType(out, step) {
    switch (step.type) {
        case 'click':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendClickStep).call(this, out, step);
        case 'change':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendChangeStep).call(this, out, step);
        case 'emulateNetworkConditions':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendEmulateNetworkConditionsStep).call(this, out, step);
        case 'keyDown':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendKeyDownStep).call(this, out, step);
        case 'keyUp':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendKeyUpStep).call(this, out, step);
        case 'close':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendCloseStep).call(this, out, step);
        case 'setViewport':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendViewportStep).call(this, out, step);
        case 'scroll':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendScrollStep).call(this, out, step);
        case 'navigate':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendNavigationStep).call(this, out, step);
        case 'waitForElement':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendWaitForElementStep).call(this, out, step);
        case 'waitForExpression':
            return __classPrivateFieldGet(this, _PuppeteerStringifyExtension_instances, "m", _PuppeteerStringifyExtension_appendWaitExpressionStep).call(this, out, step);
        case 'customStep':
            return; // TODO: implement these
        default:
            return assertAllStepTypesAreHandled(step);
    }
}, _PuppeteerStringifyExtension_appendNavigationStep = function _PuppeteerStringifyExtension_appendNavigationStep(out, step) {
    out.appendLine(`await targetPage.goto(${formatAsJSLiteral(step.url)});`);
}, _PuppeteerStringifyExtension_appendWaitExpressionStep = function _PuppeteerStringifyExtension_appendWaitExpressionStep(out, step) {
    out.appendLine(`await ${step.frame ? 'frame' : 'targetPage'}.waitForFunction(${formatAsJSLiteral(step.expression)}, { timeout });`);
}, _PuppeteerStringifyExtension_appendWaitForElementStep = function _PuppeteerStringifyExtension_appendWaitForElementStep(out, step) {
    out.appendLine(`await waitForElement(${JSON.stringify(step)}, ${step.frame ? 'frame' : 'targetPage'}, timeout);`);
};
const defaultTimeout = 5000;
function formatAsJSLiteral(value) {
    // TODO: replace JSON.stringify with a better looking JSLiteral implementation
    // that formats using '', "", `` depending on the content of the value.
    return JSON.stringify(value);
}
const helpers = `async function waitForSelectors(selectors, frame, options) {
  for (const selector of selectors) {
    try {
      return await waitForSelector(selector, frame, options);
    } catch (err) {
      console.error(err);
    }
  }
  throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
}

async function scrollIntoViewIfNeeded(element, timeout) {
  await waitForConnected(element, timeout);
  const isInViewport = await element.isIntersectingViewport({threshold: 0});
  if (isInViewport) {
    return;
  }
  await element.evaluate(element => {
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
    return await element.getProperty('isConnected');
  }, timeout);
}

async function waitForInViewport(element, timeout) {
  await waitForFunction(async () => {
    return await element.isIntersectingViewport({threshold: 0});
  }, timeout);
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
    if (element) {
      element = await element.waitForSelector(part, options);
    } else {
      element = await frame.waitForSelector(part, options);
    }
    if (!element) {
      throw new Error('Could not find element: ' + selector.join('>>'));
    }
    if (i < selector.length - 1) {
      element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
    }
  }
  if (!element) {
    throw new Error('Could not find element: ' + selector.join('|'));
  }
  return element;
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
    return compFn(elements.length, count);
  }, timeout);
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
    } else {
      const tmpElements = elements;
      elements = [];
      for (const el of tmpElements) {
        elements.push(...(await el.$$(part)));
      }
    }
    if (elements.length === 0) {
      return [];
    }
    if (i < selector.length - 1) {
      const tmpElements = [];
      for (const el of elements) {
        const newEl = (await el.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
        if (newEl) {
          tmpElements.push(newEl);
        }
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
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timed out');
}`;
