// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class ConsoleTabPageObject {
  get tabConsole() {return '#tab-console'}
  get defaultLevel() {return '[aria-label="Log level: Default levels"]'}
  get verboseLevel() {return '[aria-label="Verbose, unchecked"]'}
  get loggedConsoleMessages() {return '.console-group-messages'}
  get firstMessageFromConsole() {return '.console-group-messages .source-code .console-message-text'}
}
  
export const consoleTabPageObject = new ConsoleTabPageObject();
