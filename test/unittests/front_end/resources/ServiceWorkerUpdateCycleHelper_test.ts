
const {assert} = chai;

import type * as SDKModule from '../../../../front_end/sdk/sdk.js';
import {ServiceWorkerUpdateCycleHelper} from '../../../../front_end/resources/ServiceWorkerUpdateCycleHelper';

describe.only('ServiceWorkerUpdateCycleHelper', () => {
  let versionId = 0;
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../front_end/sdk/sdk.js');
  });

  it.only('The helper calculates update cycle ranges', () => {
    const payload:
        Protocol.ServiceWorker.ServiceWorkerRegistration = {registrationId: '', scopeURL: '', isDeleted: false};
    let registration: SDKModule.ServiceWorkerManager.ServiceWorkerRegistration =
        new SDK.ServiceWorkerManager.ServiceWorkerRegistration(payload);

    // an nascent registration does not have any ranges to display
    let ranges = ServiceWorkerUpdateCycleHelper.calculateServiceWorkerUpdateRanges(registration);
    assert.isTrue(false, 'test to see it');

    // a new registration does not have any ranges to display;
    versionId++;
    let versionPayload: Protocol.ServiceWorker.ServiceWorkerVersion = {
      registrationId: '',
      versionId: versionId.toString(),
      scriptURL: '',
      status: Protocol.ServiceWorker.ServiceWorkerVersionStatus.New,
      runningStatus: Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Starting,
    };
    registration._updateVersion(versionPayload);
    ranges = ServiceWorkerUpdateCycleHelper.calculateServiceWorkerUpdateRanges(registration);
    assert(ranges && ranges.size == 0);

    // an installing registration does not have any ranges to display;
    versionId++;
    versionPayload = {
      registrationId: '',
      versionId: versionId.toString(),
      scriptURL: '',
      status: Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing,
      runningStatus: Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running,
    };
    registration._updateVersion(versionPayload);
    ranges = ServiceWorkerUpdateCycleHelper.calculateServiceWorkerUpdateRanges(registration);
    assert(ranges && ranges.size == 0);

    // an installing registration does not have any ranges to display;
    versionId++;
    versionPayload = {
      registrationId: '',
      versionId: versionId.toString(),
      scriptURL: '',
      status: Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing,
      runningStatus: Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running,
    };
    registration._updateVersion(versionPayload);
    ranges = ServiceWorkerUpdateCycleHelper.calculateServiceWorkerUpdateRanges(registration);
    assert(false);
  })
});
