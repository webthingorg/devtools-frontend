// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable no-console */
// no-console disabled here as this is a test runner and expects to output to the console

import {spawn} from 'child_process';
import * as cucumber from 'cucumber';
import {join} from 'path';
import * as puppeteer from 'puppeteer';

import {click, getBrowserAndPages, resetPages, resourcesPath, store, waitFor} from '../shared/helper.js';

const envChromeBinary = process.env['CHROME_BIN'];
const envDebug = !!process.env['DEBUG'];
const envPort = process.env['PORT'] || 9222;
const envNoShuffle = !!process.env['NO_SHUFFLE'];
const envInteractive = !!process.env['INTERACTIVE'];
const interactivePage = 'http://localhost:8090/test/screenshots/interactive/index.html';
const blankPage = 'data:text/html,';
const headless = true;  // !envDebug;
const width = 1280;
const height = 720;

let exitCode = 0;

interface DevToolsTarget {
  url: string;
  id: string;
}

function interruptionHandler() {
  console.log('\n');
  exitCode = 1;
  shutdown();
}

function shutdown() {
  console.log('\n');
  console.log('Stopping hosted mode server');
  hostedModeServer.kill();

  console.log(`Exiting with status code ${exitCode}`);
  process.exit(exitCode);
}

process.on('SIGINT', interruptionHandler);
process.on('SIGTERM', interruptionHandler);
process.on('uncaughtException', interruptionHandler);
process.stdin.resume();

const launchArgs = [`--remote-debugging-port=${envPort}`];

// 1. Launch Chromium.
const opts: puppeteer.LaunchOptions = {
  headless,
  executablePath: envChromeBinary,
  defaultViewport: null,
};

// Toggle either viewport or window size depending on headless vs not.
if (headless) {
  opts.defaultViewport = {width, height};
} else {
  launchArgs.push(`--window-size=${width},${height}`);
}

opts.args = launchArgs;

const launchedBrowser = puppeteer.launch(opts);
const pages: puppeteer.Page[] = [];

function handleHostedModeError(data: Error) {
  console.log(`Hosted mode server: ${data}`);
  interruptionHandler();
}

async function navigateToApplicationTab(target: puppeteer.Page, testName: string) {
  await target.goto(`${resourcesPath}/application/${testName}.html`);
  await click('#tab-resources');
  // Make sure the application navigation list is shown
  await waitFor('.storage-group-list-item');
}

console.log('Spawning hosted mode server');
const serverScriptPath = join(__dirname, '..', '..', 'scripts', 'hosted_mode', 'server.js');
const cwd = join(__dirname, '..', '..');
const {execPath} = process;
const hostedModeServer = spawn(execPath, [serverScriptPath], {cwd});
hostedModeServer.on('error', handleHostedModeError);
hostedModeServer.stderr.on('data', handleHostedModeError);

interface DevToolsTarget {
  url: string;
  id: string;
}

// 3. Spin up the test environment
(async function() {
  try {
    let screenshotPage: puppeteer.Page|undefined;
    if (envInteractive) {
      const screenshotBrowser = await puppeteer.launch({
        headless: false,
        executablePath: envChromeBinary,
        defaultViewport: null,
        args: [`--window-size=${width},${height}`],
      });
      screenshotPage = await screenshotBrowser.newPage();
      await screenshotPage.goto(interactivePage, {waitUntil: ['domcontentloaded']});
    }

    const browser = await launchedBrowser;

    // Load the target page.
    const srcPage = await browser.newPage();
    await srcPage.goto(blankPage);
    pages.push(srcPage);

    // Now get the DevTools listings.
    const devtools = await browser.newPage();
    await devtools.goto(`http://localhost:${envPort}/json`);

    // Find the appropriate item to inspect the target page.
    const listing = await devtools.$('pre');
    const json = await devtools.evaluate(listing => listing.textContent, listing);
    const targets: DevToolsTarget[] = JSON.parse(json);
    const target = targets.find(target => target.url === blankPage);
    if (!target) {
      throw new Error(`Unable to find target page: ${blankPage}`);
    }

    const {id} = target;
    await devtools.close();

    // Connect to the DevTools frontend.
    const frontend = await browser.newPage();
    const frontendUrl = `http://localhost:8090/front_end/devtools_app.html?ws=localhost:${envPort}/devtools/page/${id}`;
    await frontend.goto(frontendUrl, {waitUntil: ['networkidle2', 'domcontentloaded']});

    frontend.on('error', err => {
      console.log('Error in Frontend');
      console.log(err);
    });

    frontend.on('pageerror', err => {
      console.log('Page Error in Frontend');
      console.log(err);
    });

    const resetPages =
        async (opts: {enabledExperiments?: string[], selectedPanel?: {name: string, selector?: string}} = {}) => {
      // Reload the target page.
      await srcPage.goto(blankPage, {waitUntil: ['domcontentloaded']});

      // Clear any local storage settings.
      await frontend.evaluate(() => localStorage.clear());

      const {enabledExperiments} = opts;
      let {selectedPanel} = opts;
      await frontend.evaluate(enabledExperiments => {
        for (const experiment of enabledExperiments) {
          // @ts-ignore
          globalThis.Root.Runtime.experiments.setEnabled(experiment, true);
        }
      }, enabledExperiments || []);

      if (selectedPanel) {
        await frontend.evaluate(name => {
          // @ts-ignore
          globalThis.localStorage.setItem('panel-selectedTab', `"${name}"`);
        }, selectedPanel.name);
      }

      // Reload the DevTools frontend and await the elements panel.
      await frontend.goto(blankPage, {waitUntil: ['domcontentloaded']});
      await frontend.goto(frontendUrl, {waitUntil: ['domcontentloaded']});

      // Default to elements if no other panel is defined.
      if (!selectedPanel) {
        selectedPanel = {
          name: 'elements',
          selector: '.elements',
        };
      }

      if (!selectedPanel.selector) {
        return;
      }

      // For the unspecified case wait for loading, then wait for the elements panel.
      await frontend.waitForSelector(selectedPanel.selector);
    };

    store(browser, srcPage, frontend, screenshotPage, resetPages);

    // 3. Run tests.
    const runArgs = join(__dirname, '..', 'features');
    const cucumberLocation = join(__dirname, '..', '..', 'node_modules', '.bin', 'cucumber-js')

    await new Promise((resolve) => {
      const cucumberProcess = spawn(cucumberLocation, [runArgs]);
      cucumberProcess.stdout.pipe(process.stdout);
      cucumberProcess.stderr.pipe(process.stderr);
      cucumberProcess.on('exit', () => {
        resolve();
        shutdown();
      });
    });
    // const cli = new (require('cucumber').Cli)({argv: runArgs, cwd: __dirname, stdout: process.stdout});
    // await cli.run();

  } catch (err) {
    console.warn(err);
  } finally {
    shutdown();
  }
})();
