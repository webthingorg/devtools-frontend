// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as http from 'http';
import * as Mocha from 'mocha';

import {type AddressInfo} from 'net';

const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
} = Mocha.Runner.constants;

enum TestStatus {
  RUNNING = 'running',
  SKIPPED = 'skipped',
  PASSED = 'passed',
  FAILED = 'failed',
}

interface TestReport {
  testId: string;
  testName: string;
  status: TestStatus;
  duration: string;
  screenshot?: string;
}

class HTMLReporter {
  static render(port: number) {
    return `
      <html>
        <body>
          <div id="connection-status"></div>
          <div id="content"></div>
        </body>
        <script>
          const eventSource = new EventSource('http://localhost:${port}/reports');
          eventSource.addEventListener('open', () => {
            document.querySelector("#connection-status").textContent = "Connected";
          });
          eventSource.onmessage = (ev) => {
            const contentDiv = document.createElement("div");
            contentDiv.textContent = ev.data;
            document.querySelector("#content").appendChild(contentDiv);
          };
        </script>
      </html>
    `;
  }
}

class ReportStorage {
  #listener?: (report: TestReport) => void;
  #testReports: {[key in string]: TestReport} = {};

  setReport(report: TestReport) {
    this.#testReports[report.testId] = report;
    this.#listener?.(report);
  }

  getReports() {
    return this.#testReports;
  }

  listenTestReportAdded(fn: (report: TestReport) => void) {
    this.#listener = fn;
  }
}

class ReporterServer {
  #server: http.Server;
  #reportStorage: ReportStorage;
  #port?: number;
  #emitFns: Function[] = [];

  constructor(reportStorage: ReportStorage) {
    this.#reportStorage = reportStorage;
    this.#server = http.createServer((req, res) => {
      if (req.url === '/reports') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        res.write(`id: ${new Date().toLocaleTimeString()}\n`);
        res.write(`data: ${JSON.stringify(this.#reportStorage.getReports())}\n\n`);
        this.#emitFns.push((data: any) => {
          res.write(`id: ${new Date().toLocaleTimeString()}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        });
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/html',
        });
        res.write(HTMLReporter.render(this.#port || 0));
        res.end();
      }
    });
  }

  listen() {
    this.#server.listen(() => {
      console.log('Reporter server', this.#server.address());
      this.#port = (this.#server.address() as AddressInfo).port;
    });
    this.#reportStorage.listenTestReportAdded(report => {
      this.#emitFns.forEach(emit => {
        emit(report);
      });
    });
  }
}

class HtmlReporter extends Mocha.reporters.Spec {
  private suitePrefix?: string;
  #reportStorage: ReportStorage = new ReportStorage();
  #server: ReporterServer = new ReporterServer(this.#reportStorage);

  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);
    // `reportOptions` doesn't work with .mocharc.js (configurig via exports).
    // BUT, every module.exports is forwarded onto the options object.
    this.suitePrefix = (options as {suiteName: string} | undefined)?.suiteName;

    runner.on(EVENT_TEST_PASS, this.onTestPass.bind(this));
    runner.on(EVENT_TEST_FAIL, this.onTestFail.bind(this));
    runner.on(EVENT_TEST_PENDING, this.onTestSkip.bind(this));
    runner.on(EVENT_RUN_END, this.onceEventRunEnds.bind(this));

    this.#server.listen();
  }

  private onTestPass(test: Mocha.Test) {
    const testResult = this.buildTestReport(test, {status: TestStatus.PASSED});
    this.#reportStorage.setReport(testResult);
  }

  private onTestFail(test: Mocha.Test, error: Error|unknown) {
    const testResult = this.buildTestReport(test, {status: TestStatus.FAILED});
    this.#reportStorage.setReport(testResult);
  }

  private onTestSkip(test: Mocha.Test) {
    const testResult = this.buildTestReport(test, {status: TestStatus.SKIPPED});
    this.#reportStorage.setReport(testResult);
  }

  private onceEventRunEnds() {
    // ResultsDb.sendCollectedTestResultsIfSinkIsAvailable();
  }

  private buildTestReport(test: Mocha.Test, {status}: {status: TestStatus}): TestReport {
    let testId = this.suitePrefix ? this.suitePrefix + '/' : '';
    testId += test.titlePath().join('/');  // Chrome groups test by a path logic.
    return {
      testName: test.fullTitle(),
      status,
      testId: testId,
      duration: `${test.duration || 0}ms`,
    };
  }
}

exports = module.exports = HtmlReporter;
