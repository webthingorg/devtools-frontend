// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 *
 * @param {string} verb
 * @param {string} url
 * @param {!Array<!NCShared.IHttpHeader>} headers
 * @param {!Partial<!NCShared.IFetchParams>|undefined} fetchParams
 * @param {string} base64BodyContent
 * @return {string}
 */
export function composeRequestScript(verb, url, headers, fetchParams, base64BodyContent) {
  // TODO: Consider revising this implementation.
  // https://github.com/microsoft/edge-devtools-network-console/issues/8
  const body = `(async () => {
    function abToB64(ab) {
      return new Promise((resolve, reject) => {
        const blob = new Blob([ab]);
        const reader = new FileReader();
        reader.onload = event => {
          const encoded = event.target.result;
          const leadPos = encoded.indexOf('base64,');
          if (leadPos === -1) {
            return reject('Failed to base64 encode arraybuffer.');
          }
          resolve(encoded.substr(leadPos + 'base64,'.length));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    async function b64ToBlob(b64) {
      const constructed = \`data:application/octet-stream;base64,\${b64}\`;
      const result = await fetch(constructed);
      return await result.blob();
    }
    async function bodyFromResponse(response) {
      const result = await response.arrayBuffer();
      const size = result.byteLength;
      let content = '';
      if (size) {
        content = await abToB64(result);
      }
      return { size, content };
    }
    function parseHeaders(headers) {
      const result = [];
      headers.forEach((value, key) => {
        result.push({ key, value });
      });
      return result;
    }

    const headers = new Headers();
    ${formatHeaders(headers)}

    const request = new Request(
      '${escapeSingleQuotes(url)}',
      {
        method: '${escapeSingleQuotes(verb)}',
        mode: '${(fetchParams && fetchParams.corsMode) || 'cors'}',
        cache: '${(fetchParams && fetchParams.cacheMode) || 'no-store'}',
        redirect: '${(fetchParams && fetchParams.redirectMode) || 'follow'}',
        credentials: '${(fetchParams && fetchParams.credentialsMode) || 'same-origin'}',
        referrer: '',
        headers,${formatOptionalRequestParameters(base64BodyContent)}
      },
    );
    const start = Date.now();
    const fetchResult = await fetch(request);
    const stop = Date.now();
    const duration = stop - start;
    const { size, content } = await bodyFromResponse(fetchResult);
    return {
      duration,
      status: 2,
      response: {
        headers: parseHeaders(fetchResult.headers),
        statusCode: fetchResult.status,
        statusText: fetchResult.statusText,
        size,
        body: {
          content,
        },
      },
    };
  })()`;

  return body;
}

/**
 *
 * @param {string} body
 * @return {string}
 */
function formatOptionalRequestParameters(body) {
  const params = /** @type {!Array<string>} */ ([]);
  if (body) {
    params.push(`      body: await b64ToBlob('${body}'),`);
  }

  if (params.length > 0) {
    // Add an empty string to the end of the array to insert a newline with the .join()
    params.unshift('');
  }

  return params.join('\n');
}

/** *
 * @param {!Array<!NCShared.IHttpHeader>} headers
 * @return {string}
 */
function formatHeaders(headers) {
  const hs = headers.slice();
  if (!hs.find(item => item.key.toLowerCase() === 'user-agent')) {
    hs.push({
      key: 'user-agent',
      value: `ms-edgedevtools.network-console/${navigator.userAgent.substr(navigator.userAgent.indexOf('Edg/'))}`
    });
  }

  return hs.map(h => `    headers.append('${escapeSingleQuotes(h.key)}', '${escapeSingleQuotes(h.value)}');`)
      .join('\n');
}

/**
 *
 * @param {string} input
 * @return {string}
 */
function escapeSingleQuotes(input) {
  return input.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
}
