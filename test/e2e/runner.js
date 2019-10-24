// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const puppeteer = require('puppeteer');
const path = require('path');

const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const fs = require('fs');


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

const screenshotPath = path.resolve(process.cwd(), './test/e2e/screenshots/');
const testScriptPath = path.resolve(process.cwd(), './test/e2e/elements/', test) + '.js';
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

    await frontEnd.evaluate(async (test) => {
      const root = document.querySelector('.root-view');
      // Remove all ui from devtools but keep stylesheets
      // and global state in place.
      root.innerHTML = '';

      // Set .root-view to display: inline to reduce the amount of whitespace
      // in the screenshots
      root.style.display = 'inline';


      const element = await eval(`(${test})()`);
      root.appendChild(element);
    }, testScript.toString());

    const element = await frontEnd.$('.root-view > *:first-child');
    const data = await element.screenshot();

    const filename = screenshotPath + '/' + test + '.png';

    const img1 = PNG.sync.read(fs.readFileSync(filename));
    const img2 = PNG.sync.read(data);

    if(img1.width !== img2.width || img1.height !== img2.height) {
      fs.writeFileSync(screenshotPath + '/' + test + '_new.png', PNG.sync.write(img2));
      console.error('Image sizes dont match');
      exitCode = 1;
    }

    const diff = new PNG({width: img1.width, height: img1.height});
    const result = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});

    if(result) {
      fs.writeFileSync(screenshotPath + '/' + test + '_new.png', PNG.sync.write(img2));
      fs.writeFileSync(screenshotPath + '/' + test + '_diff.png', PNG.sync.write(diff));
      console.error('Images do not match');
      exitCode = 1;
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

    process.exit(exitCode);
  }
}

runTest();
