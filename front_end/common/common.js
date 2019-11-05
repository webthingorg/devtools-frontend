// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../platform/platform.js';

import * as App from './App.js';
import * as AppProvider from './AppProvider.js';
import * as CharacterIdMap from './CharacterIdMap.js';
import * as ColorModule from './Color.js';
import * as ConsoleModule from './Console.js';
import * as ContentProvider from './ContentProvider.js';
import * as EventTarget from './EventTarget.js';
import * as JavaScriptMetaData from './JavaScriptMetaData.js';
import * as Linkifier from './Linkifier.js';
import * as ObjectModule from './Object.js';
import * as ParsedURLModule from './ParsedURL.js';
import * as Progress from './Progress.js';
import * as QueryParamHandler from './QueryParamHandler.js';
import * as ResourceTypeModule from './ResourceType.js';
import * as Revealer from './Revealer.js';
import * as Runnable from './Runnable.js';
import * as SegmentedRangeModule from './SegmentedRange.js';
import * as Settings from './Settings.js';
import * as StaticContentProvider from './StaticContentProvider.js';
import * as StringOutputStreamModule from './StringOutputStream.js';
import * as TextDictionaryModule from './TextDictionary.js';
import * as Throttler from './Throttler.js';
import * as TrieModule from './Trie.js';
import * as UIString from './UIString.js';
import * as Worker from './Worker.js';

const Color = Object.assign(ColorModule.default, ColorModule);
const Console = Object.assign(ConsoleModule.default, ConsoleModule);
const ResourceType = Object.assign(ResourceTypeModule.default, ResourceTypeModule);
const ObjectWrapper = Object.assign(ObjectModule.default, ObjectModule);
const ParsedURL = Object.assign(ParsedURLModule.default, ParsedURLModule);
const SegmentedRange = Object.assign(SegmentedRangeModule.default, SegmentedRangeModule);
const StringOutputStream = Object.assign(StringOutputStreamModule.default, StringOutputStreamModule);
const TextDictionary = Object.assign(TextDictionaryModule.default, TextDictionaryModule);
const Trie = Object.assign(TrieModule.default, TrieModule);

export {
  App,
  AppProvider,
  CharacterIdMap,
  Color,
  Console,
  ContentProvider,
  EventTarget,
  JavaScriptMetaData,
  Linkifier,
  ObjectWrapper,
  ParsedURL,
  Progress,
  QueryParamHandler,
  ResourceType,
  Revealer,
  Runnable,
  SegmentedRange,
  Settings,
  StaticContentProvider,
  StringOutputStream,
  TextDictionary,
  Throttler,
  Trie,
  UIString,
  Worker,
};
