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
var _LineWriterImpl_indentation, _LineWriterImpl_currentIndentation, _LineWriterImpl_lines;
export class LineWriterImpl {
    constructor(indentation) {
        _LineWriterImpl_indentation.set(this, void 0);
        _LineWriterImpl_currentIndentation.set(this, 0);
        _LineWriterImpl_lines.set(this, []);
        __classPrivateFieldSet(this, _LineWriterImpl_indentation, indentation, "f");
    }
    appendLine(line) {
        const indentedLine = line
            ? __classPrivateFieldGet(this, _LineWriterImpl_indentation, "f").repeat(__classPrivateFieldGet(this, _LineWriterImpl_currentIndentation, "f")) + line.trimEnd()
            : '';
        __classPrivateFieldGet(this, _LineWriterImpl_lines, "f").push(indentedLine);
        return this;
    }
    startBlock() {
        var _a;
        __classPrivateFieldSet(this, _LineWriterImpl_currentIndentation, (_a = __classPrivateFieldGet(this, _LineWriterImpl_currentIndentation, "f"), _a++, _a), "f");
        return this;
    }
    endBlock() {
        var _a;
        __classPrivateFieldSet(this, _LineWriterImpl_currentIndentation, (_a = __classPrivateFieldGet(this, _LineWriterImpl_currentIndentation, "f"), _a--, _a), "f");
        return this;
    }
    toString() {
        // Scripts should end with a final blank line.
        return __classPrivateFieldGet(this, _LineWriterImpl_lines, "f").join('\n') + '\n';
    }
}
_LineWriterImpl_indentation = new WeakMap(), _LineWriterImpl_currentIndentation = new WeakMap(), _LineWriterImpl_lines = new WeakMap();
