// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..', '..', 'front_end');
const DIRECTORY_IGNORE_LIST = ['third_party', 'node_modules'];

const checkFilesInDirectory = async (directory = ROOT_DIR, foundFiles = []) => {
  if (DIRECTORY_IGNORE_LIST.some(dir => directory.includes(dir))) {
    return foundFiles;
  }

  const files = await fs.promises.readdir(directory);
  await Promise.all(files.map(async file => {
    const filePath = path.join(directory, file);
    const fileStats = await fs.promises.lstat(filePath);
    if (fileStats.isDirectory()) {
      await checkFilesInDirectory(filePath, foundFiles);
    } else if (path.extname(filePath) === '.ts' || path.extname(filePath) === '.js') {
      foundFiles.push(filePath);
    }
  }));

  return foundFiles;
};

const regexes = {
  registerRequiredCSS: /registerRequiredCSS\('(.+)', {enableLegacyPatching: (true|false)}\)/g,
  appendStyle: /appendStyle\(.+, '(.+)', {enableLegacyPatching: (true|false)/g,
  createShadowRootWithCoreStyles: /createShadowRootWithCoreStyles\((.|\n)+?\)/gm,
  getStyleSheets: /getStyleSheets\('(.+)', {enableLegacyPatching: (true|false)}\)/g,
};

/*
 * cssFile => [{ usage: filePath, hasLegacyPatching: true}]
 */
const trackingData = new Map();

const checkForRegisterRequiredCSS = (filePath, contents) => {
 for (const match of contents.matchAll(regexes.registerRequiredCSS))  {
   const hasLegacyPatchingEnabled = match[2] === 'true';
   const cssFile = match[1];
   const existingEntries = trackingData.get(cssFile) || [];
   existingEntries.push({ file: filePath, hasLegacyPatchingEnabled});
   trackingData.set(cssFile, existingEntries);
 }
};

const checkForGetStyleSheets = (filePath, contents) => {
 for (const match of contents.matchAll(regexes.getStyleSheets))  {
   const hasLegacyPatchingEnabled = match[2] === 'true';
   const cssFile = match[1];
   const existingEntries = trackingData.get(cssFile) || [];
   existingEntries.push({ file: filePath, hasLegacyPatchingEnabled});
   trackingData.set(cssFile, existingEntries);
 }
};

const checkForAppendStyle = (filePath, contents) => {
 for (const match of contents.matchAll(regexes.appendStyle))  {
   const hasLegacyPatchingEnabled = match[2] === 'true';
   const cssFile = match[1];
   const existingEntries = trackingData.get(cssFile) || [];
   existingEntries.push({ file: filePath, hasLegacyPatchingEnabled});
   trackingData.set(cssFile, existingEntries);
 }
};

const checkForCreateShadowRoot = (filePath, contents) => {
 for (const match of contents.matchAll(regexes.createShadowRootWithCoreStyles))  {
   const fullMatch = match[0];
   const cssFilePropertyRegex = /cssFile: '(.+)'/;
   const legacyPatchingPropertyRegex = /enableLegacyPatching: (true|false)/;

   const hasCssFile = cssFilePropertyRegex.exec(fullMatch);
   if (hasCssFile && hasCssFile[1]) {
     const cssFilePath = hasCssFile[1];
     const hasLegacyPatching = legacyPatchingPropertyRegex.exec(fullMatch);
     if (hasLegacyPatching && hasLegacyPatching[1]) {
        const existingEntries = trackingData.get(cssFilePath) || [];
       existingEntries.push({ file: filePath, hasLegacyPatchingEnabled: hasLegacyPatching[1] === 'true' });
       trackingData.set(cssFilePath, existingEntries);
     }
   }
 }
};

const convertDataToCsvForGoogleSheets = () => {
  const csvRows = [['CSS File', 'Legacy calls remaining', 'Files containing legacy calls']];
  for (const [cssFile, usages] of trackingData.entries()) {
    const enabledUsages = usages.filter(u => u.hasLegacyPatchingEnabled);
    const row = [
      cssFile,
      enabledUsages.length,
      `"${Array.from(new Set(enabledUsages.map(u => path.relative(process.cwd(), u.file)))).join(', ')}"`,
    ];
    csvRows.push(row);
  }

  return csvRows.join('\n');
};

const loadExistingCsvAndGetKnownFilesSet = () => {
  const contents = fs.readFileSync(path.resolve(process.cwd(), 'dark_mode_tracker.csv'), {encoding: 'utf8'});
  const lines = contents.split('\n').slice(1);
  const files = new Set();
  lines.forEach(line => {
    const [fileName] = line.split(',');
    files.add(fileName);
  });
  return files;
};

async function listOutWorkForEachFile() {
  const files = Array.from(trackingData.keys());
  const workForFile = new Map();
  files.forEach(file => {
    const data = trackingData.get(file);
    const enabledUsages = data.filter(u => u.hasLegacyPatchingEnabled);
    if (enabledUsages.length > 0) {
      const fullPath = path.resolve(process.cwd(), 'front_end', file);
      const contents = fs.readFileSync(fullPath, {encoding: 'utf8'});
      const thingsWeAreAfter = new Set([
        'color', 'box-shadow', 'text-shadow', 'outline-color', 'background-image', 'background-color',
        'border-left-color', 'border-right-color', 'border-top-color', 'border-bottom-color', '-webkit-border-image',
        'fill', 'stroke', 'border'
      ]);
      let count = 0;
      thingsWeAreAfter.forEach(prop => {
        let i = -1;
        while (~(i = contents.indexOf(prop,++i))) {count++;}
      });
      console.log(file, count);
      workForFile.set(file, count);
    }
  });

  const rows = Array.from(workForFile.entries());
  rows.sort((r1, r2) => {
    const count1 = r1[1];
    const count2 = r2[1];
    return count1 > count2 ? 1 : count2 > count1 ? -1 : 0;
  });
  const output = rows.map(r => r.join(', ')).join('\n');
  fs.writeFileSync(path.resolve(process.cwd(), 'dark_mode_work.csv'), output);

}

const run = async () => {
  const filesToCheck = await checkFilesInDirectory();
  const knownFiles = loadExistingCsvAndGetKnownFilesSet();
  knownFiles.forEach(file => {
    trackingData.set(file, []);
  });
  await Promise.all(filesToCheck.map(async file => {
    const contents = await fs.promises.readFile(file, {encoding: 'utf8'});
    checkForRegisterRequiredCSS(file, contents);
    checkForAppendStyle(file, contents);
    checkForCreateShadowRoot(file, contents);
    checkForGetStyleSheets(file, contents);
  }));
  await fs.promises.writeFile(path.resolve(process.cwd(), 'dark_mode_tracker.csv'), convertDataToCsvForGoogleSheets());
  await listOutWorkForEachFile();
};

run();
