// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {getBrowserAndPages} from '../../shared/helper.js';
import {getStructuredConsoleMessages} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('produces correct console log messages', async () => {
    const {target} = getBrowserAndPages();
    /* eslint-disable no-console */
    await target.evaluate(() => {
      console.log('log');
      console.debug('debug');
      console.info('info');
      console.warn('warn');
      console.error('error');
      for (let i = 0; i < 5; ++i) {
        console.log('repeated');
      }
      for (let i = 0; i < 2; ++i) {
        console.count('count');
      }
      console.group('group');
      console.groupEnd();
      console.log('1', '2', '3');
      console.groupCollapsed('groupCollapsed');
      console.log({property: 'value'});
      console.log(42);
      console.log(true);
      console.log(null);
      console.log(undefined);
      console.log(document);
      console.log(function() {});
      console.log(function f() {});
      console.log([1, 2, 3]);
      console.log(/regexp.*/);
      console.groupEnd();
      console.count();
      console.count();
      console.count();
      console.count('title');
      console.count('title');
      console.count('title');
    });
    const messages = await getStructuredConsoleMessages();
    assert.deepEqual(
        messages,
        [
          {
            message: 'log',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:2',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'info',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:4',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'warn',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:5',
            stackPreview: '\n(anonymous) @ __puppeteer_evaluation_script__:5',
            wrapperClasses: 'console-message-wrapper console-from-api console-warning-level',
          },
          {
            message: 'error',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:6',
            stackPreview: '\n(anonymous) @ __puppeteer_evaluation_script__:6',
            wrapperClasses: 'console-message-wrapper console-from-api console-error-level',
          },
          {
            message: 'repeated',
            messageClasses: 'console-message repeated-message',
            repeatCount: '5',
            source: '__puppeteer_evaluation_script__:8',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'count: 1',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:11',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'count: 2',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:11',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'group',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:13',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-group-title console-from-api console-info-level',
          },
          {
            message: '1 2 3',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:15',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'groupCollapsed',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:16',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-group-title console-from-api console-info-level',
          },
          {
            message: 'default: 1',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:28',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'default: 2',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:29',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'default: 3',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:30',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'title: 1',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:31',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'title: 2',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:32',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
          {
            message: 'title: 3',
            messageClasses: 'console-message',
            repeatCount: null,
            source: '__puppeteer_evaluation_script__:33',
            stackPreview: null,
            wrapperClasses: 'console-message-wrapper console-from-api console-info-level',
          },
        ],
        'Console messages were not displayed correctly');
  });
});
