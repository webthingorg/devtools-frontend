// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

<<<<<<< HEAD   (ed0285 Console: fix no scroll bug in context selector)
export const testList = ['./hello-world/hello-world.js',];
=======
import {join} from 'path';

export const testList = [
  join(__dirname, '.', 'application', 'session-storage.js'),
  join(__dirname, '.', 'application', 'websql-database.js'),
  join(__dirname, '.', 'console', 'console-message-format.js'),
  join(__dirname, '.', 'console', 'console-repl-mode.js'),
  join(__dirname, '.', 'elements', 'pseudo-states.js'),
  join(__dirname, '.', 'elements', 'shadowroot-styles.js'),
  join(__dirname, '.', 'network', 'network-datagrid.js'),
  join(__dirname, '.', 'snippets', 'context-menu.js'),
  join(__dirname, '.', 'sources', 'can-format-sourcecode.js'),
  join(__dirname, '.', 'sources', 'can-show-files-after-loading.js'),
  join(__dirname, '.', 'sources', 'can-break-with-wasm-sourcemaps.js'),
  join(__dirname, '.', 'sources', 'can-show-multiple-workers.js'),
  join(__dirname, '.', 'sources', 'debug-raw-wasm.js'),
  join(__dirname, '.', 'sources', 'script-in-multiple-workers.js'),
  join(__dirname, '.', 'host', 'user-metrics.js'),
];
>>>>>>> CHANGE (046a8d Fix command menu items for snippets)
