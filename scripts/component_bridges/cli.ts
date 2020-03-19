// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import {generateClosureBridge, GeneratedCode} from './generate_closure';
import {walkTree} from './walk_tree';

const chromeLicense = `// Copyright ${new Date().getFullYear()} The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
`;

export const writeToDisk = (inputFilePath: string, generatedCode: GeneratedCode) => {
  const dir = path.dirname(inputFilePath);
  const baseName = path.basename(inputFilePath, '.ts');

  const outputFileName = `${baseName}.js`;


  const interfaces = generatedCode.interfaces
                         .map(interfacePart => {
                           return interfacePart.join('\n');
                         })
                         .join('\n');
  const classDeclaration = generatedCode.closureClass.join('\n');
  const creatorFunction = generatedCode.creatorFunction.join('\n');

  // TODO: warning about not modifying by hand

  const finalCode = [chromeLicense, interfaces, classDeclaration, creatorFunction].join('\n');

  fs.writeFileSync(path.join(dir, outputFileName), finalCode, {encoding: 'utf8'});

  return {
    output: path.join(dir, outputFileName),
    code: finalCode,
  };
};

const createTypeScriptCompilerForComponent = (componentSourceFilePath: string) => {
  const rootDir = path.resolve(process.cwd());

  const compilerHost = ts.createCompilerHost({
    rootDir,
    target: ts.ScriptTarget.ESNext,
  });

  const program = ts.createProgram(
      [componentSourceFilePath], {
        rootDir: rootDir,
      },
      compilerHost);

  const files = program.getSourceFiles().filter(f => f.fileName.includes('node_modules') === false);

  const originalFile = files.find(f => f.fileName === componentSourceFilePath);

  if (!originalFile) {
    return;
  }

  const state = walkTree(originalFile);
  const generatedCode = generateClosureBridge(state);
  return writeToDisk(componentSourceFilePath, generatedCode);
};

const main = (args: string[]) => {
  const bridgeComponentPath = path.resolve(process.cwd(), args[0]);

  if (!bridgeComponentPath || !fs.existsSync(bridgeComponentPath)) {
    throw new Error(`Could not find bridgeComponent path ${bridgeComponentPath}`);
  }

  const {output} = createTypeScriptCompilerForComponent(bridgeComponentPath);

  console.log('Wrote bridge file to', output);
};

if (require.main === module) {
  main(process.argv.slice(2));
}
