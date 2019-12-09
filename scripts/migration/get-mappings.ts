// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { parse, print, types, visit } from 'recast';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const b = types.builders;

const FRONT_END_FOLDER = path.join(__dirname, '..', '..', 'front_end')

export async function getMappings(namespace: string, mappings: Map<string, any>) {
  const src = namespace.toLocaleLowerCase();
  const legacy = path.join(FRONT_END_FOLDER, src, `${src}-legacy.js`);

  if (!(await stat(legacy))) {
    console.error(`Unable to find legacy file: ${legacy}`);
    process.exit(1);
    return mappings;
  }

  const legacyFileContents = await readFile(legacy, { encoding: 'utf-8' });
  const ast = parse(legacyFileContents);

  for (const statement of ast.program.body) {
    if (statement.type !== 'ExpressionStatement') {
      continue;
    }

    if (statement.expression && statement.expression.left && statement.expression.right &&
        statement.expression.type === 'AssignmentExpression' && statement.expression.left.type === 'MemberExpression' &&
        statement.expression.right.type === 'MemberExpression') {

      if (statement.expression.right.object && statement.expression.right.object.object.type === 'Identifier') {
        statement.expression.right.object.object.name = statement.expression.right.object.object.name.replace(/Module$/, '');
      }

      const leftSide = print(statement.expression.left).code;
      const rightSide = print(statement.expression.right).code;
      const rightSideParts = rightSide.split('.');
      const file = path.join(FRONT_END_FOLDER, src, rightSideParts[1] + '.js');
      mappings.set(leftSide, { file, replacement: rightSide, sameFolderReplacement: rightSideParts[rightSideParts.length - 1] });
    }
  }

  return mappings;
}
