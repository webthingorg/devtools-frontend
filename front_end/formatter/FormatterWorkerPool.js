// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as FormatterActions from '../formatter_worker/FormatterActions.js';  // eslint-disable-line rulesdir/es_modules_import

const MAX_WORKERS = Math.min(2, navigator.hardwareConcurrency - 1);

/** @type {!FormatterWorkerPool} */
let formatterWorkerPoolInstance;

export class FormatterWorkerPool {
  constructor() {
    /** @type {!Array<!Task>} */
    this._taskQueue = [];
    /** @type {!Map<!Common.Worker.WorkerWrapper, ?Task>} */
    this._workerTasks = new Map();
  }

  /**
   * @return {!FormatterWorkerPool}
   */
  static instance() {
    if (!formatterWorkerPoolInstance) {
      formatterWorkerPoolInstance = new FormatterWorkerPool();
    }

    return formatterWorkerPoolInstance;
  }

  /**
   * @return {!Common.Worker.WorkerWrapper}
   */
  _createWorker() {
    const worker = Common.Worker.WorkerWrapper.fromURL(
        new URL('../formatter_worker/formatter_worker-entrypoint.js', import.meta.url));
    worker.onmessage = this._onWorkerMessage.bind(this, worker);
    worker.onerror = this._onWorkerError.bind(this, worker);
    return worker;
  }

  _processNextTask() {
    if (!this._taskQueue.length) {
      return;
    }

    let freeWorker = [...this._workerTasks.keys()].find(worker => !this._workerTasks.get(worker));
    if (!freeWorker && this._workerTasks.size < MAX_WORKERS) {
      freeWorker = this._createWorker();
    }
    if (!freeWorker) {
      return;
    }

    const task = this._taskQueue.shift();
    if (task) {
      this._workerTasks.set(freeWorker, task);
      freeWorker.postMessage({method: task.method, params: task.params});
    }
  }

  /**
   * @param {!Common.Worker.WorkerWrapper} worker
   * @param {!MessageEvent} event
   */
  _onWorkerMessage(worker, event) {
    const task = this._workerTasks.get(worker);
    if (!task) {
      return;
    }
    if (task.isChunked && event.data && !event.data['isLastChunk']) {
      task.callback(event.data);
      return;
    }

    this._workerTasks.set(worker, null);
    this._processNextTask();
    task.callback(event.data ? event.data : null);
  }

  /**
   * @param {!Common.Worker.WorkerWrapper} worker
   * @param {!Event} event
   */
  _onWorkerError(worker, event) {
    console.error(event);
    const task = this._workerTasks.get(worker);
    worker.terminate();
    this._workerTasks.delete(worker);

    const newWorker = this._createWorker();
    this._workerTasks.set(newWorker, null);
    this._processNextTask();
    if (task) {
      task.callback(null);
    }
  }

  /**
   * @param {string} methodName
   * @param {!Object<string, string>} params
   * @param {function(boolean, *):void} callback
   */
  _runChunkedTask(methodName, params, callback) {
    const task = new Task(methodName, params, onData, true);
    this._taskQueue.push(task);
    this._processNextTask();

    /**
     * @param {?Object} data
     */
    function onData(data) {
      if (!data) {
        callback(true, null);
        return;
      }
      const isLastChunk = 'isLastChunk' in data && Boolean(data['isLastChunk']);
      const chunk = 'chunk' in data && data['chunk'];
      callback(isLastChunk, chunk);
    }
  }

  /**
   * @param {!FormatterActions.FormatterActions} methodName
   * @param {!Object<string, string>} params
   * @return {!Promise<*>}
   */
  _runTask(methodName, params) {
    return new Promise(resolve => {
      const task = new Task(methodName, params, resolve, false);
      this._taskQueue.push(task);
      this._processNextTask();
    });
  }

  /**
   * @param {string} mimeType
   * @param {string} content
   * @param {string} indentString
   * @return {!Promise<!FormatResult>}
   */
  format(mimeType, content, indentString) {
    const parameters = {mimeType: mimeType, content: content, indentString: indentString};
    return /** @type {!Promise<!FormatResult>} */ (this._runTask(FormatterActions.FormatterActions.FORMAT, parameters));
  }

  /**
   * @param {string} content
   * @return {!Promise<!Array<!{name: string, offset: number}>>}
   */
  javaScriptIdentifiers(content) {
    return this._runTask(FormatterActions.FormatterActions.JAVASCRIPT_IDENTIFIERS, {content: content})
        .then(ids => ids || []);
  }

  /**
   * @param {string} content
   * @return {!Promise<string>}
   */
  evaluatableJavaScriptSubstring(content) {
    return this._runTask(FormatterActions.FormatterActions.EVALUATE_JAVASCRIPT_SUBSTRING, {content: content})
        .then(text => text || '');
  }

  /**
   * @param {string} content
   * @param {string} mimeType
   * @param {function(boolean, !Array<!OutlineItem>):void} callback
   * @return {boolean}
   */
  outlineForMimetype(content, mimeType, callback) {
    switch (mimeType) {
      case 'text/css':
        this._runChunkedTask(FormatterActions.FormatterActions.CSS_OUTLINE, {content}, callback);
        return true;
      case 'text/html':
        this._runChunkedTask(FormatterActions.FormatterActions.HTML_OUTLINE, {content}, callback);
        return true;
      case 'text/javascript':
        this._runChunkedTask(FormatterActions.FormatterActions.JAVASCRIPT_OUTLINE, {content}, callback);
        return true;
    }
    return false;
  }

  /**
   * @param {string} content
   * @return {!Promise<?string>}
   */
  findLastExpression(content) {
    return /** @type {!Promise<?string>} */ (
        this._runTask(FormatterActions.FormatterActions.FIND_LAST_EXPRESSION, {content}));
  }

  /**
   * @param {string} content
   * @return {!Promise<?{baseExpression: string, receiver: string, argumentIndex: number, functionName: string}>}
   */
  findLastFunctionCall(content) {
    return /** @type {!Promise<?{baseExpression: string, receiver: string, argumentIndex: number, functionName: string}>} */ (
        this._runTask(FormatterActions.FormatterActions.FIND_LAST_FUNCTION_CALL, {content}));
  }

  /**
   * @param {string} content
   * @return {!Promise<!Array<string>>}
   */
  argumentsList(content) {
    return /** @type {!Promise<!Array<string>>} */ (
        this._runTask(FormatterActions.FormatterActions.ARGUMENTS_LIST, {content}));
  }
}

class Task {
  /**
   * @param {string} method
   * @param {!Object<string, string>} params
   * @param {function(?MessageEvent):void} callback
   * @param {boolean=} isChunked
   */
  constructor(method, params, callback, isChunked) {
    this.method = method;
    this.params = params;
    this.callback = callback;
    this.isChunked = isChunked;
  }
}

export class FormatResult {
  constructor() {
    /** @type {string} */
    this.content;
    /** @type {!FormatMapping} */
    this.mapping;
  }
}

/**
 * @return {!FormatterWorkerPool}
 */
export function formatterWorkerPool() {
  return FormatterWorkerPool.instance();
}

/** @typedef {{line: number, column: number, title: string, subtitle: (string|undefined) }} */
// @ts-ignore typedef
export let OutlineItem;

/** @typedef {{original: !Array<number>, formatted: !Array<number>}} */
// @ts-ignore typedef
export let FormatMapping;

/**
 * @typedef {{startLine: number, startColumn: number, endLine: number, endColumn: number}}
 */
// @ts-ignore typedef
export let TextRange;
