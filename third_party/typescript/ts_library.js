import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';
import yargs from 'yargs';

import * as DevToolsPaths from '../../scripts/devtools_paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIRECTORY_OF_REPOSITORY = path.join(__dirname, '..', '..');
const BASE_TS_CONFIG_LOCATION = path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'tsconfig.base.json');
const TYPES_NODE_MODULES_DIRECTORY = path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'node_modules', '@types');
const TYPESCRIPT_DIRECTORY = path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'node_modules', 'typescript');
const TSC_LOCATION = path.join(TYPESCRIPT_DIRECTORY, 'bin', 'tsc');

const GLOBAL_TYPESCRIPT_DEFINITION_FILES = [
  // legacy definitions used to help us bridge Closure and TypeScript
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'legacy', 'legacy-defs.d.ts'),
  // global definitions that we need
  // e.g. TypeScript doesn't provide ResizeObserver definitions so we host them ourselves
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'global_typings', 'global_defs.d.ts'),
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'global_typings', 'request_idle_callback.d.ts'),
  // generated protocol definitions
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'generated', 'protocol.d.ts'),
  // generated protocol api interactions
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'generated', 'protocol-proxy-api.d.ts'),
  // Types for W3C FileSystem API
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'node_modules', '@types', 'filesystem', 'index.d.ts'),
  // Global types required for our usage of ESTree (coming from Acorn)
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'node_modules', '@types', 'estree', 'index.d.ts'),
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'legacy', 'estree-legacy.d.ts'),
  // CodeMirror types
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'node_modules', '@types', 'codemirror', 'index.d.ts'),
  path.join(ROOT_DIRECTORY_OF_REPOSITORY, 'front_end', 'legacy', 'codemirror-legacy.d.ts'),
].map(filePath => path.relative(process.cwd(), filePath));

const argv =
    yargs(process.argv.slice(2))
        .parserConfiguration({
          'camel-case-expansion': true,
        })
        .options({
          sources: {type: 'array', default: []},
          deps: {type: 'array', default: []},
          frontEndDirectory: {type: 'string', demandOption: true},
          tsconfigOutputLocation: {type: 'string', demandOption: true},
          testOnly: {type: 'boolean', default: false},
          verifyLibCheck: {type: 'boolean', default: false},
          isWebWorker: {type: 'boolean', default: false},
          module: {type: 'string', default: 'esnext'},
          useRbe: {type: 'boolean', default: false, implies: ['rewrapperBinary', 'rewrapperCfg', 'rewrapperExecRoot']},
          rewrapperBinary: {type: 'string'},
          rewrapperCfg: {type: 'string'},
          rewrapperExecRoot: {type: 'string'},
        })
        .argv;

const TSCONFIG = JSON.parse(fs.readFileSync(BASE_TS_CONFIG_LOCATION, {encoding: 'utf-8'}));
const TSCONFIG_OUTPUT_LOCATION = path.join(process.cwd(), argv.tsconfigOutputLocation);
const TSCONFIG_OUTPUT_DIRECTORY = path.dirname(TSCONFIG_OUTPUT_LOCATION);
const TS_BUILD_INFO_FILE = `${path.basename(TSCONFIG_OUTPUT_LOCATION)}.tsbuildinfo`;
const ALL_TS_FILES = [...argv.sources, ...GLOBAL_TYPESCRIPT_DEFINITION_FILES];

/**
 * @param {string} pathToResolve
 * @return {string}
 */
function getRelativePathFromOutputDirectory(pathToResolve) {
  return path.relative(TSCONFIG_OUTPUT_DIRECTORY, path.join(process.cwd(), pathToResolve));
}

TSCONFIG.files = ALL_TS_FILES.map(getRelativePathFromOutputDirectory);
TSCONFIG.references = argv.deps.map(filePath => ({path: filePath}));

TSCONFIG.compilerOptions.rootDir = getRelativePathFromOutputDirectory(argv.frontEndDirectory);
TSCONFIG.compilerOptions.outDir = '.';
TSCONFIG.compilerOptions.module = argv.module;
if (!argv.verifyLibCheck) {
  TSCONFIG.compilerOptions.skipLibCheck = true;
}

if (argv.testOnly) {
  TSCONFIG.compilerOptions.typeRoots =
      [getRelativePathFromOutputDirectory(path.relative(process.cwd(), TYPES_NODE_MODULES_DIRECTORY))];
  TSCONFIG.compilerOptions.moduleResolution = 'node';
} else {
  TSCONFIG.compilerOptions.typeRoots = [];
}

TSCONFIG.compilerOptions.tsBuildInfoFile = TS_BUILD_INFO_FILE;
const additionalLibs = argv.isWebWorker ? ['webworker', 'webworker.iterable'] : ['dom', 'dom.iterable'];
TSCONFIG.compilerOptions.lib = ['esnext', ...additionalLibs];

try {
  await fs.promises.writeFile(TSCONFIG_OUTPUT_LOCATION, JSON.stringify(TSCONFIG));
} catch (e) {
  console.error(`Encountered error while writing generated tsconfig in location ${TSCONFIG_OUTPUT_LOCATION}:`);
  console.error(e);
  process.exit(1);
}

if (argv.sources.length === 0 && !argv.verifyLibCheck) {
  process.exit(0);
}

/**
 * @param {string} command
 * @param {!Array<string>=} args
 * @return {!Promise<string>}
 */
function runChildProcess(command, args = []) {
  return new Promise((resolve, reject) => {
    /** @type {string} */
    let response = '';
    const subProcess = childProcess.spawn(command, args);
    subProcess.stdout.on('data', data => {
      response += data.toString();
    });

    subProcess.on('close', () => {
      if (subProcess.exitCode === 0) {
        resolve(response);
      } else {
        reject(response);
      }
    });

    subProcess.on('error', err => {
      reject(response + err);
    });
  });
}

const useRemoteExecution = argv.useRbe && argv.deps.length === 0;

try {
  if (useRemoteExecution) {
    const relativeTSFilePaths = ALL_TS_FILES.map(filePath => path.relative(argv.rewrapperExecRoot, filePath));
    const declarationFiles = await fs.promises.readdir(path.join(TYPESCRIPT_DIRECTORY, 'lib'));
    const allDtsFiles = declarationFiles.filter(filePath => filePath.endsWith('.d.ts'));

    const relativeNodeLocation = path.relative(process.cwd(), DevToolsPaths.nodePath());
    const relativeTscLocation = path.relative(process.cwd(), TSC_LOCATION);
    const relativeTSConfigLocation = path.relative(process.cwd(), TSCONFIG_OUTPUT_LOCATION);

    const inputs = [
      relativeNodeLocation, relativeTscLocation, path.join(TYPESCRIPT_DIRECTORY, 'lib', 'tsc.js'),
      relativeTSConfigLocation, ...relativeTSFilePaths, ...allDtsFiles
    ].join(',');

    await runChildProcess(argv.rewrapperBinary, [
      '-cfg', argv.rewarpperCfg, '-exec_root', argv.rewrapperExecRoot, '-labels=type=tool', '-inputs', inputs,
      '-output_directories', path.relative(arg.rewrapperExecRoot, path.dirname(TSCONFIG_OUTPUT_LOCATION)), '--',
      relativeNodeLocation, relativeTscLocation, '-p', relativeTSConfigLocation
    ]);
  } else {
    await runChildProcess(TSC_LOCATION, ['-p', TSCONFIG_OUTPUT_LOCATION]);
  }
} catch (e) {
  console.error('');
  console.error(`TypeScript compilation failed. Used tsconfig ${TSCONFIG_OUTPUT_LOCATION}`);
  console.error('');
  console.error(e);
  console.error('');
  process.exit(1);
}

process.exit(0);
