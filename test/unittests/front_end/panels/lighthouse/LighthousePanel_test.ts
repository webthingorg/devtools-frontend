
// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Lighthouse from '../../../../../front_end/panels/lighthouse/lighthouse.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Common from '../../../../../front_end/core/common/common.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import type * as ProtocolClient from '../../../../../front_end/core/protocol_client/protocol_client.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, dispatchEvent} from '../../helpers/MockConnection.js';

describeWithMockConnection('LighthousePanel', () => {
  const waitForTargetLoad = (targetFactory: () => SDK.Target.Target) => {
    let LighthouseModule: typeof Lighthouse;
    let target: SDK.Target.Target;
    const FRAME = {
      id: 'main',
      loaderId: 'test',
      url: 'http://example.com',
      securityOrigin: 'http://example.com',
      mimeType: 'text/html',
    };

    beforeEach(async () => {
      // @ts-ignore layout test global
      self.UI = self.UI || {};
      // @ts-ignore layout test global
      self.UI.panels = self.UI.panels || {};
      LighthouseModule = await import('../../../../../front_end/panels/lighthouse/lighthouse.js');
      target = targetFactory();
      const targetManager = SDK.TargetManager.TargetManager.instance();
      sinon.stub(targetManager, 'suspendAllTargets').resolves();
      sinon.stub(targetManager, 'resumeAllTargets').resolves();
      SDK.ChildTargetManager.ChildTargetManager.install();
      const childTargetManager = target.model(SDK.ChildTargetManager.ChildTargetManager);
      assertNotNullOrUndefined(childTargetManager);
      sinon.stub(childTargetManager, 'createParallelConnection').resolves({
        connection: {disconnect: () => {}, sendRawMessage: () => {}} as unknown as
            ProtocolClient.InspectorBackend.Connection,
        sessionId: 'foo',
      });
      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      sinon.stub(resourceTreeModel, 'navigate').resolves();
      dispatchEvent(target, 'Page.frameNavigated', {frame: FRAME});
      sinon.stub(target.pageAgent(), 'invoke_getNavigationHistory').resolves({
        currentIndex: 0,
        entries: [{url: 'http://example.com'}],
        getError: () => null,
      } as unknown as Protocol.Page.GetNavigationHistoryResponse);
      Root.Runtime.experiments.register('dualScreenSupport', 'Emulation: Support dual screen mode', undefined, '');
      sinon.stub(Common.Settings.Settings, 'instance').returns({
        createSetting: () => ({
          get: () => [],
          set: () => {},
          addChangeListener: () => {},
          removeChangeListener: () => {},
          setDisabled: () => {},
        }),
        moduleSetting: () => ({
          get: () => [],
          set: () => {},
          addChangeListener: () => {},
          removeChangeListener: () => {},
          setDisabled: () => {},
        }),
      } as unknown as Common.Settings.Settings);
    });

    it('waits for main taget to load', async () => {
      const protocolService = new LighthouseModule.LighthouseProtocolService.ProtocolService();
      sinon.stub(protocolService, 'attach').resolves();
      sinon.stub(protocolService, 'detach').resolves();
      const controller = new LighthouseModule.LighthouseController.LighthouseController(protocolService);
      LighthouseModule.LighthousePanel.LighthousePanel.instance({forceNew: true, protocolService, controller});

      controller.dispatchEventToListeners(LighthouseModule.LighthouseController.Events.RequestLighthouseStart, true);
      sinon.stub(protocolService, 'collectLighthouseResults')
          .callsFake(async () => ({
                       lhr: {
                         finalDisplayedUrl: '',
                         configSettings: {},
                         audits: {},
                         categories: {},
                         lighthouseVersion: '',
                         userAgent: '',
                         fetchTime: 0,
                         environment: {benchmarkIndex: 0},
                         i18n: {rendererFormattedStrings: {}},
                       },
                     } as unknown as Lighthouse.LighthouseReporterTypes.RunnerResult));
      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      sinon.stub(resourceTreeModel, 'addEventListener')
          .callThrough()
          .withArgs(SDK.ResourceTreeModel.Events.Load, sinon.match.any)
          .callsArgWithAsync(1, {resourceTreeModel, loadTime: 0})
          .returns({} as Common.EventTarget.EventDescriptor);

      await new Promise<Element>(
          resolve =>
              sinon.stub(LighthouseModule.LighthouseReportRenderer.LighthouseReportRenderer, 'linkifyNodeDetails')
                  .callsFake(async (el: Element) => {
                    resolve(el);
                  }));
    });
  };

  describe('attach/detach without tab taget', () => waitForTargetLoad(() => createTarget()));
  describe('attach/detach with tab taget', () => waitForTargetLoad(() => {
                                             const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                                             createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                                             return createTarget({parentTarget: tabTarget});
                                           }));
});
