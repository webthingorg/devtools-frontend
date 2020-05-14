// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const http = require('http');
const path = require('path');
const parseURL = require('url').parse;

const serverPort = parseInt(process.env.PORT, 10) || 8090;

const devtoolsFrontendFolder = path.resolve(path.join(__dirname, '..', '..', 'out', 'Default', 'gen', 'front_end'));

http.createServer(requestHandler).listen(serverPort);
console.log(`Started components server at http://localhost:${serverPort}\n`);


function createIndexHtmlFile(componentName, componentExamples) {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width" />
      <title>DevTools component: ${componentName.substring(1)}</title>
      <style>
        h1 { text-transform: capitalize; }

        .example {
          padding: 5px;
          margin: 10px;
        }
        iframe { display: block; width: 100%; }
      </style>
    </head>
    <body>
      <h1>${componentName.substring(1)}</h1>
      ${componentExamples.map(example => {
        const fullPath = path.join('component_docs', componentName, example);
        return `<div class="example">
          <h3>${example}</h3>
          <iframe src="${fullPath}"></iframe>
        </div>`;
      }).join('\n')}
    </body>
  </html>`;
}

async function getExamplesForPath(filePath) {
  const componentDirectory = path.join(devtoolsFrontendFolder, 'component_docs', filePath);

  const contents = await fs.promises.readdir(componentDirectory);

  return createIndexHtmlFile(filePath, contents);
}

async function requestHandler(request, response) {
  const filePath = parseURL(request.url).pathname;
  console.log('got request', filePath);

  if (filePath === '/favicon.ico') {
    sendResponse(404, '404, no favicon');
    return;
  }

  if (path.extname(filePath) === '') {
    // is a component path
    const componentHtml = await getExamplesForPath(filePath);
    // sendResponse(200, 'hello world');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.writeHead(200);
    response.write(componentHtml, 'utf8');
    response.end();
  } else {
    const fullPath = path.join(devtoolsFrontendFolder, filePath);
    const errorsAccesingFile = await fs.promises.access(fullPath, fs.constants.R_OK);

    if (errorsAccesingFile) {
      console.error(`File ${fullPath} does not exist.`);
      sendResponse(404, '404 - File not found');
      return;
    }

    let encoding = 'utf8';
    if (fullPath.endsWith('.wasm') || fullPath.endsWith('.png') || fullPath.endsWith('.jpg')) {
      encoding = 'binary';
    }

    const fileContents = await fs.promises.readFile(fullPath, encoding);

    encoding = 'utf8';
    if (fullPath.endsWith('.js')) {
      response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    } else if (fullPath.endsWith('.css')) {
      response.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (fullPath.endsWith('.wasm')) {
      response.setHeader('Content-Type', 'application/wasm');
      encoding = 'binary';
    } else if (fullPath.endsWith('.svg')) {
      response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    } else if (fullPath.endsWith('.png')) {
      response.setHeader('Content-Type', 'image/png');
      encoding = 'binary';
    } else if (fullPath.endsWith('.jpg')) {
      response.setHeader('Content-Type', 'image/jpg');
      encoding = 'binary';
    }

    response.writeHead(200);
    response.write(fileContents, encoding);
    response.end();
  }

  return;
  // filePath will be /breadcrumbs
  // which we then go find:
  // component_docs/breadcrumbs/*.html
  // merge those into /breadcrumbs/index.html

  // and serve that file up

  fs.exists(absoluteFilePath, fsExistsCallback);

  function fsExistsCallback(fileExists) {
    if (!fileExists) {
      console.log(`Cannot find file ${absoluteFilePath}`);
      sendResponse(404, '404 - File not found');
      return;
    }

    let encoding = 'utf8';
    if (absoluteFilePath.endsWith('.wasm') || absoluteFilePath.endsWith('.png') || absoluteFilePath.endsWith('.jpg')) {
      encoding = 'binary';
    }

    fs.readFile(absoluteFilePath, encoding, readFileCallback);
  }

  function readFileCallback(err, file) {
    if (err) {
      console.log(`Unable to read local file ${absoluteFilePath}:`, err);
      sendResponse(500, '500 - Internal Server Error');
      return;
    }
    sendResponse(200, file);
  }

  function sendResponse(statusCode, data) {
    const path = parseURL(request.url).pathname;

    if (path.endsWith('.rawresponse')) {
      sendRawResponse(data);
      return;
    }

    let encoding = 'utf8';
    if (path.endsWith('.js')) {
      response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      response.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.wasm')) {
      response.setHeader('Content-Type', 'application/wasm');
      encoding = 'binary';
    } else if (path.endsWith('.svg')) {
      response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    } else if (path.endsWith('.png')) {
      response.setHeader('Content-Type', 'image/png');
      encoding = 'binary';
    } else if (path.endsWith('.jpg')) {
      response.setHeader('Content-Type', 'image/jpg');
      encoding = 'binary';
    }

    response.writeHead(statusCode);
    response.write(data, encoding);
    response.end();
  }
}
