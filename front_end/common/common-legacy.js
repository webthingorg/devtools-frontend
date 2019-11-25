// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {App as AppModule, AppProvider as AppProviderModule, CharacterIdMap as CharacterIdMapModule, Color as ColorModule, Console as ConsoleModule, ContentProvider as ContentProviderModule, EventTarget as EventTargetModule, JavaScriptMetaData as JavaScriptMetaDataModule, Linkifier as LinkifierModule, ObjectWrapper as ObjectWrapperModule, ParsedURL as ParsedURLModule, Progress as ProgressModule, QueryParamHandler as QueryParamHandlerModule, ResourceType as ResourceTypeModule, Revealer as RevealerModule, Runnable as RunnableModule, SegmentedRange as SegmentedRangeModule, Settings as SettingsModule, StaticContentProvider as StaticContentProviderModule, StringOutputStream as StringOutputStreamModule, TextDictionary as TextDictionaryModule, Throttler as ThrottlerModule, Trie as TrieModule, UIString as UIStringModule, Worker as WorkerModule,} from './common.js';

const App = Object.assign(AppModule.App, AppModule);
const AppProvider = Object.assign(AppProviderModule.AppProvider, AppProviderModule);
const CharacterIdMap = Object.assign(CharacterIdMapModule.CharacterIdMap, CharacterIdMapModule);
const Color = Object.assign(ColorModule.Color, ColorModule);
const Console = Object.assign(ConsoleModule.Console, ConsoleModule);
const ContentProvider = Object.assign(ContentProviderModule.ContentProvider, ContentProviderModule);
const EventTarget = Object.assign(EventTargetModule.EventTarget, EventTargetModule);
const JavaScriptMetaData = Object.assign(JavaScriptMetaDataModule.JavaScriptMetaData, JavaScriptMetaDataModule);
const Linkifier = Object.assign(LinkifierModule.Linkifier, LinkifierModule);
const ObjectWrapper = Object.assign(ObjectWrapperModule.ObjectWrapper, ObjectWrapperModule);
const ParsedURL = Object.assign(ParsedURLModule.ParsedURL, ParsedURLModule);
const Progress = Object.assign(ProgressModule.Progress, ProgressModule);
const QueryParamHandler = Object.assign(QueryParamHandlerModule.QueryParamHandler, QueryParamHandlerModule);
const ResourceType = Object.assign(ResourceTypeModule.ResourceType, ResourceTypeModule);
const Revealer = Object.assign(RevealerModule.Revealer, RevealerModule);
const Runnable = Object.assign(RunnableModule.Runnable, RunnableModule);
const SegmentedRange = Object.assign(SegmentedRangeModule.SegmentedRange, SegmentedRangeModule);
const Settings = Object.assign(SettingsModule.Settings, SettingsModule);
const StaticContentProvider =
    Object.assign(StaticContentProviderModule.StaticContentProvider, StaticContentProviderModule);
const StringOutputStream = Object.assign(StringOutputStreamModule.StringOutputStream, StringOutputStreamModule);
const TextDictionary = Object.assign(TextDictionaryModule.TextDictionary, TextDictionaryModule);
const Throttler = Object.assign(ThrottlerModule.Throttler, ThrottlerModule);
const Trie = Object.assign(TrieModule.Trie, TrieModule);
const UIString = Object.assign(UIStringModule.UIString, UIStringModule);
const Worker = Object.assign(WorkerModule.WorkerWrapper, WorkerModule);

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
