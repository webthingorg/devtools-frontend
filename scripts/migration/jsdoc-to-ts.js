const ts = require('typescript');
const path = require('path');
const fs = require('fs');

process.chdir('./out/Default');

const tmp = ts.sys;
const originalReadFile = ts.sys.readFile;
function readFile(path, encoding) {
  const data = originalReadFile(path, encoding);
  if (!data)
    return undefined;

  // Add an // @empty-line comment to empty lines to make sure TypeScript does
  // not loose them while processing the file.
  return data.replace(/\n\n/g, '\n// @empty-line\n');
}
tmp.readFile = readFile;

function transformModule(module, transformer) {
  const basePath = path.resolve('../../front_end', module);
  const configFileName = `./gen/front_end/${module}/${module}-tsconfig.json`;

  if (!fs.existsSync(configFileName))
    return;

  // Fix after https://github.com/Microsoft/TypeScript/issues/18217
  tmp.onUnRecoverableConfigFileDiagnostic = err => {
    throw err
  };
  const config = ts.getParsedCommandLineOfConfigFile(configFileName, undefined, tmp);
  tmp.onUnRecoverableConfigFileDiagnostic = undefined;

  const host = ts.createCompilerHost(config.options, true);
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
    projectReferences: config.projectReferences,
    host: host,
  });

  const checker = program.getTypeChecker();
  const sources = program.getSourceFiles().filter(sourceFile => sourceFile.fileName.startsWith(basePath));

  const result =
      ts.transformNodes(undefined, host, ts.factory, config.compilerOptions, sources, [transformer(checker)], false);

  const printer = ts.createPrinter();
  for (const sourceFile of result.transformed) {
    // Replace // @empty-line comments with actual empty lines again
    const content = printer.printFile(sourceFile).replace(/\n\s*\/\/ @empty-line\n/g, '\n\n').replace(/    /g, '  ');
    // console.log(content);
    fs.writeFileSync(sourceFile.fileName, content);
  }
}

const blacklistedModules = new Set(['cm', 'cm_headless']);

function walkAllModules() {
  const entries = fs.readdirSync('./gen/front_end', {withFileTypes: true});
  for (const entry of entries) {
    if (!entry.isDirectory())
      continue;
    if (blacklistedModules.has(entry.name))
      continue;

    updateModule(entry.name);
  }
}


const transformTypes = require('./jsdoc-to-ts/transformTypes');
const transformMethods = require('./jsdoc-to-ts/transformMethods');
const transformPropertyDeclarations = require('./jsdoc-to-ts/transformPropertyDeclarations');
const transformCasts = require('./jsdoc-to-ts/transformCasts');

transformModule('webauthn', transformTypes);
transformModule('webauthn', transformMethods);
transformModule('webauthn', transformPropertyDeclarations);
transformModule('webauthn', transformCasts);

// walkAllModules();
