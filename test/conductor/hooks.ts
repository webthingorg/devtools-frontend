// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable no-console */

import {ChildProcess, spawn} from 'child_process';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

import {getBrowserAndPages, getHostedModeServerPort, setBrowserAndPages, setHostedModeServerPort} from './puppeteer-state.js';

const HOSTED_MODE_SERVER_PATH = path.join(__dirname, '..', '..', 'scripts', 'hosted_mode', 'server.js');
const EMPTY_PAGE = 'data:text/html,';
const DEFAULT_TAB = {
  name: 'elements',
  selector: '.elements',
};

const cwd = path.join(__dirname, '..', '..');
const {execPath} = process;
const width = 1280;
const height = 720;

const chromeDebugPort = 9222;
const hostedModeServerPortBase = 8100;
const portRange = 250;
const headless = !process.env['DEBUG'];
const envSlowMo = process.env['STRESS'] ? 50 : undefined;
const envThrottleRate = process.env['STRESS'] ? 3 : 1;

const logLevels = {
  log: 'I',
  info: 'I',
  error: 'E',
  exception: 'E',
  assert: 'E',
};

let hostedModeServer: ChildProcess;
let browser: puppeteer.Browser;
let frontendUrl: string;

interface DevToolsTarget {
  url: string;
  id: string;
}

const envChromeBinary = process.env['CHROME_BIN'];

async function loadTargetPageAndDevToolsFrontend(hostedModeServerPort: number) {
  const launchArgs = [`--remote-debugging-port=${chromeDebugPort}`];
  const opts: puppeteer.LaunchOptions = {
    headless,
    executablePath: envChromeBinary,
    defaultViewport: null,
    dumpio: !headless,
    slowMo: envSlowMo,
  };

  // Toggle either viewport or window size depending on headless vs not.
  if (headless) {
    opts.defaultViewport = {width, height};
  } else {
    launchArgs.push(`--window-size=${width},${height}`);
  }

  opts.args = launchArgs;

  browser = await puppeteer.launch(opts);
  // Load the target page.
  const srcPage = await browser.newPage();
  await srcPage.goto(EMPTY_PAGE);

  // Now get the DevTools listings.
  const devtools = await browser.newPage();
  await devtools.goto(`http://localhost:${chromeDebugPort}/json`);

  // Find the appropriate item to inspect the target page.
  const listing = await devtools.$('pre');
  const json = await devtools.evaluate(listing => listing.textContent, listing);
  const targets: DevToolsTarget[] = JSON.parse(json);
  const target = targets.find(target => target.url === EMPTY_PAGE);
  if (!target) {
    throw new Error(`Unable to find target page: ${EMPTY_PAGE}`);
  }

  const {id} = target;
  await devtools.close();

  // Connect to the DevTools frontend.
  const frontend = await browser.newPage();
  frontendUrl = `http://localhost:${hostedModeServerPort}/front_end/devtools_app.html?ws=localhost:${
      chromeDebugPort}/devtools/page/${id}`;
  await frontend.goto(frontendUrl, {waitUntil: ['networkidle2', 'domcontentloaded']});

  frontend.on('error', error => {
    throw new Error(`Error in Frontend: ${error}`);
  });

  frontend.on('pageerror', error => {
    throw new Error(`Page error in Frontend: ${error}`);
  });

  process.on('unhandledRejection', error => {
    throw new Error(`Unhandled rejection in Frontend: ${error}`);
  });

  frontend.on('console', msg => {
    const logLevel = logLevels[msg.type() as keyof typeof logLevels] as string;
    if (logLevel) {
      let filename = '<unknown>';
      if (msg.location() && msg.location().url) {
        filename = msg.location()!.url!.replace(/^.*\//, '');
      }
      console.log(`${logLevel} ${filename}:${msg.location().lineNumber}: ${msg.text()}`);
    }
  });

  setBrowserAndPages({target: srcPage, frontend, browser});
}

export async function resetPages() {
  const {target, frontend} = getBrowserAndPages();
  // Reload the target page.
  await target.goto(EMPTY_PAGE, {waitUntil: ['domcontentloaded']});

  // Clear any local storage settings.
  await frontend.evaluate(() => localStorage.clear());

  await reloadDevTools();
}

type ReloadDevToolsOptions = {
  selectedPanel?: {name: string, selector?: string},
  canDock?: boolean,
  queryParams?: {panel?: string}
};

export async function reloadDevTools(options: ReloadDevToolsOptions = {}) {
  const {frontend} = getBrowserAndPages();

  // For the unspecified case wait for loading, then wait for the elements panel.
  const {selectedPanel = DEFAULT_TAB, canDock = false, queryParams = {}} = options;

  if (selectedPanel.name !== DEFAULT_TAB.name) {
    await frontend.evaluate(name => {
      // @ts-ignore
      globalThis.localStorage.setItem('panel-selectedTab', `"${name}"`);
    }, selectedPanel.name);
  }

  // Reload the DevTools frontend and await the elements panel.
  await frontend.goto(EMPTY_PAGE, {waitUntil: ['domcontentloaded']});
  // omit "can_dock=" when it's false because appending "can_dock=false"
  // will make getElementPosition in shared helpers unhappy
  let url = canDock ? `${frontendUrl}&can_dock=true` : frontendUrl;

  if (queryParams.panel) {
    url += `&panel=${queryParams.panel}`;
  }

  await frontend.goto(url, {waitUntil: ['domcontentloaded']});

  if (!queryParams.panel && selectedPanel.selector) {
    await frontend.waitForSelector(selectedPanel.selector);
  }

  // Under stress conditions throttle the CPU down.
  if (envThrottleRate !== 1) {
    console.log(`Throttling CPU: ${envThrottleRate}x slowdown`);

    const client = await frontend.target().createCDPSession();
    await client.send('Emulation.setCPUThrottlingRate', {rate: envThrottleRate});
  }
}

enum ServerStartStatus {
  STARTED,
  PORT_IN_USE,
  ERROR,
}

interface ServerStartResult {
  status: ServerStartStatus, message: string,
}

function startHostedModeServer(serverPort: number, chromePort: number): Promise<ServerStartResult> {
  console.log(`Spawning hosted mode server on port ${serverPort}`);

  function handleHostedModeError(error: Error) {
    throw new Error(`Hosted mode server: ${error}`);
  }

  // Copy the current env and append the ports.
  const env = Object.create(process.env);
  env.PORT = serverPort;
  env.REMOTE_DEBUGGING_PORT = chromePort;
  return new Promise(resolve => {
    hostedModeServer = spawn(execPath, [HOSTED_MODE_SERVER_PATH], {cwd, env, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
    hostedModeServer.on('message', message => {
      if (message === 'PORT_IN_USE') {
        resolve({
          status: ServerStartStatus.PORT_IN_USE,
          message: `Could not start hosted mode server on port ${serverPort}`,
        });
      } else if (message === 'READY') {
        resolve({status: ServerStartStatus.STARTED, message: 'Started OK on port ${serverPort}'});
      } else {
        resolve({status: ServerStartStatus.ERROR, message: 'Unknown message from hosted mode server:' + message});
      }
    });
    hostedModeServer.on('error', handleHostedModeError);
    if (hostedModeServer.stderr) {
      hostedModeServer.stderr.on('data', handleHostedModeError);
    }
  });
}

class PortGenerator {
  private portBase: number;
  private portRange: number;
  private tried: Set<number> = new Set();

  constructor(portBase: number, portRange: number) {
    this.portBase = portBase;
    this.portRange = portRange;
  }

  private randomInRange() {
    return Math.floor(Math.random() * this.portRange);
  }

  private firstNonTried() {
    for (let port = this.portBase; port < this.portBase + this.portRange; port++) {
      if (!this.tried.has(port)) {
        return port;
      }
    }
    return 0;
  }

  /**
   * The port returned by next will be in the range [portBase, portBase +
   * portRange) and will never be the same as a previously returned value. If no
   * more ports are available, return 0.
   */
  next(): number {
    let candidate;
    if (this.tried.size < this.portRange / 2) {
      do {
        candidate = this.portBase + this.randomInRange();
      } while (this.tried.has(candidate));
    } else {
      // Avoid the case where we are trying to random a needle in a haystack and
      // just linear probe.
      candidate = this.firstNonTried();
    }
    if (candidate) {
      this.tried.add(candidate);
    }
    return candidate;
  }
}

// Try to start the hosted mode server on a port within [portBase, portBase +
// portRange). Throws after trying to unsuccessfully start the server
// |retries| times.
async function startHostedModeServerWithRetries(retries: number, portBase: number, portRange: number): Promise<number> {
  const portGenerator = new PortGenerator(portBase, portRange);
  let tries = 0;
  do {
    const port = portGenerator.next();
    if (!port) {
      throw new Error('Could not get a port for the hosted mode server');
    }
    tries++;
    const result = await startHostedModeServer(port, chromeDebugPort);
    if (result.status === ServerStartStatus.STARTED) {
      return port;
    }
    if (result.status === ServerStartStatus.ERROR) {
      throw new Error(result.message);
    }
    // Retry on PORT_IN_USE.
  } while (tries < retries);
  throw new Error(`Could not start hosted mode server, exhausted ${retries} retries`);
}

export async function globalSetup() {
  const port = await startHostedModeServerWithRetries(20, hostedModeServerPortBase, portRange);
  setHostedModeServerPort(port);
  await loadTargetPageAndDevToolsFrontend(port);
}

export async function globalTeardown() {
  // We need to kill the browser before we stop the hosted mode server.
  // That's because the browser could continue to make network requests,
  // even after we would have closed the server. If we did so, the requests
  // would fail and the test would crash on closedown. This only happens
  // for the very last test that runs.
  await browser.close();

  console.log(`Stopping hosted mode server on port ${getHostedModeServerPort()}`);
  hostedModeServer.kill();
}
