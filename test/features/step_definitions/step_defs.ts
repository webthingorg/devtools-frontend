// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {spawn} from 'child_process';
import {Given} from 'cucumber';
import {join} from 'path';
import * as puppeteer from 'puppeteer';

import {click, getBrowserAndPages, resetPages, resourcesPath, store, waitFor} from '../../shared/helper.js';
import * as runner from '../../shared/runner';

const envPort = process.env['PORT'] || 9222;
const blankPage = 'data:text/html,';

let exitCode = 0;

interface DevToolsTarget {
  url: string;
  id: string;
}

function shutdown() {
  console.log('\n');
  console.log('Stopping hosted mode server');
  hostedModeServer.kill();

  console.log(`Exiting with status code ${exitCode}`);
  process.exit(exitCode);
}

function interruptionHandler() {
  console.log('\n');
  exitCode = 1;
  shutdown();
}

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
const serverScriptPath = join(__dirname, '..', '..', '..', 'scripts', 'hosted_mode', 'server.js');
const cwd = join(__dirname, '..', '..');
const {execPath} = process;
const hostedModeServer = spawn(execPath, [serverScriptPath], {cwd});
hostedModeServer.on('error', handleHostedModeError);
hostedModeServer.stderr.on('data', handleHostedModeError);

// Given('that the browser is set up', async () => {
(async function() {
  const opts: puppeteer.LaunchOptions = {
    headless: false,
    executablePath: '/home/almuthanna/fetched/devtools/devtools-frontend/third_party/chrome/chrome-linux/chrome',
    defaultViewport: null,
  };
  opts.defaultViewport = {width: 1280, height: 720};
  const launchArgs = [`--remote-debugging-port=${envPort}`];
  opts.args = launchArgs;
  const launchedBrowser = puppeteer.launch(opts);
  const pages: puppeteer.Page[] = [];
  const browser = await launchedBrowser;
  const srcPage = await browser.newPage();
  await srcPage.goto(blankPage);
  pages.push(srcPage);
  const devtools = await browser.newPage();
  await devtools.goto(`http://localhost:${envPort}/json`);
  const listing = await devtools.$('pre');
  const json = await devtools.evaluate(listing => listing.textContent, listing);
  const targets: DevToolsTarget[] = JSON.parse(json);
  const target = targets.find(target => target.url === blankPage);
  if (!target) {
    throw new Error(`Unable to find target page: ${blankPage}`);
  }

  const {id} = target;
  await devtools.close();

  const frontend = await browser.newPage();
  const frontendUrl = `http://localhost:8090/front_end/devtools_app.html?ws=localhost:${envPort}/devtools/page/${id}`;
  frontend.goto(frontendUrl, {waitUntil: ['networkidle2', 'domcontentloaded']});

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

  const screenshotPage = undefined;
  store(browser, srcPage, frontend, screenshotPage, resetPages);
})();
// });

Given('navigate to session-storage resource and open Application tab', async () => {
  const {target} = getBrowserAndPages();
  await navigateToApplicationTab(target, 'session-storage');
});

Given('open the domain storage', async () => {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

Given('check that storage data values are correct', async () => {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});
