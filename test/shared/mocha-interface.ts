// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Mocha from 'mocha';
// @ts-expect-error
import * as commonInterface from 'mocha/lib/interfaces/common.js';
import * as Path from 'path';

import {platform, type Platform} from './helper.js';

type SuiteFunction = ((this: Mocha.Suite) => void)|undefined;
type ExclusiveSuiteFunction = (this: Mocha.Suite) => void;

declare global {
  /*
  * Contains screenshots
  */
  let itScreenshot: {
    (title: string, fn: Mocha.AsyncFunc): void,

    skip: (title: string, fn: Mocha.AsyncFunc) => void,

    skipOnPlatforms: (platforms: Array<Platform>, title: string, fn: Mocha.AsyncFunc) => void,
  };
  namespace Mocha {
    export interface TestFunction {
      skipOnPlatforms: (platforms: Array<Platform>, title: string, fn: Mocha.AsyncFunc) => void;
    }
  }
}

function devtoolsTestInterface(suite: Mocha.Suite) {
  const suites: [Mocha.Suite] = [suite];
  suite.on(
      Mocha.Suite.constants.EVENT_FILE_PRE_REQUIRE,
      function(context, file, mocha) {
        const common =
            // Different module outputs between tsc and esbuild.
            ('default' in commonInterface ? commonInterface.default : commonInterface)(suites, context, mocha);
        context['before'] = common.before;
        context['after'] = common.after;
        context['beforeEach'] = common.beforeEach;
        context['afterEach'] = common.afterEach;
        if (mocha.options.delay) {
          context['run'] = common.runWithSuite(suite);
        }
        function describeTitle(title: string) {
          const parsedPath = Path.parse(file);
          const directories = parsedPath.dir.split(Path.sep);
          const index = directories.lastIndexOf('e2e');
          let prefix = parsedPath.name;
          if (index >= 0) {
            prefix = [...directories.slice(index + 1), `${parsedPath.name}.ts`].join('/');
          }
          if (title.includes(prefix)) {
            return title;
          }
          return `${prefix}: ${title}`;
        }
        function describe(title: string, fn: SuiteFunction) {
          return common.suite.create({
            title: describeTitle(title),
            file: file,
            fn: fn,
          });
        }
        describe.only = function(title: string, fn: ExclusiveSuiteFunction) {
          return common.suite.only({
            title: describeTitle(title),
            file: file,
            fn: fn,
          });
        };
        describe.skip = function(title: string, fn: SuiteFunction) {
          return common.suite.skip({
            title: describeTitle(title),
            file: file,
            fn: fn,
          });
        };
        // @ts-expect-error
        context['describe'] = describe;
        const it = function(title: string, fn: Mocha.AsyncFunc) {
          const suite = suites[0];
          const test = new Mocha.Test(title, suite.isPending() ? undefined : fn);
          test.file = file;
          suite.addTest(test);
          return test;
        };
        // @ts-expect-error
        context.it = it;
        it.skip = function(title: string, _fn: Mocha.AsyncFunc) {
          // no fn to skip.
          return context.it(title);
        };
        it.only = function(title: string, fn: Mocha.AsyncFunc) {
          return common.test.only(mocha, context.it(title, fn));
        };
        it.skipOnPlatforms = function(platforms: Array<Platform>, title: string, fn: Mocha.AsyncFunc) {
          const shouldSkip = platforms.includes(platform);
          if (shouldSkip) {
            return context.it.skip(title);
          }
          return context.it(title, fn);
        };
        function screenshotTestTitle(title: string) {
          return '[screenshot]: ' + title;
        }
        // @ts-expect-error
        context.itScreenshot = function(title: string, fn: Mocha.AsyncFunc) {
          return context.it(screenshotTestTitle(title), fn);
        };
        // @ts-expect-error
        context.itScreenshot.skipOnPlatforms = function(
            platforms: Array<Platform>, title: string, fn: Mocha.AsyncFunc) {
          return context.it.skipOnPlatforms(platforms, screenshotTestTitle(title), fn);
        };
        // @ts-expect-error
        context.itScreenshot.skip = function(title: string) {
          return context.it.skip(screenshotTestTitle(title));
        };
      },
  );
}

devtoolsTestInterface.description = 'DevTools test interface';

module.exports = devtoolsTestInterface;
