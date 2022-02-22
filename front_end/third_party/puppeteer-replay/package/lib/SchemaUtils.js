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
export function assertAllStepTypesAreHandled(s) {
    throw new Error(`Unknown step type: ${s.type}`);
}
export const typeableInputTypes = new Set([
    'textarea',
    'select-one',
    'text',
    'url',
    'tel',
    'search',
    'password',
    'number',
    'email',
]);
function hasProperty(data, prop) {
    // TODO: use Object.hasOwn once types are available https://github.com/microsoft/TypeScript/issues/44253
    if (!Object.prototype.hasOwnProperty.call(data, prop)) {
        return false;
    }
    const keyedData = data;
    return keyedData[prop] !== undefined;
}
function isObject(data) {
    return typeof data === 'object' && data !== null;
}
function isString(data) {
    return typeof data === 'string';
}
function isNumber(data) {
    return typeof data === 'number';
}
function isArray(data) {
    return Array.isArray(data);
}
function isBoolean(data) {
    return typeof data === 'boolean';
}
function isIntegerArray(data) {
    return isArray(data) && data.every((item) => Number.isInteger(item));
}
function parseTarget(step) {
    if (hasProperty(step, 'target') && isString(step.target)) {
        return step.target;
    }
    return undefined;
}
function parseFrame(step) {
    if (hasProperty(step, 'frame')) {
        if (isIntegerArray(step.frame)) {
            return step.frame;
        }
        throw new Error('Step `frame` is not an integer array');
    }
    return undefined;
}
function parseNumber(step, prop) {
    if (hasProperty(step, prop)) {
        const maybeNumber = step[prop];
        if (isNumber(maybeNumber)) {
            return maybeNumber;
        }
    }
    throw new Error(`Step.${prop} is not a number`);
}
function parseBoolean(step, prop) {
    if (hasProperty(step, prop)) {
        const maybeBoolean = step[prop];
        if (isBoolean(maybeBoolean)) {
            return maybeBoolean;
        }
    }
    throw new Error(`Step.${prop} is not a boolean`);
}
function parseOptionalNumber(step, prop) {
    if (hasProperty(step, prop)) {
        return parseNumber(step, prop);
    }
    return undefined;
}
function parseOptionalString(step, prop) {
    if (hasProperty(step, prop)) {
        return parseString(step, prop);
    }
    return undefined;
}
function parseString(step, prop) {
    if (hasProperty(step, prop)) {
        const maybeString = step[prop];
        if (isString(maybeString)) {
            return maybeString;
        }
    }
    throw new Error(`Step.${prop} is not a string`);
}
function parseSelectors(step) {
    if (!hasProperty(step, 'selectors')) {
        throw new Error('Step does not have required selectors');
    }
    if (!isArray(step.selectors)) {
        throw new Error('Step selectors are not an array');
    }
    return step.selectors.map((s) => {
        if (!isString(s) && !isArray(s)) {
            throw new Error('Selector is not an array or string');
        }
        if (isArray(s)) {
            return s.map((sub) => {
                if (!isString(sub)) {
                    throw new Error('Selector element is not a string');
                }
                return sub;
            });
        }
        return s;
    });
}
function parseOptionalSelectors(step) {
    if (!hasProperty(step, 'selectors')) {
        return undefined;
    }
    return parseSelectors(step);
}
function parseAssertedEvent(event) {
    if (!isObject(event)) {
        throw new Error('Asserted event is not an object');
    }
    if (!hasProperty(event, 'type')) {
        throw new Error('Asserted event is missing type');
    }
    if (event.type === 'navigation') {
        return {
            type: 'navigation',
            url: parseOptionalString(event, 'url'),
            title: parseOptionalString(event, 'title'),
        };
    }
    throw new Error('Unknown assertedEvent type');
}
function parseAssertedEvents(events) {
    if (!isArray(events)) {
        return undefined;
    }
    return events.map(parseAssertedEvent);
}
function parseBaseStep(type, step) {
    if (hasProperty(step, 'timeout') &&
        isNumber(step.timeout) &&
        !validTimeout(step.timeout)) {
        throw new Error(timeoutErrorMessage);
    }
    return {
        type,
        assertedEvents: hasProperty(step, 'assertedEvents')
            ? parseAssertedEvents(step.assertedEvents)
            : undefined,
        timeout: hasProperty(step, 'timeout') && isNumber(step.timeout)
            ? step.timeout
            : undefined,
    };
}
function parseStepWithTarget(type, step) {
    return {
        ...parseBaseStep(type, step),
        target: parseTarget(step),
    };
}
function parseStepWithFrame(type, step) {
    return {
        ...parseStepWithTarget(type, step),
        frame: parseFrame(step),
    };
}
function parseStepWithSelectors(type, step) {
    return {
        ...parseStepWithFrame(type, step),
        selectors: parseSelectors(step),
    };
}
function parseClickStep(step) {
    return {
        ...parseStepWithSelectors('click', step),
        type: 'click',
        offsetX: parseNumber(step, 'offsetX'),
        offsetY: parseNumber(step, 'offsetY'),
    };
}
function parseChangeStep(step) {
    return {
        ...parseStepWithSelectors('click', step),
        type: 'change',
        value: parseString(step, 'value'),
    };
}
function parseKeyDownStep(step) {
    return {
        ...parseStepWithTarget('keyDown', step),
        type: 'keyDown',
        // TODO: type-check keys.
        key: parseString(step, 'key'),
    };
}
function parseKeyUpStep(step) {
    return {
        ...parseStepWithTarget('keyUp', step),
        type: 'keyUp',
        // TODO: type-check keys.
        key: parseString(step, 'key'),
    };
}
function parseEmulateNetworkConditionsStep(step) {
    return {
        ...parseStepWithTarget('emulateNetworkConditions', step),
        type: 'emulateNetworkConditions',
        download: parseNumber(step, 'download'),
        upload: parseNumber(step, 'upload'),
        latency: parseNumber(step, 'latency'),
    };
}
function parseCloseStep(step) {
    return {
        ...parseStepWithTarget('close', step),
        type: 'close',
    };
}
function parseSetViewportStep(step) {
    return {
        ...parseStepWithTarget('setViewport', step),
        type: 'setViewport',
        width: parseNumber(step, 'width'),
        height: parseNumber(step, 'height'),
        deviceScaleFactor: parseNumber(step, 'deviceScaleFactor'),
        isMobile: parseBoolean(step, 'isMobile'),
        hasTouch: parseBoolean(step, 'hasTouch'),
        isLandscape: parseBoolean(step, 'isLandscape'),
    };
}
function parseScrollStep(step) {
    return {
        ...parseStepWithFrame('scroll', step),
        type: 'scroll',
        x: parseOptionalNumber(step, 'x'),
        y: parseOptionalNumber(step, 'y'),
        selectors: parseOptionalSelectors(step),
    };
}
function parseNavigateStep(step) {
    return {
        ...parseStepWithTarget('scroll', step),
        type: 'navigate',
        target: parseTarget(step),
        url: parseString(step, 'url'),
    };
}
function parseWaitForElementStep(step) {
    const operator = parseOptionalString(step, 'operator');
    if (operator && operator !== '>=' && operator !== '==' && operator !== '<=') {
        throw new Error("WaitForElement step's operator is not one of '>=','==','<='");
    }
    return {
        ...parseStepWithSelectors('waitForElement', step),
        type: 'waitForElement',
        operator: operator,
        count: parseOptionalNumber(step, 'count'),
    };
}
function parseWaitForExpressionStep(step) {
    if (!hasProperty(step, 'expression')) {
        throw new Error('waitForExpression step is missing `expression`');
    }
    return {
        ...parseStepWithFrame('waitForExpression', step),
        type: 'waitForExpression',
        expression: parseString(step, 'expression'),
    };
}
function parseCustomStep(step) {
    if (!hasProperty(step, 'name')) {
        throw new Error('customStep is missing name');
    }
    if (!isString(step.name)) {
        throw new Error("customStep's name is not a string");
    }
    return {
        ...parseStepWithFrame('customStep', step),
        type: 'customStep',
        name: step.name,
        parameters: hasProperty(step, 'parameters') ? step.parameters : undefined,
    };
}
export function parseStep(step, idx) {
    if (!isObject(step)) {
        throw new Error(idx ? `Step ${idx} is not an object` : 'Step is not an object');
    }
    if (!hasProperty(step, 'type')) {
        throw new Error(idx ? `Step ${idx} does not have a type` : 'Step does not have a type');
    }
    if (!isString(step.type)) {
        throw new Error(idx
            ? `Type of the step ${idx} is not a string`
            : 'Type of the step is not a string');
    }
    switch (step.type) {
        case 'click':
            return parseClickStep(step);
        case 'change':
            return parseChangeStep(step);
        case 'keyDown':
            return parseKeyDownStep(step);
        case 'keyUp':
            return parseKeyUpStep(step);
        case 'emulateNetworkConditions':
            return parseEmulateNetworkConditionsStep(step);
        case 'close':
            return parseCloseStep(step);
        case 'setViewport':
            return parseSetViewportStep(step);
        case 'scroll':
            return parseScrollStep(step);
        case 'navigate':
            return parseNavigateStep(step);
        case 'customStep':
            return parseCustomStep(step);
        case 'waitForElement':
            return parseWaitForElementStep(step);
        case 'waitForExpression':
            return parseWaitForExpressionStep(step);
        default:
            throw new Error(`Step type ${step.type} is not supported`);
    }
}
function parseSteps(steps) {
    const result = [];
    if (!isArray(steps)) {
        throw new Error('Recording `steps` is not an array');
    }
    for (const [idx, step] of steps.entries()) {
        result.push(parseStep(step, idx));
    }
    return result;
}
function cleanUndefined(json) {
    return JSON.parse(JSON.stringify(json));
}
export const minTimeout = 1;
export const maxTimeout = 30000;
const timeoutErrorMessage = `Timeout is not between ${minTimeout} and ${maxTimeout} milliseconds`;
export function validTimeout(timeout) {
    return timeout >= minTimeout && timeout <= maxTimeout;
}
export function parse(data) {
    if (!isObject(data)) {
        throw new Error('Recording is not an object');
    }
    if (!hasProperty(data, 'title')) {
        throw new Error('Recording is missing `title`');
    }
    if (!isString(data.title)) {
        throw new Error('Recording `title` is not a string');
    }
    if (hasProperty(data, 'timeout') && !isNumber(data.timeout)) {
        throw new Error('Recording `timeout` is not a number');
    }
    if (!hasProperty(data, 'steps')) {
        throw new Error('Recording is missing `steps`');
    }
    if (hasProperty(data, 'timeout') &&
        isNumber(data.timeout) &&
        !validTimeout(data.timeout)) {
        throw new Error(timeoutErrorMessage);
    }
    return cleanUndefined({
        title: data.title,
        timeout: hasProperty(data, 'timeout') && isNumber(data.timeout)
            ? data.timeout
            : undefined,
        selectorAttribute: hasProperty(data, 'selectorAttribute') && isString(data.selectorAttribute)
            ? data.selectorAttribute
            : undefined,
        steps: parseSteps(data.steps),
    });
}
