// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// NOTE: need to be careful about adding release notes early otherwise it'll
// be shown in Canary (e.g. make sure the release notes are accurate).
// https://github.com/ChromeDevTools/devtools-frontend/wiki/Release-Notes

/** @type {!Array<!Help.ReleaseNote>} */
export const releaseNoteText = [{
  version: 23,
  header: ls`Highlights from the Chrome 81 update`,
  highlights: [
    {
      title: ls`Moto G4 support in Device Mode`,
      subtitle: ls`Simulate Moto G4 viewport dimensions and display its hardware around the viewport.`,
      link: 'https://developers.google.com/web/updates/2020/01/devtools#motog4',
    },
    {
      title: ls`Cookie-related updates`,
      subtitle: ls`Blocked cookies and cookie priority in the Cookies pane, editing all cookie values, and more.`,
      link: 'https://developers.google.com/web/updates/2020/01/devtools#cookies',
    },
    {
      title: ls`More accurate web app manifest icons`,
      subtitle: ls`DevTools now shows the exact icon that Chrome uses.`,
      link: 'https://developers.google.com/web/updates/2020/01/devtools#manifesticons',
    },
    {
      title: ls`Hover over CSS "content" properties to see unescaped values`,
      subtitle: ls`Hover over a "content" value to see the rendered version of the value in a tooltip.`,
      link: 'https://developers.google.com/web/updates/2020/01/devtools#content',
    },
    {
      title: ls`Source map errors in the Console`,
      subtitle: ls`The Console now tells you when a source map has failed to load or parse.`,
      link: 'https://developers.google.com/web/updates/2020/01/devtools#sourcemaperrors',
    },
    {
      title: ls`A setting for disabling scrolling past the end of a file`,
      subtitle: ls`Go to Settings and disable the "Allow scrolling past end of file" checkbox.`,
      link: 'https://developers.google.com/web/updates/2020/01/devtools#scrolling',
    },
  ],
  link: 'https://developers.google.com/web/updates/2020/01/devtools',
}];
