// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Bindings from '../../../../../front_end/models/bindings/bindings.js';
import * as Common from '../../../../../front_end/core/common/common.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import * as Sources from '../../../../../front_end/panels/sources/sources.js';
import {deinitializeGlobalVars, initializeGlobalVars} from '../../helpers/EnvironmentHelpers.js';
import {setUpEnvironment} from '../../helpers/OverridesHelpers.js';

const setUpEnvironmentWithUISourceCode =
    (url: string, resourceType: Common.ResourceType.ResourceType, project?: Workspace.Workspace.Project) => {
      const {workspace, debuggerWorkspaceBinding} = setUpEnvironment();
      Bindings.IgnoreListManager.IgnoreListManager.instance({forceNew: false, debuggerWorkspaceBinding});

      const proj = project ||
          {id: () => url, type: () => Workspace.Workspace.projectTypes.Network} as Workspace.Workspace.Project;

      const uiSourceCode =
          new Workspace.UISourceCode.UISourceCode(proj, url as Platform.DevToolsPath.UrlString, resourceType);

      proj.uiSourceCodes = () => [uiSourceCode];

      workspace.addProject(proj);

      return {workspace, project, uiSourceCode};
    };

describe('FilteredUISourceCodeListProvider', () => {
  beforeEach(async () => {
    await initializeGlobalVars();
    Root.Runtime.experiments.register(Root.Runtime.ExperimentName.JUST_MY_CODE, '');
  });

  afterEach(async () => {
    Root.Runtime.experiments.setEnabled(Root.Runtime.ExperimentName.JUST_MY_CODE, false);
    await deinitializeGlobalVars();
  });

  it('should exclude Fetch requests in the result', () => {
    const url = 'http://www.example.com/list-fetch.json';
    const resourceType = Common.ResourceType.resourceTypes.Fetch;

    setUpEnvironmentWithUISourceCode(url, resourceType);

    const filteredUISourceCodeListProvider =
        new Sources.FilteredUISourceCodeListProvider.FilteredUISourceCodeListProvider();
    filteredUISourceCodeListProvider.attach();

    assert.strictEqual(filteredUISourceCodeListProvider.itemCount(), 0);
  });

  it('should exclude XHR requests in the result', () => {
    const url = 'http://www.example.com/list-xhr.json';
    const resourceType = Common.ResourceType.resourceTypes.XHR;

    setUpEnvironmentWithUISourceCode(url, resourceType);

    const filteredUISourceCodeListProvider =
        new Sources.FilteredUISourceCodeListProvider.FilteredUISourceCodeListProvider();
    filteredUISourceCodeListProvider.attach();

    assert.strictEqual(filteredUISourceCodeListProvider.itemCount(), 0);
  });

  it('should include Document requests in the result', async () => {
    const url = 'http://www.example.com/index.html';
    const resourceType = Common.ResourceType.resourceTypes.Document;

    setUpEnvironmentWithUISourceCode(url, resourceType);

    const filteredUISourceCodeListProvider =
        new Sources.FilteredUISourceCodeListProvider.FilteredUISourceCodeListProvider();
    filteredUISourceCodeListProvider.attach();

    assert.strictEqual(filteredUISourceCodeListProvider.itemKeyAt(0), url);
    assert.strictEqual(filteredUISourceCodeListProvider.itemCount(), 1);
  });

  it('should exclude ignored script requests in the result', async () => {
    const url = 'http://www.example.com/some-script.js';
    const resourceType = Common.ResourceType.resourceTypes.Script;

    const {uiSourceCode} = setUpEnvironmentWithUISourceCode(url, resourceType);

    // ignore the uiSourceCode
    Root.Runtime.experiments.setEnabled(Root.Runtime.ExperimentName.JUST_MY_CODE, true);
    Bindings.IgnoreListManager.IgnoreListManager.instance().ignoreListUISourceCode(uiSourceCode);

    const filteredUISourceCodeListProvider =
        new Sources.FilteredUISourceCodeListProvider.FilteredUISourceCodeListProvider();
    filteredUISourceCodeListProvider.attach();

    assert.strictEqual(filteredUISourceCodeListProvider.itemCount(), 0);
  });

  it('should include Image requests in the result', async () => {
    const url = 'http://www.example.com/img.png';
    const resourceType = Common.ResourceType.resourceTypes.Image;

    setUpEnvironmentWithUISourceCode(url, resourceType);

    const filteredUISourceCodeListProvider =
        new Sources.FilteredUISourceCodeListProvider.FilteredUISourceCodeListProvider();
    filteredUISourceCodeListProvider.attach();

    assert.strictEqual(filteredUISourceCodeListProvider.itemKeyAt(0), url);
    assert.strictEqual(filteredUISourceCodeListProvider.itemCount(), 1);
  });

  it('should include Script requests in the result', async () => {
    const url = 'http://www.example.com/some-script.js';
    const resourceType = Common.ResourceType.resourceTypes.Script;

    setUpEnvironmentWithUISourceCode(url, resourceType);

    const filteredUISourceCodeListProvider =
        new Sources.FilteredUISourceCodeListProvider.FilteredUISourceCodeListProvider();
    filteredUISourceCodeListProvider.attach();

    assert.strictEqual(filteredUISourceCodeListProvider.itemKeyAt(0), url);
    assert.strictEqual(filteredUISourceCodeListProvider.itemCount(), 1);
  });
});
