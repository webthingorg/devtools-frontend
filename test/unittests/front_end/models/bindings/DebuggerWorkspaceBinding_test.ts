// // Copyright 2022 The Chromium Authors. All rights reserved.
// // Use of this source code is governed by a BSD-style license that can be
// // found in the LICENSE file.
// import * as Root from '../../../../../front_end/core/root/root.js';
// import * as Bindings from "../../../../../front_end/models/bindings/bindings.js";
// import * as Workspace from "../../../../../front_end/models/workspace/workspace.js";
// import * as SDK from "../../../../../front_end/core/sdk/sdk.js";
// import * as Protocol from '../../../../../front_end/generated/protocol.js';

// import { createTarget } from "../../helpers/EnvironmentHelpers.js";
// import { describeWithMockConnection, dispatchEvent, setMockConnectionResponseHandler } from "../../helpers/MockConnection.js";


// describeWithMockConnection('DebuggerWorkspaceBinding', () => {
//   let target: SDK.Target.Target;
//   beforeEach(() => {
//     target = createTarget();
//     // @ts-ignore layout test global
//     const networkProjectManager = Bindings.NetworkProject.NetworkProjectManager.instance();
//     const resourceMapping = new Bindings.ResourceMapping.ResourceMapping(
//         SDK.TargetManager.TargetManager.instance(),
//         Workspace.Workspace.WorkspaceImpl.instance(),
//     );
//     Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({
//       forceNew: true,
//       resourceMapping,
//       targetManager: target.targetManager(),
//     });
//   })

//   it('can retrieve source mapped UISourceCode', async () => {
//     Root.Runtime.experiments.register(Root.Runtime.ExperimentName.PROTOCOL_MONITOR, '');
//     Root.Runtime.experiments.enableForTest(Root.Runtime.ExperimentName.PROTOCOL_MONITOR);
//     const scriptId = '1' as Protocol.Runtime.ScriptId;
//     const url = 'test.min.js';
//     dispatchEvent(target, 'Debugger.scriptParsed', {
//       scriptId,
//       url,
//       startLine: 0,
//       startColumn: 0,
//       endLine: 1,
//       endColumn: 10,
//       executionContextId: 1,
//       hash: '',
//       isLiveEdit: false,
//       sourceMapURL: 'test.js.map',
//       hasSourceURL: false,
//       length: 10,
//     });
//   })



//   it('allows for awaiting source mapped UISourceCode', () => {

//   })
// });

