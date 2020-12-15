// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const path = require('path');
const fs = require('fs');
const {startDevServer} = require('@web/dev-server');

const envPort = parseInt(process.env.PORT, 10);
const requestedPort = envPort || envPort === 0 ? envPort : 8090;

const ROOT_DIR = path.resolve(path.join(__dirname, '..', '..', '..'));

function sendRawResponse({request, response}, data) {
  const lines = data.split('\n');

  let isHeader = true;
  let line = lines.shift();
  const statusCode = parseInt(line, 10);

  // Remove the previously generated body from Koa
  response.body = '';
  response.remove('Content-Type');
  response.remove('Date');

  while ((line = lines.shift()) !== undefined) {
    if (line.trim() === '') {
      isHeader = false;
      if (request.headers['if-none-match'] && response.getHeader('ETag') === request.headers['if-none-match']) {
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
        transform(context) {
          if (context.url.endsWith('.rawresponse')) {
            sendRawResponse(context, fs.readFileSync(path.join(ROOT_DIR, context.url), {encoding: 'utf-8'}));
          }
        }
      }]
    },
  });

  // If port 0 was used, then requested and actual port will be different.
  const actualPort = server.server.address().port;
  // We have to send the actual port back to Conductor, so that it can
  // determine on which port to open DevTools. This is especially important
  // for parallel mode, for which the port is different per process.
  if (process.send) {
    process.send(actualPort);
  }
}

main();
