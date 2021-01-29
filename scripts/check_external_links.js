// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');
const ts = require('typescript');

const readDirAsync = fs.promises.readdir;
const readFileAsync = fs.promises.readFile;

const ORIGINS_TO_CHECK = [
  'https://web.dev',
  'https://developers.google.com',
];

const DIRECTORIES_TO_CHECK = [
  'front_end',
];

const EXCLUDE_DIRECTORIES = [
  'front_end/third_party',
];

const REQUEST_TIMEOUT = 5000;

const ROOT_REPOSITORY_PATH = path.resolve(__dirname, '..');
const DIRECTORIES_TO_CHECK_PATHS = DIRECTORIES_TO_CHECK.map(directory => path.resolve(ROOT_REPOSITORY_PATH, directory));

async function findAllSourceFiles(directory) {
  if (EXCLUDE_DIRECTORIES.includes(path.relative(ROOT_REPOSITORY_PATH, directory))) {
    return [];
  }

  const dirEntries = await readDirAsync(directory, {withFileTypes: true});
  const files = await Promise.all(dirEntries.map(dirEntry => {
    const resolvedPath = path.resolve(directory, dirEntry.name);
    if (dirEntry.isDirectory()) {
      return findAllSourceFiles(resolvedPath);
    }
    if (dirEntry.isFile() && /\.(js|ts)$/.test(dirEntry.name)) {
      return resolvedPath;
    }
    return [];  // Let Array#flat filter out files we are not interested in.
  }));
  return files.flat();
}

function collectUrlsToCheck(node) {
  const nodesToVisit = [node];
  const urlsToCheck = [];
  while (nodesToVisit.length) {
    const currentNode = nodesToVisit.shift();
    if (currentNode.kind === ts.SyntaxKind.StringLiteral ||
        currentNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
      const checkUrl = ORIGINS_TO_CHECK.some(origin => currentNode.text.startsWith(origin));
      if (checkUrl) {
        urlsToCheck.push(currentNode.text);
      }
    }
    nodesToVisit.push(...currentNode.getChildren());
  }
  return urlsToCheck;
}

async function collectUrlsToCheckFromFile(filePath) {
  const content = await readFileAsync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true);
  return collectUrlsToCheck(sourceFile);
}

async function checkUrls(urls) {
  // clang-format off
  const requestPromises = urls.map(url => new Promise(resolve => {
    const request = https.request(url, {method: 'HEAD'}, response => {
      resolve({url, statusCode: response.statusCode});
    });

    request.on('error', err => {
      resolve({url, error: err});
    });
    request.setTimeout(REQUEST_TIMEOUT, _ => {
      resolve({url, error: `Timed out after ${REQUEST_TIMEOUT}`});
    });
    request.end();
  }));
  // clang-format on

  return Promise.all(requestPromises);
}

async function main() {
  process.stdout.write('Collecting JS/TS source files ... ');
  const sourceFiles = (await Promise.all(DIRECTORIES_TO_CHECK_PATHS.map(findAllSourceFiles))).flat();
  process.stdout.write(`${sourceFiles.length} files found.\n`);

  process.stdout.write('Collecting Urls from files ... ');
  const urlsToCheck = (await Promise.all(sourceFiles.map(collectUrlsToCheckFromFile))).flat();
  const deduplicatedUrlsToCheck = new Set(urlsToCheck);
  process.stdout.write(`${deduplicatedUrlsToCheck.size} unique Urls found.\n`);

  process.stdout.write('Sending a HEAD request to each one ...\n');
  const requestResults = await checkUrls([...deduplicatedUrlsToCheck]);
  const erronousRequests =
      requestResults.filter(requestResult => requestResult.error || requestResult.statusCode >= 400);
  if (erronousRequests.length === 0) {
    console.log('\nAll Urls are accessible and point to existing resources.\n');
    process.exit(0);
  }

  for (const requestResult of erronousRequests) {
    if (requestResult.error) {
      console.error(`[\x1b[31mFAIL\x1b[0m] ${requestResult.url} (${requestResult.error})`);
    } else {
      console.error(`[\x1b[31m${requestResult.statusCode}\x1b[0m] ${requestResult.url}`);
    }
  }
  process.exit(1);
}

main();
