// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable no-console */

import {ChildProcess, spawn} from 'child_process';
import * as Net from 'net';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

import {clearPuppeteerState, getBrowserAndPages, getHostedModeServerPort, setBrowserAndPages, setHostedModeServerPort} from './puppeteer-state.js';

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

const hostedModeServerPortBase = 8090;
const chromeDebuggingPortBase = 9222;
let portOffset: number;
// The following two ports have the invariant that they are equal to their base
// port above + portOffset, once set.
let envPort: number;
// We store this here because it doesn't change inbetween runs, even though we
// set/unset it globally in puppeteer-state.
let hostedModeServerPort: number;
const headless = !process.env['DEBUG'];
const envSlowMo = process.env['STRESS'] ? 50 : undefined;
const envThrottleRate = process.env['STRESS'] ? 3 : 1;
let unhandledRejectionSet = false;

let hostedModeServer: ChildProcess;
let browser: puppeteer.Browser;
let frontendUrl: string;

interface DevToolsTarget {
  url: string;
  id: string;
}

function handleHostedModeError(error: Error) {
  throw new Error(`Hosted mode server: ${error}`);
}

const envChromeBinary = process.env['CHROME_BIN'];

async function loadTargetPageAndDevToolsFrontend() {
  if (!envPort) {
    envPort = chromeDebuggingPortBase + portOffset;
    // TODO: Change back
    // envPort = chromeDebuggingPortBase + Math.floor(Math.random() * 100);
  }
  const launchArgs = [`--remote-debugging-port=${envPort}`];
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
  await devtools.goto(`http://localhost:${envPort}/json`);

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
      envPort}/devtools/page/${id}`;
  await frontend.goto(frontendUrl, {waitUntil: ['networkidle2', 'domcontentloaded']});

  frontend.on('error', error => {
    throw new Error(`Error in Frontend: ${error}`);
  });

  frontend.on('pageerror', error => {
    throw new Error(`Page error in Frontend: ${error}`);
  });

  if (!unhandledRejectionSet) {
    process.on('unhandledRejection', error => {
      throw new Error(`Unhandled rejection in Frontend: ${error}`);
    });
    unhandledRejectionSet = true;
  }

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

async function portIsFree(port: number) {
  return new Promise<boolean>((resolve, reject) => {
    const tester: Net.Server = Net.createServer()
         // @ts-ignore
         .once('error', err => {console.log(err); return err.code == 'EADDRINUSE' ? resolve(false) : reject(err)})
         .once('listening', () => { console.log('running server'); tester.once('close', () => resolve(true)).close(); })
         .listen(port);
  });
}

export async function globalSetup() {
  // TODO send REMOTE_DEBUGGING_PORT too.
  if (!hostedModeServerPort) {
    portOffset = Math.floor(Math.random() * 250);
    hostedModeServerPort = hostedModeServerPortBase + portOffset;
  }

  // TODO: check if port is in use. This won't help much with racing against
  // other parallel test runners, but it will avoid picking ports that are
  // currently in-use by other programs. Also check and set the chrome port
  // in that case.
  console.log(`Spawning hosted mode server, port=${hostedModeServerPort}`);

  let started: Promise<boolean>;
  do {
    started = new Promise((resolve, reject) => {
      // Copy the current env and append the port.
      const env = Object.create(process.env);
      env.PORT = hostedModeServerPort;
      hostedModeServer = spawn(execPath, [HOSTED_MODE_SERVER_PATH], {cwd, env, stdio: [null, null, null, 'ipc']});
      // hostedModeServer.stdout.pipe(process.stdout);
      // hostedModeServer.stderr.pipe(process.stderr);
      hostedModeServer.on('message', (message) => {
        if (message === 'portinuse') {
          console.log(`Could not open hosted mode server on port ${hostedModeServerPort}`);
          portOffset++;
          hostedModeServerPort++; // TODO: infinite loop
          resolve(false);
        } else if (message === 'listening') {
          console.log(`Started hosted mode server OK on port ${hostedModeServerPort}`);
          resolve(true);
        } else {
          throw new Error('Unknown message from hosted mode server:' + message);
        }
      });
    });
  } while (!await started);
  setHostedModeServerPort(hostedModeServerPort);

  if (hostedModeServer.stderr) hostedModeServer.stderr.on('data', handleHostedModeError);

  await loadTargetPageAndDevToolsFrontend();
}

export async function globalTeardown() {
  // We need to kill the browser before we stop the hosted mode server.
  // That's because the browser could continue to make network requests,
  // even after we would have closed the server. If we did so, the requests
  // would fail and the test would crash on closedown. This only happens
  // for the very last test that runs.
  await browser.close();

  console.log(`Stopping hosted mode server, port=${hostedModeServerPort}`);
  hostedModeServer.kill();

  clearPuppeteerState();
}
