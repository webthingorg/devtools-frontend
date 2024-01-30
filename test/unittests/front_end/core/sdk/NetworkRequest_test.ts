// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {expectCookie} from '../../helpers/Cookies.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection, setMockConnectionResponseHandler} from '../../helpers/MockConnection.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';

describe('NetworkRequest', () => {
  it('can parse statusText from the first line of responseReceivedExtraInfo\'s headersText', () => {
    assert.strictEqual(
        SDK.NetworkRequest.NetworkRequest.parseStatusTextFromResponseHeadersText('HTTP/1.1 304 not modified'),
        'not modified');
    assert.strictEqual(
        SDK.NetworkRequest.NetworkRequest.parseStatusTextFromResponseHeadersText('HTTP/1.1 200 OK'), 'OK');
    assert.strictEqual(
        SDK.NetworkRequest.NetworkRequest.parseStatusTextFromResponseHeadersText('HTTP/1.1 200 OK\r\n\r\nfoo: bar\r\n'),
        'OK');
  });

  it('parses reponse cookies from headers', () => {
    const request = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'requestId', 'url' as Platform.DevToolsPath.UrlString, 'documentURL' as Platform.DevToolsPath.UrlString, null);
    request.addExtraResponseInfo({
      blockedResponseCookies: [],
      responseHeaders: [{name: 'Set-Cookie', value: 'foo=bar'}, {name: 'Set-Cookie', value: 'baz=qux'}],
      resourceIPAddressSpace: 'Public' as Protocol.Network.IPAddressSpace,
    } as unknown as SDK.NetworkRequest.ExtraResponseInfo);
    assert.strictEqual(request.responseCookies.length, 2);
    expectCookie(request.responseCookies[0], {name: 'foo', value: 'bar', size: 8});
    expectCookie(request.responseCookies[1], {name: 'baz', value: 'qux', size: 7});
  });

  it('infers status text from status code if none given', () => {
    const fakeRequest = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'fakeRequestId',
        'url1' as Platform.DevToolsPath.UrlString,
        'documentURL' as Platform.DevToolsPath.UrlString,
        null,
    );
    fakeRequest.statusCode = 200;

    assert.strictEqual(fakeRequest.statusText, '');
    assert.strictEqual(fakeRequest.getInferredStatusText(), 'OK');
  });

  it('does not infer status text from unknown status code', () => {
    const fakeRequest = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'fakeRequestId',
        'url1' as Platform.DevToolsPath.UrlString,
        'documentURL' as Platform.DevToolsPath.UrlString,
        null,
    );
    fakeRequest.statusCode = 999;

    assert.strictEqual(fakeRequest.statusText, '');
    assert.strictEqual(fakeRequest.getInferredStatusText(), '');
  });

  it('infers status text only when no status text given', () => {
    const fakeRequest = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'fakeRequestId',
        'url1' as Platform.DevToolsPath.UrlString,
        'documentURL' as Platform.DevToolsPath.UrlString,
        null,
    );
    fakeRequest.statusCode = 200;
    fakeRequest.statusText = 'Prefer me';

    assert.strictEqual(fakeRequest.statusText, 'Prefer me');
    assert.strictEqual(fakeRequest.getInferredStatusText(), 'Prefer me');
  });

  it('includes partition key in response cookies', () => {
    const request = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'requestId', 'url' as Platform.DevToolsPath.UrlString, 'documentURL' as Platform.DevToolsPath.UrlString, null);
    request.addExtraResponseInfo({
      blockedResponseCookies: [],
      responseHeaders:
          [{name: 'Set-Cookie', value: 'foo=bar'}, {name: 'Set-Cookie', value: 'baz=qux; Secure;Partitioned'}],
      resourceIPAddressSpace: 'Public' as Protocol.Network.IPAddressSpace,
      cookiePartitionKey: 'partitionKey',
    } as unknown as SDK.NetworkRequest.ExtraResponseInfo);
    assert.strictEqual(request.responseCookies.length, 2);
    expectCookie(request.responseCookies[0], {name: 'foo', value: 'bar', size: 8});
    expectCookie(
        request.responseCookies[1], {name: 'baz', value: 'qux', secure: true, partitionKey: 'partitionKey', size: 27});
  });

  it('determines whether the response headers have been overridden', () => {
    const request = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'requestId', 'url' as Platform.DevToolsPath.UrlString, 'documentURL' as Platform.DevToolsPath.UrlString, null);
    request.responseHeaders = [{name: 'foo', value: 'bar'}];

    request.originalResponseHeaders = [{name: 'foo', value: 'baz'}];
    assert.isTrue(request.hasOverriddenHeaders());

    request.originalResponseHeaders = [];
    assert.isFalse(request.hasOverriddenHeaders());

    request.originalResponseHeaders = [{name: 'Foo', value: 'bar'}];
    assert.isFalse(request.hasOverriddenHeaders());

    request.originalResponseHeaders = [{name: 'Foo', value: 'Bar'}];
    assert.isTrue(request.hasOverriddenHeaders());

    request.responseHeaders = [{name: 'one', value: 'first'}, {name: 'two', value: 'second'}];
    request.originalResponseHeaders = [{name: 'ONE', value: 'first'}, {name: 'Two', value: 'second'}];
    assert.isFalse(request.hasOverriddenHeaders());

    request.originalResponseHeaders = [{name: 'one', value: 'first'}];
    assert.isTrue(request.hasOverriddenHeaders());

    request.originalResponseHeaders = [{name: 'two', value: 'second'}, {name: 'one', value: 'first'}];
    assert.isFalse(request.hasOverriddenHeaders());

    request.originalResponseHeaders = [{name: 'one', value: 'second'}, {name: 'two', value: 'first'}];
    assert.isTrue(request.hasOverriddenHeaders());

    request.originalResponseHeaders =
        [{name: 'one', value: 'first'}, {name: 'two', value: 'second'}, {name: 'two', value: 'second'}];
    assert.isTrue(request.hasOverriddenHeaders());
  });

  it('considers duplicate headers which only differ in the order of their values as overridden', () => {
    const request = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'requestId', 'url' as Platform.DevToolsPath.UrlString, 'documentURL' as Platform.DevToolsPath.UrlString, null);
    request.responseHeaders = [{name: 'duplicate', value: 'first'}, {name: 'duplicate', value: 'second'}];
    request.originalResponseHeaders = [{name: 'duplicate', value: 'second'}, {name: 'duplicate', value: 'first'}];
    assert.isTrue(request.hasOverriddenHeaders());
  });

  it('can handle the case of duplicate cookies with only 1 of them being blocked', async () => {
    const request = SDK.NetworkRequest.NetworkRequest.create(
        'requestId' as Protocol.Network.RequestId, 'url' as Platform.DevToolsPath.UrlString,
        'documentURL' as Platform.DevToolsPath.UrlString, null, null, null);
    request.addExtraResponseInfo({
      responseHeaders: [{name: 'Set-Cookie', value: 'foo=duplicate; Path=/\nfoo=duplicate; Path=/'}],
      blockedResponseCookies: [{
        blockedReasons: [Protocol.Network.SetCookieBlockedReason.SameSiteNoneInsecure],
        cookie: null,
        cookieLine: 'foo=duplicate; Path=/',
      }],
      resourceIPAddressSpace: Protocol.Network.IPAddressSpace.Public,
      statusCode: undefined,
      cookiePartitionKey: undefined,
      cookiePartitionKeyOpaque: undefined,
    });

    assert.deepEqual(
        request.responseCookies.map(cookie => cookie.getCookieLine()),
        ['foo=duplicate; Path=/', 'foo=duplicate; Path=/']);
    assert.deepEqual(request.blockedResponseCookies(), [{
                       blockedReasons: [Protocol.Network.SetCookieBlockedReason.SameSiteNoneInsecure],
                       cookie: null,
                       cookieLine: 'foo=duplicate; Path=/',
                     }]);
    assert.deepEqual(
        request.nonBlockedResponseCookies().map(cookie => cookie.getCookieLine()), ['foo=duplicate; Path=/']);
  });

  it('preserves order of headers in case of duplicates', () => {
    const request = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'requestId', 'url' as Platform.DevToolsPath.UrlString, 'documentURL' as Platform.DevToolsPath.UrlString, null);
    const responseHeaders = [{name: '1ab', value: 'middle'}, {name: '1aB', value: 'last'}];
    request.addExtraResponseInfo({
      blockedResponseCookies: [],
      responseHeaders,
      resourceIPAddressSpace: 'Public' as Protocol.Network.IPAddressSpace,
    } as unknown as SDK.NetworkRequest.ExtraResponseInfo);
    assert.deepEqual(request.sortedResponseHeaders, responseHeaders);
  });

  it('treats multiple headers with the same name the same as single header with comma-separated values', () => {
    const request = SDK.NetworkRequest.NetworkRequest.createWithoutBackendRequest(
        'requestId', 'url' as Platform.DevToolsPath.UrlString, 'documentURL' as Platform.DevToolsPath.UrlString, null);
    request.responseHeaders = [{name: 'duplicate', value: 'first, second'}];
    request.originalResponseHeaders = [{name: 'duplicate', value: 'first'}, {name: 'duplicate', value: 'second'}];
    assert.isFalse(request.hasOverriddenHeaders());
  });
});

describeWithMockConnection('NetworkRequest', () => {
  let networkManagerForRequestStub: sinon.SinonStub;
  let cookie: SDK.Cookie.Cookie;
  let addBlockedCookieSpy: sinon.SinonSpy;
  let networkDispatcher: SDK.NetworkManager.NetworkDispatcher;

  beforeEach(() => {
    const target = createTarget();
    const networkManager = target.model(SDK.NetworkManager.NetworkManager);
    networkDispatcher = new SDK.NetworkManager.NetworkDispatcher(networkManager as SDK.NetworkManager.NetworkManager);
    networkManagerForRequestStub = sinon.stub(SDK.NetworkManager.NetworkManager, 'forRequest').returns(networkManager);
    cookie = new SDK.Cookie.Cookie('name', 'value');
    const cookieModel = target.model(SDK.CookieModel.CookieModel);
    Platform.assertNotNullOrUndefined(cookieModel);
    addBlockedCookieSpy = sinon.spy(cookieModel, 'addBlockedCookie');
  });

  afterEach(() => {
    networkManagerForRequestStub.restore();
  });

  it('adds blocked response cookies to cookieModel', () => {
    const request = SDK.NetworkRequest.NetworkRequest.create(
        'requestId' as Protocol.Network.RequestId, 'url' as Platform.DevToolsPath.UrlString,
        'documentURL' as Platform.DevToolsPath.UrlString, null, null, null);

    request.addExtraResponseInfo({
      responseHeaders: [{name: 'Set-Cookie', value: 'name=value; Path=/'}],
      blockedResponseCookies: [{
        blockedReasons: [Protocol.Network.SetCookieBlockedReason.ThirdPartyPhaseout],
        cookie,
        cookieLine: 'name=value; Path=/',
      }],
      resourceIPAddressSpace: Protocol.Network.IPAddressSpace.Public,
      statusCode: undefined,
      cookiePartitionKey: undefined,
      cookiePartitionKeyOpaque: undefined,
    });
    assert.isTrue(addBlockedCookieSpy.calledOnceWith(
        cookie, [{
          attribute: null,
          uiString: 'Setting this cookie was blocked due to third-party cookie phaseout. Learn more in the Issues tab.',
        }]));
  });

  it('adds blocked request cookies to cookieModel', () => {
    const requestWillBeSentEvent = {requestId: 'requestId', request: {url: 'example.com'}} as
        Protocol.Network.RequestWillBeSentEvent;
    networkDispatcher.requestWillBeSent(requestWillBeSentEvent);

    const request = networkDispatcher.requestForId('requestId');
    Platform.assertNotNullOrUndefined(request);
    request.addExtraRequestInfo({
      blockedRequestCookies: [{blockedReasons: [Protocol.Network.CookieBlockedReason.SameSiteLax], cookie}],
      requestHeaders: [],
      includedRequestCookies: [],
      connectTiming: {requestTime: 42},
    });

    networkDispatcher.loadingFinished(
        {requestId: 'requestId' as Protocol.Network.RequestId, timestamp: 42, encodedDataLength: 42});
    assert.isTrue(addBlockedCookieSpy.calledOnceWith(cookie, [
      {
        attribute: SDK.Cookie.Attribute.SameSite,
        uiString:
            'This cookie was blocked because it had the "SameSite=Lax" attribute and the request was made from a different site and was not initiated by a top-level navigation.',
      },
    ]));
  });
});

describeWithMockConnection('ServerSentEvents', () => {
  let target: SDK.Target.Target;
  let networkManager: SDK.NetworkManager.NetworkManager;

  beforeEach(() => {
    target = createTarget();
    networkManager = target.model(SDK.NetworkManager.NetworkManager) as SDK.NetworkManager.NetworkManager;
  });

  it('sends EventSourceMessageAdded events for EventSource text/event-stream', () => {
    networkManager.dispatcher.requestWillBeSent({
      requestId: '1' as Protocol.Network.RequestId,
      request: {
        url: 'https://example.com/sse',
      },
      type: 'EventSource',
    } as Protocol.Network.RequestWillBeSentEvent);
    networkManager.dispatcher.responseReceived({
      requestId: '1' as Protocol.Network.RequestId,
      response: {
        url: 'https://example.com/sse',
        mimeType: 'text/event-stream',
      } as Protocol.Network.Response,
    } as Protocol.Network.ResponseReceivedEvent);
    const request = networkManager.requestForId('1');
    assertNotNullOrUndefined(request);

    const networkEvents: SDK.NetworkRequest.EventSourceMessage[] = [];
    request.addEventListener(SDK.NetworkRequest.Events.EventSourceMessageAdded, ({data}) => networkEvents.push(data));

    networkManager.dispatcher.eventSourceMessageReceived({
      requestId: '1' as Protocol.Network.RequestId,
      timestamp: 21,
      data: 'foo',
      eventId: 'fooId',
      eventName: 'fooName',
    });
    networkManager.dispatcher.eventSourceMessageReceived({
      requestId: '1' as Protocol.Network.RequestId,
      timestamp: 42,
      data: 'bar',
      eventId: 'barId',
      eventName: 'barName',
    });

    assert.lengthOf(networkEvents, 2);
    assert.deepStrictEqual(networkEvents[0], {data: 'foo', eventId: 'fooId', eventName: 'fooName', time: 21});
    assert.deepStrictEqual(networkEvents[1], {data: 'bar', eventId: 'barId', eventName: 'barName', time: 42});
  });

  it('sends EventSourceMessageAdded events for raw text/event-stream', async () => {
    setMockConnectionResponseHandler('Network.streamResourceContent', () => ({
                                                                        getError() {
                                                                          return undefined;
                                                                        },
                                                                        bufferedData: '',
                                                                      }));
    networkManager.dispatcher.requestWillBeSent({
      requestId: '1' as Protocol.Network.RequestId,
      request: {
        url: 'https://example.com/sse',
      },
      type: 'Fetch',
    } as Protocol.Network.RequestWillBeSentEvent);
    networkManager.dispatcher.responseReceived({
      requestId: '1' as Protocol.Network.RequestId,
      response: {
        url: 'https://example.com/sse',
        mimeType: 'text/event-stream',
      } as Protocol.Network.Response,
    } as Protocol.Network.ResponseReceivedEvent);
    const request = networkManager.requestForId('1');
    assertNotNullOrUndefined(request);

    const networkEvents: SDK.NetworkRequest.EventSourceMessage[] = [];
    const {promise: twoEventsReceivedPromise, resolve} = Platform.PromiseUtilities.promiseWithResolvers<void>();
    request.addEventListener(SDK.NetworkRequest.Events.EventSourceMessageAdded, ({data}) => {
      networkEvents.push(data);
      if (networkEvents.length === 2) {
        resolve();
      }
    });

    const message = `
id: fooId
event: fooName
data: foo

id: barId
event: barName
data: bar\n\n`;

    // Send `message` piecemeal via dataReceived events.
    let time = 0;
    for (const c of message) {
      networkManager.dispatcher.dataReceived({
        requestId: '1' as Protocol.Network.RequestId,
        dataLength: 1,
        encodedDataLength: 1,
        timestamp: time++,
        data: window.btoa(c),
      });
    }

    await twoEventsReceivedPromise;

    // Omit time from expectation as the dataReceived loop is racing against the text decoder.
    assert.lengthOf(networkEvents, 2);
    assert.deepInclude(networkEvents[0], {data: 'foo', eventId: 'fooId', eventName: 'fooName'});
    assert.deepInclude(networkEvents[1], {data: 'bar', eventId: 'barId', eventName: 'barName'});
  });
});
