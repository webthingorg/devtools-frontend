import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

import {getBrowserAndPages, setBrowserAndPages} from './puppeteerState.js';

const HOSTED_MODE_SERVER_PATH = path.join(__dirname, '..', '..', 'scripts', 'hosted_mode', 'server.js');
const EMPTY_PAGE = 'data:text/html,';

const cwd = path.join(__dirname, '..', '..');
const {execPath} = process;
const width = 1280;
const height = 720;

let hostedModeServer: ChildProcessWithoutNullStreams;
let browser: puppeteer.Browser;
let envPort = 9222;
let headless = false;
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
  const launchArgs = [`--remote-debugging-port=${envPort}`];
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
  frontendUrl = `http://localhost:8090/front_end/devtools_app.html?ws=localhost:${envPort}/devtools/page/${id}`;
  await frontend.goto(frontendUrl, {waitUntil: ['networkidle2', 'domcontentloaded']});

  frontend.on('error', (error) => {
    throw new Error(`Error in Frontend: ${error}`);
  });

  frontend.on('pageerror', (error) => {
    throw new Error(`Page error in Frontend: ${error}`);
  });

  setBrowserAndPages({target: srcPage, frontend, browser});
}

export async function resetPages() {
  const {target, frontend} = getBrowserAndPages();
  // Reload the target page.
  await target.goto(EMPTY_PAGE, {waitUntil: ['domcontentloaded']});

  // Clear any local storage settings.
  await frontend.evaluate(() => localStorage.clear());

  // Reload the DevTools frontend and await the elements panel.
  await frontend.goto(EMPTY_PAGE, {waitUntil: ['domcontentloaded']});
  await frontend.goto(frontendUrl, {waitUntil: ['domcontentloaded']});

  // For the unspecified case wait for loading, then wait for the elements panel.
  await frontend.waitForSelector('.elements');
}

export async function globalSetup() {
  console.log('Spawning hosted mode server');

  hostedModeServer = spawn(execPath, [HOSTED_MODE_SERVER_PATH], {cwd});
  hostedModeServer.on('error', handleHostedModeError);
  hostedModeServer.stderr.on('data', handleHostedModeError);

  await loadTargetPageAndDevToolsFrontend();
}

export async function globalTeardown() {
  console.log('Stopping hosted mode server');
  hostedModeServer.kill();

  await browser.close();
}