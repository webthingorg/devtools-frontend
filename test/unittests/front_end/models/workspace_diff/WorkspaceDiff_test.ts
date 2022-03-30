// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

// import * as SDK from '../../../../front_end/core/sdk/sdk.js';
// import * as ObjectUI from '../../../../front_end/ui/legacy/components/object_ui/object_ui.js';
// import * as UI from '../../../../front_end/ui/legacy/legacy.js';
import * as Workspace from '../../../../../front_end/models/workspace/workspace.js';
import type * as Persistence from '../../../../../front_end/models/persistence/persistence.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as WorkspaceDiff from '../../../../../front_end/models/workspace_diff/workspace_diff.js';
import * as Common from '../../../../../front_end/core/common/common.js';

import {describeWithRealConnection} from '../../helpers/RealConnection.js';

describeWithRealConnection('UISourceCodeDiff', () => {
  it('returns formatted mapping with a diff', async () => {
    const workspace = Workspace.Workspace.WorkspaceImpl.instance();
    const fileSystem = {
      id: () => 'FILE_SYSTEM_ID',
      requestFileContent: (_: Workspace.UISourceCode.UISourceCode) =>
          Promise.resolve({content: 'const data={original:true}'}),
      mimeType: () => 'text/javascript',
      workspace: () => workspace,
    } as unknown as Persistence.FileSystemWorkspaceBinding.FileSystem;
    const URL = 'file:///tmp/example.html' as Platform.DevToolsPath.UrlString;
    const uiSourceCode =
        new Workspace.UISourceCode.UISourceCode(fileSystem, URL, Common.ResourceType.resourceTypes.Document);
    uiSourceCode.setWorkingCopyGetter(() => 'const data={modified:true,original:false}');

    const uiSourceCodeDiff = new WorkspaceDiff.WorkspaceDiff.UISourceCodeDiff(uiSourceCode);
    const diff = await uiSourceCodeDiff.requestDiff({shouldFormatDiff: true});
    if (!diff) {
      throw new Error('Cannot request diff');
    }
    assert.deepEqual(diff.diff, [
      {'0': 0, '1': ['const data = {']},
      {'0': -1, '1': ['    original: true']},
      {'0': 1, '1': ['    modified: true,', '    original: false']},
      {'0': 0, '1': ['}', '']},
    ]);
    assert.deepEqual(diff.formattedCurrentMapping?.originalToFormatted(0, 'const data={'.length), [1, 4]);
    assert.deepEqual(diff.formattedCurrentMapping?.originalToFormatted(0, 'const data={modified:true,'.length), [2, 4]);
  });
});
