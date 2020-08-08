# Introduction

DevTools is the tool web developers use to get more information about the internal state of the Chromium browser. It allows them to debug and improve their web applications.

The purpose of this documentation is to enable teams working on web platform features to add and maintain support for their feature in Chromium DevTools.
This documentation is specifically NOT about the following topics:
- For user facing documentation, please see the documentation on [developers.google.com](https://www.developers.google.com)
- Contributing to Chromium outside of DevTools. Please see [Contributing to Chromium Docs](https://chromium.googlesource.com/chromium/src/+/master/docs/contributing.md).

DevTools itself consists of three different areas:
- Backend in Chromium
- DevTools frontend
- Chromium DevTools Protocol

Inside of the chromium codebase, DevTools installs agents in different areas of the codebase to get access to the internal state of a multitude of domains. On the other side, there is the frontend of DevTools that users interact with. In between lies the Chromium DevTools Protocol (CDP) used to communicate between the two parts.

As you can see in the following image, the frontend has a primary area and a secondary area:

IMAGE HERE


The tools available in the primary, upper area are called *Panels* and the tools in the secondary, lower area are called *Tabs*.

The DevTools team tries to keep the number of Panels at a minimum and usually recommends adding new features as Tabs. While they are still in development, these can also be hidden behind an experiment.

