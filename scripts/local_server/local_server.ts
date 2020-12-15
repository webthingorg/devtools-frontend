// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {startDevServer} from '@web/dev-server';  // eslint-disable-line rulesdir/es_modules_import
import * as fs from 'fs';
import * as path from 'path';

import type * as Koa from 'koa';

const envPort = parseInt(process.env.PORT || '', 10);
const requestedPort = envPort || envPort === 0 ? envPort : 8090;

const ROOT_DIR = path.resolve(path.join(__dirname, '..', '..', '..'));

function sendRawResponse({request, response}: {request: Koa.Request, response: Koa.Response}, data: string) {
  const lines = data.split('\n');

  let isHeader = true;
  let line = lines.shift();
  if (line === undefined) {
    throw new Error(`Unable to find file content for url ${request.url}`);
  }
  const statusCode = parseInt(line, 10);

  // Remove the previously generated body from Koa
  response.body = '';
  response.remove('Content-Type');
  response.remove('Date');

  while ((line = lines.shift()) !== undefined) {
    if (line.trim() === '') {
      isHeader = false;
      if (request.headers['if-none-match'] && response.get('ETag') === request.headers['if-none-match']) {
        response.status = 304;
        return;
      }
      response.status = statusCode;
      continue;
    }

    if (isHeader) {
      const firstColon = line.indexOf(':');
      response.set(line.substring(0, firstColon), line.substring(firstColon + 1).trim());
    } else {
      response.body += line;
    }
  }
}

async function main() {
  const server = await startDevServer({
    readCliArgs: false,
    readFileConfig: false,
    autoExitProcess: true,
    config: {
      open: false,
      http2: true,
      port: requestedPort,
      rootDir: ROOT_DIR,

      // The certificate is taken from
      // https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/tools/apache_config/webkit-httpd.pem
      sslKey: path.join(__dirname, 'key.pem'),
      sslCert: path.join(__dirname, 'cert.pem'),

      middleware: [
        (context, next) => {
          if (context.url.startsWith('/front_end')) {
            context.url = context.url.replace('front_end', 'resources/inspector');
          } else if (!context.url.startsWith('/gen')) {
            context.url = `/gen${context.url}`;
          }
          return next();
        },
      ],

      plugins: [{
        name: 'devtools-raw-response',
        async transform(context) {
          if (context.url.endsWith('.rawresponse')) {
            await new Promise<void>(async resolve => {
              const fileContents = await fs.promises.readFile(path.join(ROOT_DIR, context.url), {encoding: 'utf-8'});
              sendRawResponse(context, fileContents);
              resolve();
            });
          }
        },
      }],
    },
  });

  if (!server) {
    throw new Error('Unable to create server');
  }

  const address = server.server.address();
  if (typeof address === 'string' || !address) {
    return;
  }

  // If port 0 was used, then requested and actual port will be different.
  const actualPort = address.port;
  // We have to send the actual port back to Conductor, so that it can
  // determine on which port to open DevTools. This is especially important
  // for parallel mode, for which the port is different per process.
  if (process.send) {
    process.send(actualPort);
  }
}

main();
