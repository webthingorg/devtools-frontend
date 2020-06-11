/**
 * Copyright (c) Microsoft Corp.
 * Licensed under the MIT License.
 */


import { NCNativeReader as NCReader } from 'network-console-shared/collections/native/native-file-format';
import { default as SwaggerReader } from 'network-console-shared/collections/openapi/openapi-file-format';
import { Postman21NativeReader as P21NativeReader } from 'network-console-shared/collections/postman/v2.1/postman-2.1-file-format';
import { tryReadCollection } from 'network-console-shared/collections/shared/reader';
import { tryReadEnvironment } from 'network-console-shared/environments';
import { serializeNativeEnvironment } from 'network-console-shared/environments/native/native-env-format';

export { FrontendMessage, IConsoleReadyMessage, IExecuteRequestMessage, ILogMessage, IOpenWebLinkMessage, ISaveCollectionAuthorizationMessage, ISaveEnvironmentVariablesMessage, ISaveRequestMessage, IUpdateDirtyFlagMessage, } from 'network-console-shared/hosting/frontend-messages';
export { HostMessage, IClearEnvironmentMessage, ICloseViewMessage, ICssStylesUpdatedMessage, IEditCollectionAuthorizationMessage, IEditEnvironmentMessage, IHostCollection, IInitHostMessage, ILoadRequestMessage, IRequestCompleteMessage, ISetPreferencesMessage, IShowViewMessage, isResponseMessage, IUpdateCollectionsTreeMessage, IUpdateEnvironmentMessage, } from 'network-console-shared/hosting/host-messages';
export { CacheMode, CorsMode, CredentialsMode, HttpAuthorizationScheme, IBasicAuthorization, IFetchParams, IHttpAuthorization, IHttpHeader, IHttpRequest, IHttpResponse, ISerializableHttpBody, RedirectMode, } from 'network-console-shared/net/http-base';
export { IFormDataParameter, INetConsoleAuthorization, INetConsoleParameter, INetConsoleRequest, INetConsoleResponse, isFormDataParameter, ms, NetworkConsoleAuthorizationScheme, ResponseStatus, } from 'network-console-shared/net/net-console-http';
export { HttpVerb } from 'network-console-shared/net/verb';
export { Base64String, binFromB64, binToB64, strFromB64, toB64, } from 'network-console-shared/util/base64';
export { default as lazy , Lazy} from 'network-console-shared/util/lazy';           

export declare namespace Collections {
    const Postman21NativeReader: typeof P21NativeReader;
    const NCNativeReader: typeof NCReader;
    const SwaggerFileFormatReader: typeof SwaggerReader;
    const tryReadCollectionAsync: typeof tryReadCollection;
}
export declare namespace Environments {
    const tryReadEnvironmentAsync: typeof tryReadEnvironment;
    const serializeNativeEnvironmentFormat: typeof serializeNativeEnvironment;
}
export { CollectionItemType, ICollectionEntryReader, ICollectionFolderReader, ICollectionItemBase, ICollectionRootReader, ICollectionsReader, } from 'network-console-shared/collections/shared/reader';
export { EnvironmentItemType, IEnvironment, IEnvironmentRoot, } from 'network-console-shared/environments';


export as namespace NCShared;
