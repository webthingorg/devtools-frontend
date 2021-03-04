// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../front_end/common/common.js';
import type * as SDKModule from '../../../../front_end/sdk/sdk.js';
import type * as BrowserSDK from '../../../../front_end/browser_sdk/browser_sdk.js';

export class MockIssuesManager extends Common.Observable.Observable<BrowserSDK.IssuesManager.IssuesManagerObserver> {
  private mockIssues: Iterable<SDKModule.Issue.Issue>;

  constructor(issues: Iterable<SDKModule.Issue.Issue>) {
    super();
    this.mockIssues = issues;
  }
  issues() {
    return this.mockIssues;
  }
}
