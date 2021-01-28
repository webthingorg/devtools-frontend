"use strict";
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const cli_1 = require("./cli");
const regenerateBridge = (pathToBridge) => {
    const sourceFile = pathToBridge.replace('_bridge.js', '.ts');
    if (!fs.existsSync(sourceFile)) {
        throw new Error(`Could not find source file ${sourceFile}`);
    }
    try {
        const outputPath = cli_1.main([sourceFile, ...process.argv.slice(2)]);
        if (outputPath) {
            const relativePath = path.relative(process.cwd(), outputPath);
            return relativePath;
        }
    }
    catch (e) {
        console.error(`ERROR regenerating bridge (${path.relative(process.cwd(), pathToBridge)}):`);
        console.log(e.stack);
        process.exit(1);
    }
    return null;
};
const excludedDirectories = new Set([path.resolve(path.join(process.cwd(), 'front_end', 'third_party'))]);
const searchForBridgeFiles = (directory, foundFiles = []) => {
    if (excludedDirectories.has(directory)) {
        return foundFiles;
    }
    const directoryContents = fs.readdirSync(directory);
    directoryContents.forEach(fileOrDir => {
        const fullPath = path.resolve(path.join(directory, fileOrDir));
        if (fs.statSync(fullPath).isDirectory()) {
            searchForBridgeFiles(fullPath, foundFiles);
        }
        else if (fullPath.endsWith('_bridge.js')) {
            foundFiles.push(fullPath);
        }
    });
    return foundFiles;
};
const rootDir = path.resolve(path.join(process.cwd(), 'front_end'));
const allBridgeFiles = searchForBridgeFiles(rootDir);
const filesToReformat = allBridgeFiles.map(filePath => regenerateBridge(filePath)).filter(x => x !== null);
const clFormatCommand = `git cl format --js ${filesToReformat.join(' ')}`;
child_process_1.execSync(clFormatCommand);
//# sourceMappingURL=regenerate-all-bridges.js.map