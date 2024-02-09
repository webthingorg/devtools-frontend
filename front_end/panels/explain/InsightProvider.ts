// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../core/host/host.js';
import * as Platform from '../../core/platform/platform.js';
import * as Root from '../../core/root/root.js';

export interface AidaRequest {
  input: string;
  client: string;
  options?: {
    temperature?: Number,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    model_id?: string,
  };
}

export class InsightProvider {
  static buildApiRequest(input: string): AidaRequest {
    const request: AidaRequest = {
      input,
      client: 'CHROME_DEVTOOLS',
    };
    const temperature = parseFloat(Root.Runtime.Runtime.queryParam('aidaTemperature') || '');
    if (!isNaN(temperature)) {
      request.options ??= {};
      request.options.temperature = temperature;
    }
    const modelId = Root.Runtime.Runtime.queryParam('aidaModelId');
    if (modelId) {
      request.options ??= {};
      request.options.model_id = modelId;
    }
    return request;
  }

  async * getInsights(input: string): AsyncGenerator<string, void, void> {
    if (!Host.InspectorFrontendHost.InspectorFrontendHostInstance.doAidaConversation) {
      throw new Error('doAidaConversation is not available');
    }
    console.time('request');
    const stream = (() => {
      let {promise, resolve} = Platform.PromiseUtilities.promiseWithResolvers<string|null>();
      return {
        write: async(data: string): Promise<void> => {
          resolve(data);
          ({promise, resolve} = Platform.PromiseUtilities.promiseWithResolvers<string|null>());
        },
        close: async(): Promise<void> => {
          resolve(null);
        },
        read: (): Promise<string|null> => {
          return promise;
        },
      };
    })();
    const streamId = Host.ResourceLoader.bindOutputStream(stream);
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.doAidaConversation(
        JSON.stringify(InsightProvider.buildApiRequest(input)), streamId, result => {
          void stream.close();
          if (result.statusCode === 403) {
            throw new Error('Server responded: permission denied');
          }
          if (result.error) {
            throw new Error(`Cannot send request: ${result.error} ${result.detail || ''}`);
          }
          if (result.statusCode !== 200) {
            throw new Error(`Request failed: ${JSON.stringify(result)}`);
          }
        });
    let chunk;
    const text = [];
    let inCodeChunk = false;
    while ((chunk = await stream.read())) {
      if (chunk.endsWith(']')) {
        chunk = chunk.slice(0, -1);
      }
      if (chunk.startsWith(',') || chunk.startsWith('[')) {
        chunk = chunk.slice(1);
      }
      if (!chunk.length) {
        continue;
      }
      const result = JSON.parse(chunk);
      const CODE_CHUNK_SEPARATOR = '\n`````\n';
      if ('textChunk' in result) {
        if (inCodeChunk) {
          text.push(CODE_CHUNK_SEPARATOR);
          inCodeChunk = false;
        }
        text.push(result.textChunk.text);
      } else if ('codeChunk' in result) {
        if (!inCodeChunk) {
          text.push(CODE_CHUNK_SEPARATOR);
          inCodeChunk = true;
        }
        text.push(result.codeChunk.code);
      } else if ('error' in result) {
        throw new Error(`Server responded: ${JSON.stringify(result)}`);
      } else {
        throw new Error('Unknown chunk result');
      }
      yield text.join('') + (inCodeChunk ? CODE_CHUNK_SEPARATOR : '');
    }
  }
}
