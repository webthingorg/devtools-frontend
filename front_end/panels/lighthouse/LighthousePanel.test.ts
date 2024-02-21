// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {createTarget, stubNoopSettings} from '../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../../test/unittests/front_end/helpers/MockConnection.js';
import type * as Common from '../../core/common/common.js';
import {assertNotNullOrUndefined} from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';

import * as Lighthouse from './lighthouse.js';

describeWithMockConnection('LighthousePanel', async () => {
  const tests = (targetFactory: () => SDK.Target.Target) => {
    let target: SDK.Target.Target;
    let resourceTreeModelNavigate: sinon.SinonStub;
    let protocolService: Lighthouse.LighthouseProtocolService.ProtocolService;
    let controller: Lighthouse.LighthouseController.LighthouseController;

    const URL = 'http://example.com';
    const LH_REPORT = {
      lhr: {
        finalDisplayedUrl: URL,
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
      target = targetFactory();
      sinon.stub(target.pageAgent(), 'invoke_getNavigationHistory').resolves({
        currentIndex: 0,
        entries: [{url: URL}],
        getError: () => null,
      } as unknown as Protocol.Page.GetNavigationHistoryResponse);

      const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      assertNotNullOrUndefined(resourceTreeModel);
      resourceTreeModelNavigate = sinon.stub(resourceTreeModel, 'navigate').resolves();
      sinon.stub(resourceTreeModel, 'addEventListener')
          .callThrough()
          .withArgs(SDK.ResourceTreeModel.Events.Load, sinon.match.any)
          .callsArgWithAsync(1, {resourceTreeModel, loadTime: 0})
          .returns({} as Common.EventTarget.EventDescriptor);

      protocolService = new Lighthouse.LighthouseProtocolService.ProtocolService();
      sinon.stub(protocolService, 'attach').resolves();
      sinon.stub(protocolService, 'detach').resolves();
      sinon.stub(protocolService, 'collectLighthouseResults').resolves(LH_REPORT);

      controller = new Lighthouse.LighthouseController.LighthouseController(protocolService);

      stubNoopSettings();
    });

    it('restores the original URL when done', async () => {
      const instance =
          Lighthouse.LighthousePanel.LighthousePanel.instance({forceNew: true, protocolService, controller});
      void instance.handleCompleteRun();

      await new Promise<void>(resolve => resourceTreeModelNavigate.withArgs(URL).callsFake(() => {
        resolve();
        return Promise.resolve();
      }));
    });

    it('waits for main taget to load before linkifying', async () => {
      const instance =
          Lighthouse.LighthousePanel.LighthousePanel.instance({forceNew: true, protocolService, controller});
      void instance.handleCompleteRun();

      await new Promise<void>(
          resolve => sinon.stub(Lighthouse.LighthouseReportRenderer.LighthouseReportRenderer, 'linkifyNodeDetails')
                         .callsFake((_: Element) => {
                           resolve();
                           return Promise.resolve();
                         }));
    });
  };

  describe('without tab taget', () => tests(() => createTarget()));
  describe('with tab taget', () => tests(() => {
                               const tabTarget = createTarget({type: SDK.Target.Type.Tab});
                               createTarget({parentTarget: tabTarget, subtype: 'prerender'});
                               return createTarget({parentTarget: tabTarget});
                             }));
});
