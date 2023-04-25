#!/usr/bin/env node

// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const path = require('path');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const {
  nodePath,
  mochaExecutablePath,
  downloadedChromeBinaryPath,
  devtoolsRootPath,
} = require('../devtools_paths.js');

function log(...msg) {
  console.log('[run_test_suite.js]', ...msg);
}
function err(...msg) {
  console.error('[run_test_suite.js]', ...msg);
}

const yargsObject =
    require('yargs')
        .option(
            'test-suite-path',
            {type: 'string', desc: 'Path to the test suite, starting from out/Target directory.', demandOption: true})
        .option('test-suite-source-dir', {
          type: 'string',
          desc: 'Path to the source folder containing the tests, relative to the current working directory.',
          demandOption: true
        })
        .option('target', {type: 'string', default: 'Default', desc: 'Name of the Ninja output directory.'})
        .option('node-modules-path', {
          type: 'string',
          desc:
              'Path to the node_modules directory for Node to use, relative to the current working directory. Defaults to local node_modules folder.'
        })
        .option('test-server-type', {
          'choices': ['hosted-mode', 'component-docs', 'none'],
          'describe':
              'The type of test-server to run for the tests. Will be set automatically if your test-suite-path ends with e2e or interactions, but you need to set it otherwise. If you do not need a test-server, you must explicitly pass the "none" option.',
        })
        .option('test-file-pattern', {
          type: 'string',
          desc: 'A comma separated glob (or just a file path) to select specific test files to execute.'
        })
        .option('mocha-fgrep', {
          type: 'string',
          desc:
              'Mocha\'s fgrep option [https://mochajs.org/#-fgrep-string-f-string] which only runs tests whose titles contain the provided string',
        })
        .option('invert', {
          type: 'boolean',
          desc:
              'Mocha\'s invert option [https://mochajs.org/#-invert] which inverts the match specified by mocha-fgrep',
          default: false,
        })
        .option('mocha-reporter', {
          type: 'string',
          desc: 'Mocha\'s --reporter option',
        })
        .option('mocha-reporter-option', {
          type: 'string',
          desc: 'Mocha\'s --reporter-option flag to pass options through to the Mocha reporter',
        })
        // test-file-pattern can be provided as a flag or as a positional
        // argument. $0 here is Yarg's syntax for the default command:
        // https://github.com/yargs/yargs/blob/master/docs/advanced.md#default-commands
        .command('$0 [test-file-pattern]')
        .option('component-server-base-path', {
          type: 'string',
          desc:
              'The component serve assumes examples live in out/TARGET/gen/front_end/ui/components/docs, but you can set this option to add a prefix. Passing `foo` will redirect the server to look in out/TARGET/gen/foo/front_end/ui/components/docs.',
          default: '',
        })
        .option('component-server-shared-resources-path', {
          type: 'string',
          desc:
              'Configures the base of the URLs that are injected into each component example. By default it is "/", so we load from "/front_end", but you can provide a different prefix if the shared resources are based elsewhere in the directory structure.',
          default: '/',
        })
        .option('hosted-server-devtools-url', {
          type: 'string',
          desc: 'Configures the page that will be loaded by conductor when using the hosted-server for tests.',
          default: 'front_end/devtools_app.html'
        })
        .option('hosted-server-e2e-resources-path', {
          type: 'string',
          desc: 'The base URL that will be used when loading e2e test resources',
          default: '/test/e2e/resources'
        })
        .option(
            'chrome-binary-path',
            {type: 'string', desc: 'Path to the Chromium binary.', default: downloadedChromeBinaryPath()})
        .option('chrome-features', {
          type: 'string',
          desc: 'Comma separated list of strings passed to --enable-features on the Chromium command line.'
        })
        .option('jobs', {
          type: 'number',
          desc: 'Number of parallel runners to use (if supported). Defaults to 1.',
          default: 1,
        })
        .option('cwd', {
          type: 'string',
          desc: 'Path to the directory containing the out/TARGET folder.',
          default: devtoolsRootPath()
        })
        .option('coverage', {
          type: 'boolean',
          desc: 'Whether to collect code coverage for this test suite',
          default: false,
        })
        .parserConfiguration({
          // So that if we pass --foo-bar, Yargs only populates
          // argv with '--foo-bar', not '--foo-bar' and 'fooBar'.
          'camel-case-expansion': false
        })
        // Take options via --config config.json
        .config()
        // Fail on any unknown arguments
        .strict()
        .argv;

function validatePathExistsOrError(nameOfPath, filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (_error) {
    err(`Failed: ${nameOfPath} [${filePath}] does not exist.`);
    process.exit(1);
  }
}

function getAbsoluteTestSuitePath(target) {
  const pathInput = yargsObject['test-suite-path'];
  // We take the input with Linux path separators, but need to split and join to make sure this works on Windows.
  const testSuitePathParts = pathInput.split('/');
  log(`Using test suite ${path.join(pathInput, path.sep)}`);

  const fullPath = path.join(yargsObject['cwd'], 'out', target, ...testSuitePathParts);
  return fullPath;
}

function setEnvValueIfValuePresent(name, value) {
  if (value) {
    process.env[name] = value;
  }
}

function setNodeModulesPath(nodeModulesPathsInput) {
  if (nodeModulesPathsInput) {
    /** You can provide multiple paths split by either ; (windows) or : (everywhere else)
     * So we need to split our input, ensure each part is absolute, check it
     * exists, and then set NODE_PATH again.
     */
    const delimiter = os.platform() === 'win32' ? ';' : ':';
    const inputPaths = nodeModulesPathsInput.split(delimiter);
    const outputPaths = [];
    inputPaths.forEach(nodePath => {
      if (path.isAbsolute(nodePath)) {
        validatePathExistsOrError('node-modules-path', nodePath);
        outputPaths.push(nodePath);
        return;
      }

      // Node requires the path to be absolute
      const absolutePath = path.resolve(path.join(yargsObject['cwd'], nodePath));
      validatePathExistsOrError('node-modules-path', nodePath);
      outputPaths.push(absolutePath);
    });
    setEnvValueIfValuePresent('NODE_PATH', outputPaths.join(delimiter));
  }
}

async function executeTestSuite({
  absoluteTestSuitePath,
  jobs,
  target,
  nodeModulesPath,
  chromeBinaryPath,
  chromeFeatures,
  testFilePattern,
  coverage,
  cwd,
  mochaOptions = {},
}) {
  /**
   * Internally within various scripts (Mocha configs, Conductor, etc), we rely on
   * process.env.FOO. We are moving to exposing the entire configuration to
   * process.env.TEST_CONFIG_JSON but for now we need to still expose the values
   * directly on the environment whilst we roll out this script and make all the
   * required changes.
   */
  setEnvValueIfValuePresent('CHROME_BIN', chromeBinaryPath);
  setEnvValueIfValuePresent('CHROME_FEATURES', chromeFeatures);
  setEnvValueIfValuePresent('JOBS', jobs);
  setEnvValueIfValuePresent('TARGET', target);
  setEnvValueIfValuePresent('TEST_PATTERNS', testFilePattern);
  setEnvValueIfValuePresent('COVERAGE', coverage);

  /**
   * This one has to be set as an ENV variable as Node looks for the NODE_PATH environment variable.
   */
  setNodeModulesPath(nodeModulesPath);

  const argumentsForNode = [
    mochaExecutablePath(),
  ];
  if (process.env.DEBUG_TEST) {
    argumentsForNode.unshift('--inspect');
  }

  const testSuiteConfig = path.join(absoluteTestSuitePath, '.mocharc.js');
  validatePathExistsOrError('.mocharc.js location', testSuiteConfig);
  argumentsForNode.push('--config', testSuiteConfig);

  for (const [mochaKey, mochaValue] of Object.entries(mochaOptions)) {
    if (mochaValue !== undefined) {
      argumentsForNode.push(`--${mochaKey}`, mochaValue);
      log(`extra mocha flag: --${mochaKey}=${mochaValue}`);
    }
  }
  if (jobs > 1) {
    argumentsForNode.push(`--jobs=${jobs}`);
  }
  // argumentsForNode.push(`--dry-run`);
  argumentsForNode.push('--reporter=json');
  const tests_list =
      [
        'application/cookies_test.ts: The Application Tab shows cookies even when navigating to an unreachable page (crbug.com/1047348)',
        'application/cookies_test.ts: The Application Tab shows a preview of the cookie value (crbug.com/462370)',
        'application/cookies_test.ts: The Application Tab shows cookie partition key',
        'application/cookies_test.ts: The Application Tab can also show the urldecoded value',
        'application/cookies_test.ts: The Application Tab clears the preview value when clearing cookies',
        'application/cookies_test.ts: The Application Tab only clear currently visible cookies',
        'application/frame-tree_test.ts: The Application Tab shows details for a frame when clicked on in the frame tree',
        'application/frame-tree_test.ts: The Application Tab shows stack traces for OOPIF',
        'application/frame-tree_test.ts: The Application Tab shows details for opened windows in the frame tree',
        'application/frame-tree_test.ts: The Application Tab shows dedicated workers in the frame tree',
        'application/frame-tree_test.ts: The Application Tab shows service workers in the frame tree',
        'application/frame-tree_test.ts: The Application Tab can handle when JS writes to frame',
        'application/reporting-api_test.ts: The Reporting API Page shows reports',
        'application/reporting-api_test.ts: The Reporting API Page shows endpoints',
        'application/service-worker-network_test.ts: The Application Tab Clicking on Network requests for service worker should open Network panel in drawer and closing should move it back',
        'application/service-worker-update_test.ts: The Application Tab Navigate to a page with service worker we should find service worker update timeline info',
        'application/session-storage_test.ts: The Application Tab shows Session Storage keys and values',
        'application/session-storage_test.ts: The Application Tab can delete selected items',
        'application/shared-storage_test.ts: The Application Tab shows Shared Storage events',
        'application/shared-storage_test.ts: The Application Tab shows Shared Storage metadata',
        'application/shared-storage_test.ts: The Application Tab shows Shared Storage keys and values',
        'application/storage_test.ts: The Application Tab deletes only first party cookies when clearing site data',
        'application/storage_test.ts: The Application Tab deletes first and third party cookies when clearing site data with the flag enabled',
        'application/storage_test.ts: The Application Tab application/storage_test.ts: the Storage pane clear button clears storage correctly',
        'application/storage_test.ts: The Application Tab application/storage_test.ts: the Storage pane reports storage correctly, including the pie chart legend',
        'application/websql-database_test.ts: The Application Tab shows WebSQL database',
        'assertion/assertion_test.ts: Assertions console.assert',
        'assertion/assertion_test.ts: Assertions console.error',
        'changes/changes_test.ts: The Changes Panel Shows changes made in the Styles pane',
        'console/alert-toString-exception_test.ts: The Console Tab Does not crash if it fails to convert alert() argument to string',
        'console/command-line-api-getEventListeners_test.ts: The Console Tab returns the correct values when using the getEventListeners method',
        'console/console-accessors_test.ts: The Console Tab correctly expands getters on string properties',
        'console/console-accessors_test.ts: The Console Tab correctly expands getters on symbol properties',
        'console/console-accessors_test.ts: The Console Tab correctly expands private getters',
        'console/console-autocomplete_test.ts: The Console Tab triggers autocompletion for `object.`',
        'console/console-autocomplete_test.ts: The Console Tab triggers autocompletion for `object?.`',
        'console/console-autocomplete_test.ts: The Console Tab triggers autocompletion for `object[`',
        'console/console-autocomplete_test.ts: The Console Tab triggers autocompletion for `map.get(`',
        'console/console-clear_test.ts: The Console Tab is cleared via the console.clear() method',
        'console/console-context-menu_test.ts: The Console Tab can copy contents for strings',
        'console/console-context-menu_test.ts: The Console Tab can copy strings as JS literals',
        'console/console-context-menu_test.ts: The Console Tab can copy strings as JSON literals',
        'console/console-context-menu_test.ts: The Console Tab can copy numbers',
        'console/console-context-menu_test.ts: The Console Tab can copy bigints',
        'console/console-context-menu_test.ts: The Console Tab can copy booleans',
        'console/console-context-menu_test.ts: The Console Tab can copy undefined',
        'console/console-context-selector_test.ts: The Console Tab context selector',
        'console/console-errors_test.ts: The Console\'s errors picks up custom exception names ending with \'Error\' and symbolizes stack traces according to source maps',
        'console/console-errors_test.ts: The Console\'s errors correctly symbolizes stack traces with async frames for anonymous functions',
        'console/console-errors_test.ts: The Console\'s errors shows errors to load a resource',
        'console/console-eval-blocked-by-CSP_test.ts: The Console Tab eval in console succeeds for pages with no CSP',
        'console/console-eval-blocked-by-CSP_test.ts: The Console Tab eval in console fails for pages with CSP that blocks eval',
        'console/console-eval-fake_test.ts: The Console Tab doesn\'t break when global `eval` is overwritten',
        'console/console-eval-global_test.ts: The Console Tab interacts with the global scope correctly',
        'console/console-expand-recursively_test.ts: The Console Tab recursively expands objects',
        'console/console-fetch-logging_test.ts: The Console Tab is able to log fetching when XMLHttpRequest Logging is enabled',
        'console/console-fetch-logging_test.ts: The Console Tab does not log fetching when XMLHttpRequest Logging is disabled',
        'console/console-filter_test.ts: The Console Tab shows logged messages',
        'console/console-filter_test.ts: The Console Tab shows messages from all levels',
        'console/console-filter_test.ts: The Console Tab can exclude messages from a source url',
        'console/console-filter_test.ts: The Console Tab can include messages from a given source url',
        'console/console-filter_test.ts: The Console Tab can apply empty filter',
        'console/console-filter_test.ts: The Console Tab can apply text filter matching outer group title',
        'console/console-filter_test.ts: The Console Tab can apply text filter matching inner group title',
        'console/console-filter_test.ts: The Console Tab can apply text filter matching outer group content',
        'console/console-filter_test.ts: The Console Tab can apply text filter matching inner group content',
        'console/console-filter_test.ts: The Console Tab can apply text filter matching non-grouped content',
        'console/console-filter_test.ts: The Console Tab can apply start/end line regex filter',
        'console/console-filter_test.ts: The Console Tab can apply context filter',
        'console/console-filter_test.ts: The Console Tab can apply multi text filter',
        'console/console-filter_test.ts: The Console Tab can reset filter',
        'console/console-filter_test.ts: The Console Tab can exclude CORS error messages',
        'console/console-last-result_test.ts: The Console Tab exposes the last evaluation using "$_"',
        'console/console-live-expressions_test.ts: The Console Tab commits live expression with Enter',
        'console/console-log_test.ts: The Console Tab produces console messages when a page logs using console.log',
        'console/console-log_test.ts: The Console Tab produces console messages when a page logs using console.debug',
        'console/console-log_test.ts: The Console Tab produces console messages when a page logs using console.warn',
        'console/console-log_test.ts: The Console Tab produces console messages when a page logs using console.error',
        'console/console-log_test.ts: The Console Tab produces a single console message when messages are repeated',
        'console/console-log_test.ts: The Console Tab counts how many time console.count has been called with the same message',
        'console/console-log_test.ts: The Console Tab creates an empty group message using console.group/console.groupEnd',
        'console/console-log_test.ts: The Console Tab logs multiple arguments using console.log',
        'console/console-log_test.ts: The Console Tab creates a collapsed group using console.groupCollapsed with all messages in between hidden',
        'console/console-log_test.ts: The Console Tab logs console.count messages with and without arguments',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: keyboard navigation can navigate between individual messages',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: keyboard navigation should not lose focus on prompt when logging and scrolling',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: Console log message formatters expand primitive formatters',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: Console log message formatters expand %c formatter with color style',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: Console log message formatters expand %c formatter with background image in data URL',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: Console log message formatters filter out %c formatter if background image is remote URL',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: message anchor opens the breakpoint edit dialog for logpoint messages',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: for memory objects shows one memory icon to open memory inspector for ArrayBuffers (description)',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: for memory objects shows two memory icons to open memory inspector for a TypedArray (description, buffer)',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: for memory objects shows two memory icons to open memory inspector for a DataView (description, buffer)',
        'console/console-log_test.ts: The Console Tab console/console-log_test.ts: for memory objects shows two memory icons to open memory inspector for WebAssembly memory (description, buffer)',
        'console/console-message-format_test.ts: The Console Tab shows BigInts formatted',
        'console/console-message-format_test.ts: The Console Tab shows uncaught promises',
        'console/console-message-format_test.ts: The Console Tab shows structured objects',
        'console/console-message-format_test.ts: The Console Tab escapes and substitutes correctly',
        'console/console-message-format_test.ts: The Console Tab shows built-in objects',
        'console/console-message-format_test.ts: The Console Tab shows primitives',
        'console/console-message-format_test.ts: The Console Tab can handle prototype fields',
        'console/console-message-format_test.ts: The Console Tab can show DOM interactions',
        'console/console-message-format_test.ts: The Console Tab can handle sourceURLs in exceptions',
        'console/console-message-format_test.ts: The Console Tab can handle repeated messages from data URLs in exceptions',
        'console/console-message-format_test.ts: The Console Tab can show stackoverflow exceptions',
        'console/console-message-format_test.ts: The Console Tab can show document.write messages',
        'console/console-message-format_test.ts: The Console Tab can show verbose promise unhandledrejections',
        'console/console-message-format_test.ts: The Console Tab console/console-message-format_test.ts: shows messages from before iframe removal',
        'console/console-message-format_test.ts: The Console Tab console/console-message-format_test.ts: shows messages from before and after iframe navigation',
        'console/console-repl-mode_test.ts: The Console Tab allows re-declaration of let variables',
        'console/console-stack-trace_test.ts: The Console Tab shows messages with stack traces',
        'console/console-stack-trace_test.ts: The Console Tab shows messages with stack traces containing ignore-listed frames',
        'console/console-truncate-long-messages_test.ts: The Console Tab Truncates large messages',
        'console/console-trusted-types_test.ts: Logging and preview of Trusted Types objects in the Console Logging of Trusted Type HTML object',
        'console/console-trusted-types_test.ts: Logging and preview of Trusted Types objects in the Console Preview of Trusted Type HTML object',
        'console/console-uncaught-promise_test.ts: The Console Tab is able to log uncaught promise rejections into console',
        'console/issues-toolbar_test.ts: The Console Tab shows the toolbar button for no issue correctly',
        'console/issues-toolbar_test.ts: The Console Tab shows the toolbar button for one issue correctly',
        'console/issues-toolbar_test.ts: The Console Tab shows the toolbar button for three issues correctly',
        'console/issues-toolbar_test.ts: The Console Tab updates the toolbar button correctly',
        'coverage/coverage_test.ts: The Coverage Panel Loads correctly',
        'coverage/coverage_test.ts: The Coverage Panel Can start and stop instrumenting coverage',
        'cross_tool_integration/browser_test.ts: Browser can reload a website after all closeable tools are closed',
        'cross_tool_integration/browser_test.ts: Browser can navigate to a new website after all closeable tools are closed',
        'cross_tool_integration/workflow_test.ts: A user can navigate across Console -> Sources',
        'cross_tool_integration/workflow_test.ts: A user can navigate across Elements -> Sources',
        'cross_tool_integration/workflow_test.ts: A user can move tabs Move Memory to drawer',
        'cross_tool_integration/workflow_test.ts: A user can move tabs Move Animations to main panel',
        'cross_tool_integration/workflow_test.ts: A user can open panels via the "panel" query param Layers is shown',
        'css_overview/css_overview_test.ts: CSS Overview experiment can display low contrast issues',
        'css_overview/css_overview_test.ts: CSS Overview experiment can navigate sidebar panel through keyboard',
        'elements/accessibility-pane_test.ts: Accessibility Pane in the Elements Tab displays the partial accessibility tree',
        'elements/accessibility-pane_test.ts: Accessibility Pane in the Elements Tab shows computed name from contents for title element',
        'elements/accessibility-pane_test.ts: Accessibility Pane in the Elements Tab shows name from label for span element',
        'elements/accessibility-tree_test.ts: Accessibility Tree in the Elements Tab displays the fuller accessibility tree',
        'elements/accessibility-tree_test.ts: Accessibility Tree in the Elements Tab allows navigating iframes',
        'elements/accessibility-tree_test.ts: Accessibility Tree in the Elements Tab listens for text changes to DOM and redraws the tree',
        'elements/accessibility-tree_test.ts: Accessibility Tree in the Elements Tab listens for changes to properties and redraws tree',
        'elements/accessibility-tree_test.ts: Accessibility Tree in the Elements Tab listen for removed nodes and redraw tree',
        'elements/adornment_test.ts: Adornment in the Elements Tab displays grid and flex adorners',
        'elements/adornment_test.ts: Adornment in the Elements Tab displays scroll-snap adorners',
        'elements/adornment_test.ts: Adornment in the Elements Tab displays container query adorners',
        'elements/adornment_test.ts: Adornment in the Elements Tab can toggle adorners',
        'elements/adornment_test.ts: Adornment in the Elements Tab does not display adorners on shadow roots when their parents are grid or flex containers',
        'elements/adornment_test.ts: Adornment in the Elements Tab updates when display properties change',
        'elements/classes-pane_test.ts: The Classes pane can add a class to the element',
        'elements/classes-pane_test.ts: The Classes pane can add multiple classes at once',
        'elements/classes-pane_test.ts: The Classes pane can toggle classes',
        'elements/classes-pane_test.ts: The Classes pane removes the previewed classes on ESC',
        'elements/color-picker_test.ts: ColorPicker scrolls to the bottom when previewing palettes',
        'elements/computed-pane-properties_test.ts: The Computed pane can display the CSS properties of the selected element',
        'elements/computed-pane-properties_test.ts: The Computed pane can display inherited CSS properties of the selected element',
        'elements/computed-pane-properties_test.ts: The Computed pane remembers which properties that are expanded when re-rendering',
        'elements/css-hints_test.ts: CSS hints in the Styles panel can detect inactive CSS',
        'elements/css-hints_test.ts: CSS hints in the Styles panel does not show authoring hint when property value is invalid',
        'elements/css-hints_test.ts: CSS hints in the Styles panel updates the hint if the styles are edited',
        'elements/element-breadcrumbs_test.ts: Element breadcrumbs lists all the elements in the tree',
        'elements/element-breadcrumbs_test.ts: Element breadcrumbs correctly highlights the active node',
        'elements/flexbox-editor_test.ts: Flexbox Editor can be opened and flexbox styles can be edited',
        'elements/flexbox-editor_test.ts: Flexbox Editor can be opened for flexbox styles with !important',
        'elements/grid-editor_test.ts: Grid Editor can be opened and grid styles can be edited',
        'elements/layout-pane_test.ts: Layout Pane in the Elements Tab displays Layout pane',
        'elements/layout-pane_test.ts: Layout Pane in the Elements Tab Lists grids in UA shadow DOM only when needed',
        'elements/oopif-elements_test.ts: The Elements tab shows OOPIF frame error inline',
        'elements/reveal-correct-node_test.ts: The Issues tab should reveal an element in the Elements panel when the node icon is clicked',
        'elements/reveal-correct-node_test.ts: The Elements panel has a context menu link from an iframe to the corresponding frame details view',
        'elements/reveal-correct-node_test.ts: The Elements panel has link from a slot to assigned elements',
        'elements/reveal-correct-node_test.ts: The Elements panel has link from a slot element to a slot',
        'elements/search-elements_test.ts: The Elements tab search is performed as the user types when the "searchAsYouType" setting is enabled',
        'elements/search-elements_test.ts: The Elements tab elements/search-elements_test.ts: when searchAsYouType setting is disabled search is only performed when Enter is pressed',
        'elements/search-elements_test.ts: The Elements tab elements/search-elements_test.ts: when searchAsYouType setting is disabled search should jump to next match when Enter is pressed when the input is not changed',
        'elements/search-elements_test.ts: The Elements tab elements/search-elements_test.ts: when searchAsYouType setting is disabled search should be performed with the new query when the input is changed and Enter is pressed',
        'elements/selection-after-delete_test.ts: The Elements tab can delete elements in the tree',
        'elements/shadow-dom-modify-chardata_test.ts: The Elements tab is able to update shadow dom tree structure upon typing',
        'elements/shadowroot-styles_test.ts: The Elements Tab can show styles in shadow roots',
        'elements/sidebar-event-listeners_test.ts: Event listeners in the elements sidebar lists the active event listeners on the page',
        'elements/sidebar-event-listeners_test.ts: Event listeners in the elements sidebar shows the event listener properties when expanding it',
        'elements/sidebar-event-listeners_test.ts: Event listeners in the elements sidebar shows custom event listeners and their properties correctly',
        'elements/sidebar-event-listeners-remove_test.ts: Removing event listeners in the elements sidebar shows "Remove" by each node for a given event',
        'elements/style-pane-properties_test.ts: The Styles pane can display the CSS properties of the selected element',
        'elements/style-pane-properties_test.ts: The Styles pane can jump to a CSS variable definition',
        'elements/style-pane-properties_test.ts: The Styles pane can jump to an unexpanded CSS variable definition',
        'elements/style-pane-properties_test.ts: The Styles pane displays the correct value when editing CSS var() functions',
        'elements/style-pane-properties_test.ts: The Styles pane generates links inside var() functions for defined properties',
        'elements/style-pane-properties_test.ts: The Styles pane renders computed CSS variables in @keyframes rules',
        'elements/style-pane-properties_test.ts: The Styles pane can remove a CSS property when its name or value is deleted',
        'elements/style-pane-properties_test.ts: The Styles pane can display the source names for stylesheets',
        'elements/style-pane-properties_test.ts: The Styles pane can edit multiple constructed stylesheets',
        'elements/style-pane-properties_test.ts: The Styles pane can display and edit container queries',
        'elements/style-pane-properties_test.ts: The Styles pane can display container link',
        'elements/style-pane-properties_test.ts: The Styles pane can display @supports at-rules',
        'elements/style-pane-properties_test.ts: The Styles pane can display @layer separators',
        'elements/style-pane-properties_test.ts: The Styles pane can click @layer separators to open layer tree',
        'elements/style-pane-properties_test.ts: The Styles pane can display inherited CSS highlight pseudo styles',
        'elements/style-pane-properties_test.ts: The Styles pane can show styles properly (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane can show overridden shorthands as inactive (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane shows longhands overridden by shorthands with var() as inactive (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane shows longhands with parsed values under a shorthand',
        'elements/style-pane-properties_test.ts: The Styles pane shows overridden properties as inactive (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane shows non-standard mixed-cased properties correctly (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane shows styles from injected user stylesheets (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane can parse webkit css region styling (ported layout test)',
        'elements/style-pane-properties_test.ts: The Styles pane can display @scope at-rules',
        'elements/style-pane-properties_test.ts: The Styles pane elements/style-pane-properties_test.ts: Editing cancels editing if the page is reloaded',
        'elements/style-pane-properties_test.ts: The Styles pane elements/style-pane-properties_test.ts: Editing cancels editing on Esc',
        'elements/styles-disable-inherited_test.ts: The Elements tab does not break further style inspection if inherited style property was disabled',
        'elements/switch-panels-while-editing-as-html_test.ts: The Elements tab does not break when switching panels while editing as HTML',
        'emulation/custom-devices_test.ts: Custom devices can add and then edit a custom device with UA-CH emulation',
        'emulation/custom-devices_test.ts: Custom devices can add and properly display a device with a custom resolution',
        'emulation/dual-screen_test.ts: Dual screen mode User can toggle between single and dual screenmodes for a dual screen device',
        'emulation/dual-screen_test.ts: Dual screen mode User may not click toggle dual screen button for a non-dual screen device',
        'emulation/media-query-inspector_test.ts: Media query inspector lists all the media queries',
        'extensions/can-create-panels_test.ts: The Extension API can create panels with callbacks',
        'extensions/can-create-panels_test.ts: The Extension API rejects absolute resource URLs',
        'extensions/can-create-panels_test.ts: The Extension API handles absolute resource paths correctly',
        'extensions/can-create-panels_test.ts: The Extension API handles relative resource paths correctly',
        'extensions/can-open-resources-with-columns_test.ts: The Extension API can open wasm resources with offset',
        'extensions/can-open-resources-with-columns_test.ts: The Extension API can open page resources with column numbers',
        'extensions/can-search-in-extension-panel_test.ts: Extension panels can perform search actions',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins can show C filenames after loading the module',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins use correct code offsets to interpret raw locations',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins resolve locations for breakpoints correctly',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows top-level and nested variables',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows inline frames',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins falls back to wasm function names when inline info not present',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows a warning when no debug info is present',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows warnings when function info not present',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows variable values with JS formatters',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows variable values with the evaluate API',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows variable value in popover',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins shows sensible error messages.',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins can access wasm data directly',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins lets users manually attach debug info',
        'extensions/debugger-language-plugins_test.ts: The Debugger Language Plugins auto-steps over unmapped code correctly',
        'host/out-of-process_test.ts: The Host browser resolves .test domains to localhost and OOPIFs work as intended',
        'host/user-metrics_test.ts: User Metrics dispatches dock and undock events',
        'host/user-metrics_test.ts: User Metrics dispatches a metric event the console drawer',
        'host/user-metrics_test.ts: User Metrics dispatches events for views',
        'host/user-metrics_test.ts: User Metrics dispatches events for triple dot items',
        'host/user-metrics_test.ts: User Metrics dispatches events for opening issues drawer via hamburger menu',
        'host/user-metrics_test.ts: User Metrics dispatches event when opening issues drawer via command menu',
        'host/user-metrics_test.ts: User Metrics dispatches an event when F1 is used to open settings',
        'host/user-metrics_test.ts: User Metrics dispatches an event when Ctrl/Meta+F8 is used to deactivate breakpoints',
        'host/user-metrics_test.ts: User Metrics dispatches an event when the keybindSet setting is changed',
        'host/user-metrics_test.ts: User Metrics dispatches closed panel events for views',
        'host/user-metrics_test.ts: User Metrics dispatches an event when experiments are enabled and disabled',
        'host/user-metrics_test.ts: User Metrics tracks panel loading',
        'host/user-metrics_test.ts: User Metrics records the selected language',
        'host/user-metrics_test.ts: User Metrics records the sync setting',
        'host/user-metrics_test.ts: User Metrics for CSS Overview dispatch events when capture overview button hit',
        'host/user-metrics_test.ts: User Metrics for sidebar panes dispatches sidebar panes events for navigating Elements Panel sidebar panes',
        'host/user-metrics_test.ts: User Metrics for sidebar panes should not dispatch sidebar panes events for navigating to the same pane',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatches an event when a LowTextContrastIssue is created',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatches an event when a SharedArrayBufferIssue is created',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatch events when a link to an element is clicked',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatch events when a "Learn More" link is clicked',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatches events when Quirks Mode issues are created',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatches an event when a Client Hints are used with invalid origin for DelegateCH',
        'host/user-metrics_test.ts: User Metrics for Issue Panel dispatches an event when a Client Hints are modified by javascript for DelegateCH',
        'host/user-metrics_test.ts: User Metrics for CSS custom properties in the Styles pane dispatch events when capture overview button hit',
        'host/user-metrics_test.ts: User Metrics for CSS custom properties in the Styles pane dispatch events when a custom property value is edited',
        'host/user-metrics_test.ts: User Metrics for the Page Resource Loader dispatches an event when a source map is loaded',
        'inline_editor/color-swatch_test.ts: The color swatch is displayed for color properties in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is displayed for color properties in the Computed pane',
        'inline_editor/color-swatch_test.ts: The color swatch is not displayed for non-color properties in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is not displayed for non-color properties that have color-looking values in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is not displayed for color properties that have color-looking values in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is displayed for var() functions that compute to colors in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is not displayed for var() functions that have color-looking names but do not compute to colors in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is displayed for color-looking custom properties in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch supports shift-clicking for color properties in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch supports shift-clicking for color properties in the Computed pane',
        'inline_editor/color-swatch_test.ts: The color swatch supports shift-clicking for colors next to var() functions',
        'inline_editor/color-swatch_test.ts: The color swatch is updated when the color value is updated in the Styles pane',
        'inline_editor/color-swatch_test.ts: The color swatch is updated for a var() function when the customer property value changes in the Styles pane',
        'inline_editor/font-editor_test.ts: The font editor icon is displayed for sections containing font properties',
        'inline_editor/font-editor_test.ts: The font editor opens when button is clicked',
        'inline_editor/font-editor_test.ts: The font editor is properly applying font family changes to the style section',
        'inline_editor/font-editor_test.ts: The font editor is properly applying slider input changes to the style section',
        'inline_editor/font-editor_test.ts: The font editor is properly applying text input changes to the style section',
        'inline_editor/font-editor_test.ts: The font editor is properly applying selector key values to the style section',
        'inline_editor/font-editor_test.ts: The font editor is properly converting units and applying changes to the styles section',
        'inline_editor/font-editor_test.ts: The font editor computed font list is being generated correctly',
        'issues/client-hint-issues_test.ts: Client Hint issues test should display issue when Client Hints are used with invalid origin for DelegateCH',
        'issues/client-hint-issues_test.ts: Client Hint issues test should display issue when Client Hints are modified by javascript for DelegateCH',
        'issues/cookie-attribute-exceeds-max-size-issues_test.ts: Cookie attribute exceeds max size issues test should display issue when a cookie has an attribute that exceeds the max size',
        'issues/cookie-domain-attribute-non-ascii_test.ts: Cookie domain attribute should not contain non-ASCII characters issue should display an issue when a cookie has a domain attribute with non-ASCII characters',
        'issues/cors-issues_test.ts: CORS issues should display CORS violations with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display credentialed+wildcard CORS issues with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display invalid CORS preflight response codes with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display CORS ACAO mismatches with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display invalid CORS ACAC values with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display CORS requests using disallowed methods with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display CORS requests using disallowed headers with the correct affected resources',
        'issues/cors-issues_test.ts: CORS issues should display CORS requests redirecting to credentialed URLs',
        'issues/cors-issues_test.ts: CORS issues should display CORS issues that are disallowed by the mode',
        'issues/cors-issues_test.ts: CORS issues should display CORS issues that are unsupported by the scheme',
        'issues/cors-issues_test.ts: CORS issues should display CORS issues that are misconfiguring the redirect mode',
        'issues/cors-private-network-issues_test.ts: Cors Private Network issue should display correct information for insecure contexts',
        'issues/cors-private-network-issues_test.ts: Cors Private Network issue should display correct information for secure contexts',
        'issues/cors-private-network-issues_test.ts: Cors Private Network issue should display correct information for preflight request errors',
        'issues/cors-private-network-issues_test.ts: Cors Private Network issue should display correct information for failed preflight requests',
        'issues/csp-violations-tab_test.ts: CSP Violations Tab should display all csp violations',
        'issues/csp-violations-tab_test.ts: CSP Violations Tab should update violations when changing page',
        'issues/csp-violations-tab_test.ts: CSP Violations Tab should not display sink violations',
        'issues/csp-violations-tab_test.ts: CSP Violations Tab should not display matching violations',
        'issues/deprecation-issues_test.ts: Deprecation Issues evaluation works',
        'issues/expect-ct-issues_test.ts: Expect-CT Issue should display deprecation issue for Expect-CT header',
        'issues/generic-issues_test.ts: Cross-origin portal post message issue should display correct information',
        'issues/generic-issues_test.ts: Cross-origin portal post message issue should remove issue on update',
        'issues/group-by-categories_test.ts: The Issues tab categories checkbox should group issues by associated categories when checked',
        'issues/group-by-categories_test.ts: The Issues tab categories checkbox should use a flat list of issues when not checked',
        'issues/group-by-kind_test.ts: The Issues tab group by kind checkbox should group issues by associated kinds when checked',
        'issues/group-by-kind_test.ts: The Issues tab group by kind checkbox should display issues in the issueTree when not checked',
        'issues/heavy-ad-issues_test.ts: Heavy Ad issue should display correct information',
        'issues/hidden-issues-row_test.ts: Hide issues row should be visible after hiding an issue',
        'issues/hidden-issues-row_test.ts: Hide issues row should expand after clicking',
        'issues/hidden-issues-row_test.ts: Hide issues row should contain issue after clicking',
        'issues/hidden-issues-row_test.ts: Hide issues row should contain Unhide all issues button',
        'issues/hidden-issues-row_test.ts: Hide issues row should get hidden and unhide all issues upon clicking unhide all issues button',
        'issues/hide-issues-menu_test.ts: Hide issues menu should be appended to the issue header',
        'issues/hide-issues-menu_test.ts: Hide issues menu should become visible on hovering over the issue header',
        'issues/hide-issues-menu_test.ts: Hide issues menu should open a context menu upon clicking',
        'issues/hide-issues-menu_test.ts: Hide issues menu should hide issue upon clicking the context menu entry',
        'issues/hide-issues-menu_test.ts: Hide issues menu should unhide all issues upon clicking unhide all issues button',
        'issues/hide-issues-menu_test.ts: Hide issues menu should contain unhide issues like this entry while hovering over a hidden issue',
        'issues/hide-issues-menu_test.ts: Hide issues menu should unhide issue after clicking the unhide issues like this entry',
        'issues/hide-issues-menu_test.ts: After enabling grouping by IssueKind, Hide issues menu should be appended to the issue kinds group header',
        'issues/hide-issues-menu_test.ts: After enabling grouping by IssueKind, Hide issues menu should hide all available issues upon click menu entry',
        'issues/issue-links_test.ts: Issue links in the console tab should reveal the right issue',
        'issues/issue-view-caching_test.ts: IssueView cache should correctly update the issue',
        'issues/issue-view-reparent_test.ts: IssueView should be parented in issueTree when not groupedByCategory',
        'issues/issue-view-reparent_test.ts: IssueView should be parented in IssueCategoryView when groupedByCategory',
        'issues/issue-view-reparent_test.ts: IssueView should reparent correctly after parent change',
        'issues/low-text-contrast-issues_test.ts: Low contrast issues should report low contrast issues',
        'issues/navigator-user-agent-issues_test.ts: Navigator User Agent Issues should display correct information',
        'issues/privacy-sandbox-extensions-api_test.ts: Privacy Sandbox Extensions API should report privacy sandbox extensions api deprecation issues',
        'issues/quirks-mode-issues_test.ts: Quirks Mode issues should report Quirks Mode issues',
        'issues/quirks-mode-issues_test.ts: Quirks Mode issues should report Limited Quirks Mode issues',
        'issues/quirks-mode-issues_test.ts: Quirks Mode issues should report Quirks Mode issues in iframes',
        'issues/report-only_test.ts: The Issues tab report-only issues should report the violation as blocked',
      ];

  const start = Date.now();

  while (tests_list.length > 0) {
    const promiseList = [];
    const buffer = Math.min(8, tests_list.length);
    for (let i = 0; i < buffer; i++) {
      promiseList.push(new Promise(
          resolve => childProcess
                         .spawn(
                             nodePath(), argumentsForNode.concat([`--fgrep='${tests_list.pop()}'`]),
                             {encoding: 'utf-8', stdio: 'inherit', cwd})
                         .on('exit', resolve)));
    }
    await Promise.all(promiseList);
  }

  const end = Date.now();
  console.log('*'.repeat(100));
  console.log(`Execution time: ${end - start} ms`);
  console.log('*'.repeat(100));

  const result = childProcess.spawnSync(nodePath(), argumentsForNode, {encoding: 'utf-8', stdio: 'inherit', cwd});

  if (result.error) {
    throw result.error;
  }

  return result.status;
}

function fileIsExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function validateChromeBinaryExistsAndExecutable(chromeBinaryPath) {
  return (
      fs.existsSync(chromeBinaryPath) && fs.statSync(chromeBinaryPath).isFile(chromeBinaryPath) &&
      fileIsExecutable(chromeBinaryPath));
}

async function main() {
  const chromeBinaryPath = yargsObject['chrome-binary-path'];

  if (!validateChromeBinaryExistsAndExecutable(chromeBinaryPath)) {
    err(`Chrome binary path ${chromeBinaryPath} is not valid`);
  }

  const target = yargsObject['target'];
  const targetPath = path.join(yargsObject['cwd'], 'out', target);
  validatePathExistsOrError(`Target out/${target}`, targetPath);

  /*
   * Pull out all the configuration flags, ignoring the Yargs special $0 and _
   * keys, which we can ignore.
   */
  // eslint-disable-next-line no-unused-vars
  const {$0, _, ...configurationFlags} = yargsObject;

  if (!configurationFlags['test-server-type']) {
    if (configurationFlags['test-suite-path'].match(/e2e\/?/)) {
      configurationFlags['test-server-type'] = 'hosted-mode';
    } else if (configurationFlags['test-suite-path'].match(/interactions\/?/)) {
      configurationFlags['test-server-type'] = 'component-docs';
    } else {
      err('test-server-type could not be intelligently set based on your test-suite-path, you must manually set --test-server-type. Set it to "none" if you do not need a test-server to be run.');
      process.exit(1);
    }
  }

  /**
   * Expose the configuration to any downstream test runners (Mocha, Conductor,
   * Test servers, etc).
   */
  process.env.TEST_RUNNER_JSON_CONFIG = JSON.stringify(configurationFlags);

  log(`Using Chromium binary ${chromeBinaryPath}`);
  if (configurationFlags['chrome-features']) {
    log(`with --enable-features=${configurationFlags['chrome-features']}`);
  }
  log(`Using target ${target}`);

  const testSuitePath = getAbsoluteTestSuitePath(target);
  validatePathExistsOrError('Full path to test suite', testSuitePath);

  let resultStatusCode = -1;
  try {
    resultStatusCode = await executeTestSuite({
      absoluteTestSuitePath: testSuitePath,
      chromeBinaryPath,
      chromeFeatures: configurationFlags['chrome-features'],
      nodeModulesPath: configurationFlags['node-modules-path'],
      jobs: configurationFlags['jobs'],
      testFilePattern: configurationFlags['test-file-pattern'],
      coverage: configurationFlags['coverage'] && '1',
      target,
      cwd: configurationFlags['cwd'],
      mochaOptions: {
        fgrep: configurationFlags['mocha-fgrep'],
        invert: configurationFlags['invert'],
        reporter: configurationFlags['mocha-reporter'],
        'reporter-option': configurationFlags['mocha-reporter-option'],
      }
    });
  } catch (error) {
    log('Unexpected error when running test suite', error);
    resultStatusCode = 1;
  }
  if (resultStatusCode !== 0) {
    log('ERRORS DETECTED');
  }
  process.exit(resultStatusCode);
}

main();
