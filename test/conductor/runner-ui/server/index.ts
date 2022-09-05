// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import childProcess = require('child_process');
import path = require('path');
import url = require('url');
import http = require('http');
import fs = require('fs');

function thirdPartyPath() {
  return path.join('third_party');
}

function nodePath() {
  const paths = {
    'darwin': path.join('mac', 'node-darwin-x64', 'bin', 'node'),
    'linux': path.join('linux', 'node-linux-x64', 'bin', 'node'),
    'win32': path.join('win', 'node.exe'),
  };
  return path.join(thirdPartyPath(), 'node', paths['linux']);
}

const env = Object.create(process.env);
const TEST_RUNNER_PATH = path.resolve('scripts', 'test', 'run_test_suite.js');
const DEFAULT_ARGS = [
  TEST_RUNNER_PATH,
  '--config=test/e2e/test-runner-config.json',
  '--mocha-reporter=/usr/local/google/home/ergunsh/Chromium/devtools/devtools-frontend/out/Default/gen/test/conductor/runner-ui/mocha_helpers/reporter.js',
  '--artifacts-output-path=/usr/local/google/home/ergunsh/Chromium/devtools/devtools-frontend/out/Default/gen/test/conductor/runner-ui/client/artifacts',
];

interface Test {
  title: string;
  suite: string;
  status: 'pending'|'running'|'passed'|'failed'|'skipped';
}

interface Suite {
  title: string;
  tests: Test[];
  status: 'in-progress'|'completed';
}

const state: {
  suites: {[key in string]: Suite;},
} = {
  suites: {},
};

class ReporterUiServer {
  #emitFns: Function[] = [];
  #server: http.Server;

  constructor() {
    this.#server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url!, true);
      if (parsedUrl.pathname === '/execute') {
        this.#handleExecute(req, res);
        return;
      }

      if (parsedUrl.pathname === '/state') {
        this.#handleState(req, res);
        return;
      }

      if (parsedUrl.pathname === '/listen') {
        this.#handleListen(req, res);
        return;
      }

      if (parsedUrl.pathname === '/') {
        this.#handleFile('/index.html', res);
        return;
      }

      this.#handleFile(parsedUrl.pathname || '/app.js', res);
    });
  }

  emitMessage(message: any) {
    this.#emitFns.forEach(emitFn => {
      emitFn(message);
    });
  }

  #handleFile(pathname: string, res: http.ServerResponse) {
    let contentType = 'text/html';
    if (pathname.endsWith('.js')) {
      contentType = 'text/javascript';
    } else if (pathname.endsWith('.css')) {
      contentType = 'text/css';
    } else if (pathname.endsWith('.png')) {
      contentType = 'image/png';
    }

    fs.readFile(path.resolve(__dirname, '..', 'client', pathname.substring(1)), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
        });
        res.end(data);
      }
    });
  }

  #handleListen(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    const emitFn = (data: any) => {
      res.write(`id: ${new Date().toLocaleTimeString()}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    emitFn(JSON.stringify(state));
    this.#emitFns.push(emitFn);
  }

  #handleState(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200);
    res.write(JSON.stringify(state));
    res.end();
  }

  #handleExecute(req: http.IncomingMessage, res: http.ServerResponse) {
    const parsedUrl = url.parse(req.url!, true);
    const commandStr = parsedUrl.query.command;
    if (typeof commandStr === 'string' && Object.keys(serverCommands).includes(commandStr)) {
      const command = serverCommands[commandStr];
      const paramsStr = Array.isArray(parsedUrl.query.params) ? parsedUrl.query.params[0] : parsedUrl.query.params;
      const params = paramsStr ? JSON.parse(paramsStr) : [];
      command(...params);
    }
    res.writeHead(200);
    res.end();
  }

  async start() {
    return new Promise<void>(resolve => {
      this.#server.listen(9999, () => {
        console.log('Server listening on 9999');
        resolve();
      });
    });
  }
}

const reporterUiServer = new ReporterUiServer();
function runTestCommand(args: string[] = []) {
  const allArgs = [...DEFAULT_ARGS, ...args];
  console.log(`Running: '${nodePath()} ${allArgs.join(' ')}'`);
  const process = childProcess.spawn(nodePath(), allArgs, {env, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
  // process.stderr?.on("data", (ev: Buffer) => {
  //   console.log(ev.toString());
  // });

  startListeningMochaProcess(process);
  killFn = () => process.kill();
}

function startListeningMochaProcess(process: childProcess.ChildProcess) {
  state.suites = {};

  process.on('message', (msg: any) => {
    const differentMessages = msg.split('||||');
    differentMessages.forEach((line: string) => {
      if (!line) {
        return;
      }

      reporterUiServer.emitMessage(line);
      const parsedMsg = JSON.parse(line);
      switch (parsedMsg.event) {
        case 'suite-begin': {
          state.suites[parsedMsg.params.title] = {
            title: parsedMsg.params.title,
            tests: parsedMsg.params.tests,
            status: 'in-progress',
          };
          break;
        }
        case 'suite-end': {
          if (state.suites[parsedMsg.params.title]) {
            state.suites[parsedMsg.params.title].status = 'completed';
          }
          break;
        }
        case 'test-begin': {
          const test = state.suites[parsedMsg.params.suite]?.tests.find(test => test.title === parsedMsg.params.title);
          if (test) {
            test.status = 'running';
          }
          break;
        }
        case 'test-pass': {
          const test = state.suites[parsedMsg.params.suite]?.tests.find(test => test.title === parsedMsg.params.title);
          if (test) {
            test.status = 'passed';
          }
          break;
        }
        case 'test-fail': {
          const test = state.suites[parsedMsg.params.suite]?.tests.find(test => test.title === parsedMsg.params.title);
          if (test) {
            test.status = 'failed';
          }
          break;
        }
        case 'test-pending': {
          const test = state.suites[parsedMsg.params.suite]?.tests.find(test => test.title === parsedMsg.params.title);
          if (test) {
            test.status = 'skipped';
          }
          break;
        }
      }
    });
  });
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');  // $& means the whole matched string
}
let killFn: Function;
const serverCommands: {[key in string]: Function;} = {
  'runAllTests': () => {
    console.log('Running all tests');
    runTestCommand();
  },
  'abort': () => {
    console.log('Aborted');
    killFn?.();
    reporterUiServer.emitMessage(JSON.stringify({event: 'aborted'}));
  },
  'runTest': (...params: any) => {
    console.log('params', params);
    const testName = params.map((param: string) => escapeRegExp(param)).join('|');
    console.log(`Running test: ${testName}`);
    killFn?.();
    runTestCommand([
      `--mocha-fgrep='${testName}'`,
    ]);
  },
};

reporterUiServer.start();
