// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Lighthouse from '../../../../../front_end/panels/lighthouse/lighthouse.js';
import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import type * as Common from '../../../../../front_end/core/common/common.js';
import * as Root from '../../../../../front_end/core/root/root.js';
import type * as Protocol from '../../../../../front_end/generated/protocol.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import {createTarget, stubNoopSettings} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('LighthousePanel', async () => {
  const waitForTargetLoad = (targetFactory: () => SDK.Target.Target) => {
    let target: SDK.Target.Target;
    let LighthouseModule: typeof Lighthouse;

    const LH_REPORT = {
      lhr: {
        finalDisplayedUrl: '',
        configSettings: {},
        audits: {},
        categories: {_: {auditRefs: [], id: ''}},
        lighthouseVersion: '',
        userAgent: '',
        fetchTime: 0,
        environment: {benchmarkIndex: 0},
        i18n: {rendererFormattedStrings: {}},
      },
    } as unknown as Lighthouse.LighthouseReporterTypes.RunnerResult;

    beforeEach(async () => {
      // @ts-ignore layout test global
      self.UI = self.UI || {};
      // @ts-ignore layout test global
      self.UI.panels = self.UI.panels || {};
      LighthouseModule = await import('../../../../../front_end/panels/lighthouse/lighthouse.js');
      target = targetFactory();
      Root.Runtime.experiments.register('dualScreenSupport', 'Emulation: Support dual screen mode', undefined, '');
      stubNoopSettings();
    });

    it('waits for main taget to load before linkifying', async () => {
      sinon.stub(target.pageAgent(), 'invoke_getNavigationHistory').resolves({
        currentIndex: 0,
        entries: [{url: 'http://example.com'}],
        getError: () => null,
      } as unknown as Protocol.Page.GetNavigationHistoryResponse);

      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      sinon.stub(resourceTreeModel, 'navigate').resolves();
      sinon.stub(resourceTreeModel, 'addEventListener')
          .callThrough()
          .withArgs(SDK.ResourceTreeModel.Events.Load, sinon.match.any)
          .callsArgWithAsync(1, {resourceTreeModel, loadTime: 0})
          .returns({} as Common.EventTarget.EventDescriptor);

      const protocolService = new LighthouseModule.LighthouseProtocolService.ProtocolService();
      sinon.stub(protocolService, 'attach').resolves();
      sinon.stub(protocolService, 'detach').resolves();
      sinon.stub(protocolService, 'collectLighthouseResults').resolves(LH_REPORT);

      const controller = new LighthouseModule.LighthouseController.LighthouseController(protocolService);

      LighthouseModule.LighthousePanel.LighthousePanel.instance({forceNew: true, protocolService, controller});

      controller.dispatchEventToListeners(LighthouseModule.LighthouseController.Events.RequestLighthouseStart, true);

      await new Promise<void>(
          resolve =>
              sinon.stub(LighthouseModule.LighthouseReportRenderer.LighthouseReportRenderer, 'linkifyNodeDetails')
                  .callsFake((_: Element) => {
                    resolve();
                    return Promise.resolve();
                  }));
    });
  };

  describe('attach/detach without tab taget', () => waitForTargetLoad(() => createTarget()));
  describe('attach/detach with tab taget', () => waitForTargetLoad(() => {
                                             const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                                             const frameTarget = createTarget({parentTarget: tabTarget});
                                             createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                                             return frameTarget;
                                           }));
});
