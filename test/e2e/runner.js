// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

const { test, targetUrl, port, browserWSEndpoint } = require('yargs')
    .option('test', {
      alias: 't',
      describe: 'The test to run'
    })
    .option('targetUrl', {
      alias: 'u',
      describe: 'The target url to test against',
      default: 'https://www.google.com/'
    })
    .option('port', {
      alias: 'p',
      describe: 'The remote debugging port',
      default: 9222,
      type: 'number'
    })
    .option('browserWSEndpoint', {
      alias: 'e',
      describe: 'The endpoint to connect to'
    })
    .version('1.0.0')
    .demandOption(['test', 'browserWSEndpoint'])
    .help()
    .argv;

const testScriptPath = path.resolve(process.cwd(), test)
const pages = [];

if (!fs.existsSync(testScriptPath)) {
  console.error(`Unable to locate test script at ${testScriptPath}`);
  process.exit(1);
}

// Import the script for testing.
const testScript = require(testScriptPath);

let exitCode = 0;
async function runTest () {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: {
        width: 1280,
        height: 720
      }
    });

    // Load the target page.
    const srcPage = await browser.newPage();
    await srcPage.goto(targetUrl);
    pages.push(srcPage);

    // Now get the DevTools listings.
    const devtools = await browser.newPage();
    await devtools.goto(`http://localhost:${port}/json`);
    pages.push(devtools);

    // Find the appropriate item to inspect the target page.
    const listing = await devtools.$('pre');
    const json = await devtools.evaluate(listing => listing.textContent, listing);
    const targets = JSON.parse(json);
    const { id } = targets.find((target) => target.url === targetUrl);

    // Connect to the DevTools frontend.
    const frontEnd = await browser.newPage();
    pages.push(frontEnd);

    await frontEnd.goto(`http://localhost:8090/front_end/inspector.html?ws=localhost:${port}/devtools/page/${id}`);
    await frontEnd.waitForSelector('.root-view');

    // Now run the actual script.
    await testScript({ frontEnd, browser });
  } catch (e) {
    console.warn(e);
    console.log(json);
    exitCode = 1;
  } finally {
    // Shut down.
    for (const page of pages) {
      try {
        await page.close();
      } catch (e) {
        console.warn('Catastrophic failure: unable to close pages');
        exitCode = 1;
      }
    }
    process.exit(exitCode);
  }
}

runTest();
