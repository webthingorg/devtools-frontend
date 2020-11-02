// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
import type {IssuesPaneImpl} from './IssuesPane.js';

export class IssueRevealer implements Common.Revealer.Revealer {
  async reveal(issue: unknown): Promise<void> {
    if (!(issue instanceof SDK.Issue.Issue)) {
      throw new Error('Internal error: not a issue');
    }
    await UI.ViewManager.ViewManager.instance().showView('issues-pane');
    const view = UI.ViewManager.ViewManager.instance().view('issues-pane');
    if (view) {
      const issuesPane = (await view.widget()) as IssuesPaneImpl;
      issuesPane.revealByCode(issue.code());
    }
  }
}
