"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("cucumber");
const puppeteer = require("puppeteer");
const helper_js_1 = require("../../shared/helper.js");
const path_1 = require("path");
const child_process_1 = require("child_process");
const envPort = process.env['PORT'] || 9222;
const blankPage = 'data:text/html,';
let exitCode = 0;
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
function handleHostedModeError(data) {
    console.log(`Hosted mode server: ${data}`);
    interruptionHandler();
}
async function navigateToApplicationTab(target, testName) {
    await target.goto(`${helper_js_1.resourcesPath}/application/${testName}.html`);
    await helper_js_1.click('#tab-resources');
    // Make sure the application navigation list is shown
    await helper_js_1.waitFor('.storage-group-list-item');
}
console.log('Spawning hosted mode server');
const serverScriptPath = path_1.join(__dirname, '..', '..', '..', 'scripts', 'hosted_mode', 'server.js');
const cwd = path_1.join(__dirname, '..', '..');
const { execPath } = process;
const hostedModeServer = child_process_1.spawn(execPath, [serverScriptPath], { cwd });
hostedModeServer.on('error', handleHostedModeError);
hostedModeServer.stderr.on('data', handleHostedModeError);
// Given('that the browser is set up', async () => {
(async function () {
    const opts = {
        headless: false,
        executablePath: '/home/almuthanna/fetched/devtools/devtools-frontend/third_party/chrome/chrome-linux/chrome',
        defaultViewport: null,
    };
    opts.defaultViewport = { width: 1280, height: 720 };
    const launchArgs = [`--remote-debugging-port=${envPort}`];
    opts.args = launchArgs;
    const launchedBrowser = puppeteer.launch(opts);
    const pages = [];
    const browser = await launchedBrowser;
    const srcPage = await browser.newPage();
    await srcPage.goto(blankPage);
    pages.push(srcPage);
    const devtools = await browser.newPage();
    await devtools.goto(`http://localhost:${envPort}/json`);
    const listing = await devtools.$('pre');
    const json = await devtools.evaluate(listing => listing.textContent, listing);
    const targets = JSON.parse(json);
    const target = targets.find(target => target.url === blankPage);
    if (!target) {
        throw new Error(`Unable to find target page: ${blankPage}`);
    }
    const { id } = target;
    await devtools.close();
    const frontend = await browser.newPage();
    const frontendUrl = `http://localhost:8090/front_end/devtools_app.html?ws=localhost:${envPort}/devtools/page/${id}`;
    frontend.goto(frontendUrl, { waitUntil: ['networkidle2', 'domcontentloaded'] });
    frontend.on('error', err => {
        console.log('Error in Frontend');
        console.log(err);
    });
    frontend.on('pageerror', err => {
        console.log('Page Error in Frontend');
        console.log(err);
    });
    const resetPages = async (opts = {}) => {
        // Reload the target page.
        await srcPage.goto(blankPage, { waitUntil: ['domcontentloaded'] });
        // Clear any local storage settings.
        await frontend.evaluate(() => localStorage.clear());
        const { enabledExperiments } = opts;
        let { selectedPanel } = opts;
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
        await frontend.goto(blankPage, { waitUntil: ['domcontentloaded'] });
        await frontend.goto(frontendUrl, { waitUntil: ['domcontentloaded'] });
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
    let screenshotPage = undefined;
    helper_js_1.store(browser, srcPage, frontend, screenshotPage, resetPages);
})();
// });
cucumber_1.Given('navigate to session-storage resource and open Application tab', async () => {
    const { target } = helper_js_1.getBrowserAndPages();
    await navigateToApplicationTab(target, 'session-storage');
});
cucumber_1.Given('open the domain storage', async () => {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});
cucumber_1.Given('check that storage data values are correct', async () => {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});
