// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Platform from '../platform/platform.js';

import {type FrameAssociated} from './FrameAssociated.js';

import {Type, type Target} from './Target.js';
import {Events as TargetManagerEvents, TargetManager} from './TargetManager.js';

import {PageResourceLoader, type PageResourceLoadInitiator} from './PageResourceLoader.js';

import {parseSourceMap, SourceMap} from './SourceMap.js';

export class SourceMapManager<T extends FrameAssociated> extends Common.ObjectWrapper.ObjectWrapper<EventTypes<T>> {
  readonly #target: Target;
  #isEnabled: boolean;
  readonly #clientData: Map<T, ClientData>;
  readonly #sourceMaps: Map<SourceMap, T>;

  constructor(target: Target) {
    super();

    this.#target = target;
    this.#isEnabled = true;
    this.#clientData = new Map();
    this.#sourceMaps = new Map();

    TargetManager.instance().addEventListener(TargetManagerEvents.InspectedURLChanged, this.inspectedURLChanged, this);
  }

  setEnabled(isEnabled: boolean): void {
    if (isEnabled === this.#isEnabled) {
      return;
    }

    // We need this copy, because `this.#clientData` is getting modified
    // in the loop body and trying to iterate over it at the same time
    // leads to an infinite loop.
    const clientData = [...this.#clientData.entries()];
    for (const [client] of clientData) {
      this.detachSourceMap(client);
    }
    this.#isEnabled = isEnabled;
    for (const [client, {relativeSourceURL, relativeSourceMapURL}] of clientData) {
      this.attachSourceMap(client, relativeSourceURL, relativeSourceMapURL);
    }
  }

  private static getBaseUrl(target: Target|null): Platform.DevToolsPath.UrlString {
    while (target && target.type() !== Type.Frame) {
      target = target.parentTarget();
    }
    return target?.inspectedURL() ?? Platform.DevToolsPath.EmptyUrlString;
  }

  static resolveRelativeSourceURL(target: Target|null, url: Platform.DevToolsPath.UrlString):
      Platform.DevToolsPath.UrlString {
    url = Common.ParsedURL.ParsedURL.completeURL(SourceMapManager.getBaseUrl(target), url) ?? url;
    return url;
  }

  private inspectedURLChanged(event: Common.EventTarget.EventTargetEvent<Target>): void {
    if (event.data !== this.#target) {
      return;
    }

    // We need this copy, because `this.#clientData` is getting modified
    // in the loop body and trying to iterate over it at the same time
    // leads to an infinite loop.
    const clientData = [...this.#clientData.entries()];
    for (const [client, {relativeSourceURL, relativeSourceMapURL}] of clientData) {
      this.detachSourceMap(client);
      this.attachSourceMap(client, relativeSourceURL, relativeSourceMapURL);
    }
  }

  sourceMapForClient(client: T): SourceMap|undefined {
    return this.#clientData.get(client)?.sourceMap;
  }

  // This method actively awaits the source map, if still loading.
  sourceMapForClientPromise(client: T): Promise<SourceMap|undefined> {
    const clientData = this.#clientData.get(client);
    if (!clientData) {
      return Promise.resolve(undefined);
    }

    return clientData.sourceMapPromise;
  }

  clientForSourceMap(sourceMap: SourceMap): T|undefined {
    return this.#sourceMaps.get(sourceMap);
  }

  // TODO(bmeurer): We are lying about the type of |relativeSourceURL| here.
  attachSourceMap(
      client: T, relativeSourceURL: Platform.DevToolsPath.UrlString, relativeSourceMapURL: string|undefined,
      acceptOutOfBoundsCallback?: () => Promise<boolean>): void {
    if (this.#clientData.has(client)) {
      throw new Error('SourceMap is already attached or being attached to client');
    }
    if (!relativeSourceMapURL) {
      return;
    }

    const clientData: ClientData = {
      relativeSourceURL,
      relativeSourceMapURL,
      sourceMap: undefined,
      sourceMapPromise: Promise.resolve(undefined),
    };
    if (this.#isEnabled) {
      // The `// #sourceURL=foo` can be a random string, but is generally an absolute path.
      // Complete it to inspected page url for relative links.
      const sourceURL = SourceMapManager.resolveRelativeSourceURL(this.#target, relativeSourceURL);
      const sourceMapURL = Common.ParsedURL.ParsedURL.completeURL(sourceURL, relativeSourceMapURL);
      if (sourceMapURL) {
        this.dispatchEventToListeners(Events.SourceMapWillAttach, {client});

        const initiator = client.createPageResourceLoadInitiator();
        clientData.sourceMapPromise =
            this.#loadSourceMap(sourceURL, sourceMapURL, initiator, client, acceptOutOfBoundsCallback)
                .then(
                    sourceMap => {
                      if (this.#clientData.get(client) === clientData) {
                        clientData.sourceMap = sourceMap;
                        this.#sourceMaps.set(sourceMap, client);
                        this.dispatchEventToListeners(Events.SourceMapAttached, {client, sourceMap});
                      }
                      return sourceMap;
                    },
                    error => {
                      Common.Console.Console.instance().warn(`DevTools failed to load source map: ${error.message}`);
                      if (this.#clientData.get(client) === clientData) {
                        this.dispatchEventToListeners(Events.SourceMapFailedToAttach, {client});
                      }
                      return undefined;
                    });
      }
    }
    this.#clientData.set(client, clientData);
  }

  async #loadSourceMap(
      sourceURL: Platform.DevToolsPath.UrlString, sourceMapURL: Platform.DevToolsPath.UrlString,
      initiator: PageResourceLoadInitiator, client: T,
      acceptOutOfBoundsCallback?: () => Promise<boolean>): Promise<SourceMap> {
    let payload;
    try {
      const {content} = await PageResourceLoader.instance().loadResource(sourceMapURL, initiator);
      payload = parseSourceMap(content);
    } catch (cause) {
      throw new Error(`Could not load content for ${sourceMapURL}: ${cause.message}`, {cause});
    }
    const sourceMap = new SourceMap(sourceURL, sourceMapURL, payload);
    if (acceptOutOfBoundsCallback && !this.#sourceMapCompatibleWithClient(client, sourceMap)) {
      const acceptAnyways = await acceptOutOfBoundsCallback();
      if (!acceptAnyways) {
        throw new Error(`Source map at ${sourceMapURL} is incompatible, out-of-bounds mappings found.`);
      }
    }
    return sourceMap;
  }

  #sourceMapCompatibleWithClient(client: T, sourceMap: SourceMap): boolean {
    const mappings = sourceMap.mappings();
    if (mappings.length === 0) {
      return true;
    }
    const lastMapping = mappings[mappings.length - 1];
    const clientUrlPieces = client.sourceURL.split('/');
    const sourcemapFileUrlPieces = sourceMap.file?.split('/');
    return (!sourcemapFileUrlPieces ||
            clientUrlPieces[clientUrlPieces.length - 1] ===
                sourcemapFileUrlPieces[sourcemapFileUrlPieces.length - 1]) &&
        client.endLine >= lastMapping.lineNumber && client.endColumn >= lastMapping.columnNumber;
  }

  detachSourceMap(client: T): void {
    const clientData = this.#clientData.get(client);
    if (!clientData) {
      return;
    }
    this.#clientData.delete(client);
    if (!this.#isEnabled) {
      return;
    }
    const {sourceMap} = clientData;
    if (sourceMap) {
      this.#sourceMaps.delete(sourceMap);
      this.dispatchEventToListeners(Events.SourceMapDetached, {client, sourceMap});
    } else {
      this.dispatchEventToListeners(Events.SourceMapFailedToAttach, {client});
    }
  }

  dispose(): void {
    TargetManager.instance().removeEventListener(
        TargetManagerEvents.InspectedURLChanged, this.inspectedURLChanged, this);
  }
}

type ClientData = {
  relativeSourceURL: Platform.DevToolsPath.UrlString,
  // Stores the raw sourceMappingURL as provided by V8. These are not guaranteed to
  // be valid URLs and will be checked and resolved once `attachSourceMap` is called.
  relativeSourceMapURL: string,
  sourceMap: SourceMap|undefined,
  sourceMapPromise: Promise<SourceMap|undefined>,
};

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  SourceMapWillAttach = 'SourceMapWillAttach',
  SourceMapFailedToAttach = 'SourceMapFailedToAttach',
  SourceMapAttached = 'SourceMapAttached',
  SourceMapDetached = 'SourceMapDetached',
}

export type EventTypes<T extends FrameAssociated> = {
  [Events.SourceMapWillAttach]: {client: T},
  [Events.SourceMapFailedToAttach]: {client: T},
  [Events.SourceMapAttached]: {client: T, sourceMap: SourceMap},
  [Events.SourceMapDetached]: {client: T, sourceMap: SourceMap},
};
