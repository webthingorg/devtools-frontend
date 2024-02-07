// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function findEnumNode(root, isVariableDeclaration) {
  const nodesToVisit = [root];
  while (nodesToVisit.length) {
    const currentNode = nodesToVisit.shift();
    if ((isVariableDeclaration ? ts.isVariableDeclaration(currentNode) : ts.isEnumDeclaration(currentNode)) &&
        currentNode.name.escapedText === 'EnumeratedHistogram') {
      return currentNode;
    }
    nodesToVisit.push(...currentNode.getChildren());
  }
}

function extractHistogramsFromHostApi(nodes) {
  const histograms = [];
  for (const node of nodes) {
    const stringLiteralNode = node.getChildren()[2];
    if (stringLiteralNode.kind === ts.SyntaxKind.StringLiteral) {
      histograms.push({id: node.name.escapedText, value: stringLiteralNode.getText().replace(/(^')|('$)/g, '')});
    }
  }
  return histograms;
}

function extractHistogramsFromCompatibility(root) {
  const histograms = [];
  const nodesToVisit = [root];
  while (nodesToVisit.length) {
    const currentNode = nodesToVisit.shift();
    if (ts.isPropertyAssignment(currentNode)) {
      histograms.push({id: currentNode.name.escapedText, value: currentNode.initializer.text});
    }
    nodesToVisit.push(...currentNode.getChildren());
  }
  return histograms;
}

function compare(histograms1, histograms2) {
  if (histograms1.length !== histograms2.length) {
    console.error(
        '\'EnumeratedHistogram\` enums in \'InspectorFrontendHostAPI.ts\' and \'devtools_compatibility.js\' do not have the same length.');
    console.error('Please ensure both enums have exactly the same content.');
    process.exit(1);
  }
  for (let i = 0; i < histograms1.length; i++) {
    if (histograms1[i].id !== histograms2[i].id) {
      console.error(
          '\'EnumeratedHistogram\` enums in \'InspectorFrontendHostAPI.ts\' and \'devtools_compatibility.js\' do not have the same content.');
      console.error(`Member names '${histograms1[i].id}' and '${histograms2[i].id}' at index ${i} do not match.`);
      console.error('Please ensure both enums have exactly the same content.');
      process.exit(1);
    }
    if (histograms1[i].value !== histograms2[i].value) {
      console.error(
          '\'EnumeratedHistogram\` enums in \'InspectorFrontendHostAPI.ts\' and \'devtools_compatibility.js\' do not have the same content.');
      console.error(
          `Member values '${histograms1[i].value}' and '${histograms2[i].value}' at index ${i} do not match.`);
      console.error('Please ensure both enums have exactly the same content.');
      process.exit(1);
    }
  }
}

function main() {
  const hostApiPath = path.resolve(__dirname, '..', 'front_end', 'core', 'host', 'InspectorFrontendHostAPI.ts');
  const hostApiFile = fs.readFileSync(hostApiPath, 'utf8');
  const hostApiSourceFile = ts.createSourceFile(hostApiPath, hostApiFile, ts.ScriptTarget.ESNext, true);
  const hostApiEnumNode = findEnumNode(hostApiSourceFile, false);
  const hostApiHistograms = extractHistogramsFromHostApi(hostApiEnumNode.members);
  if (!hostApiHistograms.length) {
    console.error('Could not find \'EnumeratedHistogram\` enum entries in \'InspectorFrontendHostAPI.ts\'.');
    process.exit(1);
  }

  const compatibilityPath = path.resolve(__dirname, '..', 'front_end', 'devtools_compatibility.js');
  const compatibilityFile = fs.readFileSync(compatibilityPath, 'utf8');
  const compatibilitySourceFile =
      ts.createSourceFile(compatibilityPath, compatibilityFile, ts.ScriptTarget.ESNext, true);
  const compatibilityEnumNode = findEnumNode(compatibilitySourceFile, true);
  const compatibilityHistograms = extractHistogramsFromCompatibility(compatibilityEnumNode);
  if (!compatibilityHistograms.length) {
    console.error('Could not find \'EnumeratedHistogram\` enum entries in \'devtools_compatibility.js\'.');
    process.exit(1);
  }

  compare(hostApiHistograms, compatibilityHistograms);
  console.log('DevTools UMA Enumerated Histograms checker passed.');
}

main();
