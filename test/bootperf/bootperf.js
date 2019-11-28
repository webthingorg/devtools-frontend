// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const utils = require('./bootperf-utils');
const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
const { runs, targetUrl, port, browserWSEndpoint, waitFor } = require('yargs')
    .option('runs', {
      alias: 'r',
      describe: 'The number of times to run',
      default: 3,
      type: 'number'
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
    .option('waitFor', {
      alias: 'w',
      describe: 'The selector to wait for',
      default: '.elements'
    })
    .version('1.0.0')
    .help()
    .argv;

const times = [];
const pages = [];
let exitCode = 0;
async function runBootPerf () {
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

    for (let i = 0; i < runs; i++) {
        const start = performance.now();

        // Connect to the DevTools frontend.
        const frontEnd = await browser.newPage();
        await frontEnd.goto(`http://localhost:8090/front_end/inspector.html?ws=localhost:${port}/devtools/page/${id}`);
        await frontEnd.waitForSelector(waitFor);

        const duration = performance.now() - start;
        times.push(duration);

        // Close the page.
        frontEnd.close();
    }
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

    console.log(`Mean ${utils.mean(times).toFixed(2)}ms`);
    console.log(`Median ${utils.median(times).toFixed(2)}ms`);
    process.exit(exitCode);
  }
}

runBootPerf()
