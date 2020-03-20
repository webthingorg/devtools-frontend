// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as fs from 'fs';
import * as path from 'path';

import {generateClosureBridge, GeneratedCode} from './generate_closure';
import {filePathToTypeScriptSourceFile, walkTree} from './walk_tree';

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

const parseTypeScriptComponent = (componentSourceFilePath: string) => {
  const file = filePathToTypeScriptSourceFile(componentSourceFilePath);

  const state = walkTree(file, componentSourceFilePath);
  const generatedCode = generateClosureBridge(state);
  return writeToDisk(componentSourceFilePath, generatedCode);
};

const main = (args: string[]) => {
  const bridgeComponentPath = path.resolve(process.cwd(), args[0]);

  if (!bridgeComponentPath || !fs.existsSync(bridgeComponentPath)) {
    throw new Error(`Could not find bridgeComponent path ${bridgeComponentPath}`);
  }

  const {output} = parseTypeScriptComponent(bridgeComponentPath);

  console.log('Wrote bridge file to', output);
};

if (require.main === module) {
  main(process.argv.slice(2));
}
