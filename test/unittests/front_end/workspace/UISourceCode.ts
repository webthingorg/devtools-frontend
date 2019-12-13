// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Common from '../../../../front_end/common/common.js';
import {default as WorkspaceImpl, ProjectStore, projectTypes} from '../../../../front_end/workspace/WorkspaceImpl.js';
import {default as UISourceCode} from '../../../../front_end/workspace/UISourceCode.js';

describe('UISourceCode', () => {
  it('can be instantiated correctly', () => {
    const workspaceImpl = new WorkspaceImpl();
    const testResourceCategory =
        new Common.ResourceType.ResourceCategory('Category Test Title', 'Category Test Short Title');
    const resourceType =
        new Common.ResourceType.ResourceType('Type Test Name', 'Type Test Title', testResourceCategory, true);
    const testProjectStore = new ProjectStore(workspaceImpl, 1, projectTypes.Service, 'Test Project');
    const testUISourceCode = new UISourceCode(testProjectStore, 'www.test.com', resourceType);
    assert.equal(testUISourceCode.name(), 'www.test.com', 'name was not set or retrieved correctly');
  });

  // TODO continue writing tests here or use another describe block
});
