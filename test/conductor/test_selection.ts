
// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export function getStackTrace<T>(fn: (...args: Parameters<NonNullable<typeof Error.prepareStackTrace>>) => T): T {
  const {prepareStackTrace} = Error;
  try {
    Error.prepareStackTrace = fn;
    return new Error().stack as T;
  } finally {
    Error.prepareStackTrace = prepareStackTrace;
  }
}

let testCaptureInstance: TestCapture|undefined;
export class TestCapture {
  readonly captures: Array<{test: Mocha.Test, file: string, line: number}> = [];
  constructor() {
    const mochaIt = it;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const proxy: any = this.proxyIt.bind(this, mochaIt);
    proxy.only = mochaIt.only;
    proxy.skip = mochaIt.skip;
    proxy.retries = mochaIt.retries;
    globalThis.it = proxy;
  }

  proxyIt(mochaIt: Mocha.TestFunction, ...args: Parameters<Mocha.TestFunction>): Mocha.Test {
    const {file, line} = getStackTrace((err, stackTraces) => {
      const firstTestStackframe = stackTraces.find(
          frame => frame.getFileName()?.includes('.test.js') || frame.getFileName()?.includes('_test.js'));
      const file = firstTestStackframe?.getFileName();
      const line = Number(firstTestStackframe?.getLineNumber());
      return {file, line};
    });
    const test = mochaIt(...args);
    if (file && line !== undefined) {
      this.captures.push({test, file, line});
    }
    return test;
  }

  static instance() {
    if (!testCaptureInstance) {
      testCaptureInstance = new TestCapture();
    }
    return testCaptureInstance;
  }

  testRanges() {
    const ranges = new Map<string, Array<{test: Mocha.Test, file: string, begin: number, end: number}>>();
    const testsInFile = new Map<string, Array<{test: Mocha.Test, file: string, line: number}>>();

    for (const test of this.captures) {
      const tests = testsInFile.get(test.file);
      if (tests) {
        tests.push(test);
      } else {
        testsInFile.set(test.file, [test]);
      }
    }
    for (const [file, tests] of testsInFile.entries()) {
      ranges.set(file, []);
      tests.sort((a, b) => a.line - b.line);
      for (let i = 0; i < tests.length - 1; ++i) {
        const {test, line: begin} = tests[i];
        const {line: end} = tests[i + 1];
        ranges.get(file)?.push({test, file, begin, end});
      }
      const {test, line: begin} = tests[tests.length - 1];
      ranges.get(file)?.push({test, file, begin, end: -1});
    }

    return ranges;
  }

  skipUnselectedTests(testSelections: Map<string, number[]>) {
    const testRanges = this.testRanges();

    for (const [file, locations] of testSelections) {
      const ranges = testRanges.get(file);
      if (!ranges) {
        continue;
      }

      for (const {test, begin, end} of ranges) {
        test.pending = !locations.find(line => begin <= line && (end === -1 || end > line));
      }
    }
  }
}
