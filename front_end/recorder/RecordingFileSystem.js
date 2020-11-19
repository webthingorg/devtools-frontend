// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import * as Persistence from '../persistence/persistence.js';
import * as TextUtils from '../text_utils/text_utils.js';  // eslint-disable-line no-unused-vars
import * as Workspace from '../workspace/workspace.js';    // eslint-disable-line no-unused-vars

export const _UIStrings = {
  /**
  * @description Default name of a new recording
  * @example {1} nextId
  */
  defaultRecordingName: 'Recording #{nextId}',
};

/** @type {?function(string, (!Object | undefined)): string} */
let _i18nString = null;

/**
 * @return {function(string, (!Object | undefined)): string}
 */
function getI18nString() {
  if (_i18nString) {
    return _i18nString;
  }
  const str_ = i18n.i18n.registerUIStrings('recorder/RecordingFileSystem.js', _UIStrings);
  _i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
  return _i18nString;
}

/**
 * @param {string} name
 * @return {string}
 */
function escapeRecordingName(name) {
  return escape(name);
}

/**
 * @param {string} name
 * @return {string}
 */
function unescapeRecordingName(name) {
  return unescape(name);
}

export class RecordingFileSystem extends Persistence.PlatformFileSystem.PlatformFileSystem {
  constructor() {
    super('recording://', 'recordings');
    this._lastSnippetIdentifierSetting =
        Common.Settings.Settings.instance().createSetting('recorder_lastIdentifier', 0);
    this._snippetsSetting = Common.Settings.Settings.instance().createSetting('recorder_recordings', []);
  }

  /**
   * @override
   * @return {!Array<string>}
   */
  initialFilePaths() {
    /** @type {!Array<!Snippet>} */
    const savedSnippets = this._snippetsSetting.get();
    return savedSnippets.map(snippet => escapeRecordingName(snippet.name));
  }

  /**
   * @override
   * @param {string} path
   * @param {?string} name
   * @return {!Promise<?string>}
   */
  async createFile(path, name) {
    const nextId = this._lastSnippetIdentifierSetting.get() + 1;
    this._lastSnippetIdentifierSetting.set(nextId);

    const snippetName = getI18nString()(_UIStrings.defaultRecordingName, {nextId});
    const snippets = this._snippetsSetting.get();
    snippets.push({name: snippetName, content: '{"steps": []}'});
    this._snippetsSetting.set(snippets);

    return escapeRecordingName(snippetName);
  }

  /**
   * @override
   * @param {string} path
   * @return {!Promise<boolean>}
   */
  async deleteFile(path) {
    const name = unescapeRecordingName(path.substring(1));
    /** @type {!Array<!Snippet>} */
    const allSnippets = this._snippetsSetting.get();
    const snippets = allSnippets.filter(snippet => snippet.name !== name);
    if (allSnippets.length !== snippets.length) {
      this._snippetsSetting.set(snippets);
      return true;
    }
    return false;
  }

  /**
   * @override
   * @param {string} path
   * @returns {!Promise<!TextUtils.ContentProvider.DeferredContent>}
   */
  async requestFileContent(path) {
    const name = unescapeRecordingName(path.substring(1));
    /** @type {!Array<!Snippet>} */
    const snippets = this._snippetsSetting.get();
    const snippet = snippets.find(snippet => snippet.name === name);
    if (snippet) {
      return {content: snippet.content, isEncoded: false};
    }
    return {content: null, isEncoded: false, error: `A recording with name '${name}' was not found`};
  }

  /**
   * @override
   * @param {string} path
   * @param {string} content
   * @param {boolean} isBase64
   */
  async setFileContent(path, content, isBase64) {
    const name = unescapeRecordingName(path.substring(1));
    /** @type {!Array<!Snippet>} */
    const snippets = this._snippetsSetting.get();
    const snippet = snippets.find(snippet => snippet.name === name);
    if (snippet) {
      snippet.content = content;
      this._snippetsSetting.set(snippets);
      return true;
    }
    return false;
  }

  /**
   * @override
   * @param {string} path
   * @param {string} newName
   * @param {function(boolean, string=):void} callback
   */
  renameFile(path, newName, callback) {
    const name = unescapeRecordingName(path.substring(1));
    /** @type {!Array<!Snippet>} */
    const snippets = this._snippetsSetting.get();
    const snippet = snippets.find(snippet => snippet.name === name);
    newName = newName.trim();
    if (!snippet || newName.length === 0 || snippets.find(snippet => snippet.name === newName)) {
      callback(false);
      return;
    }
    snippet.name = newName;
    this._snippetsSetting.set(snippets);
    callback(true, newName);
  }

  /**
   * @override
   * @param {string} query
   * @param {!Common.Progress.Progress} progress
   * @return {!Promise<!Array<string>>}
   */
  async searchInPath(query, progress) {
    const re = new RegExp(query.escapeForRegExp(), 'i');
    /** @type {!Array<!Snippet>} */
    const allSnippets = this._snippetsSetting.get();
    const matchedSnippets = allSnippets.filter(snippet => snippet.content.match(re));
    return matchedSnippets.map(snippet => `recording:///${escapeRecordingName(snippet.name)}`);
  }

  /**
   * @override
   * @param {string} path
   * @return {string}
   */
  mimeFromPath(path) {
    return 'text/javascript';
  }

  /**
   * @override
   * @param {string} path
   * @return {!Common.ResourceType.ResourceType}
   */
  contentType(path) {
    return Common.ResourceType.resourceTypes.Script;
  }

  /**
   * @override
   * @param {string} url
   * @return {string}
   */
  tooltipForURL(url) {
    return ls`Linked to ${unescapeRecordingName(url.substring(this.path().length))}`;
  }

  /**
   * @override
   * @return {boolean}
   */
  supportsAutomapping() {
    return true;
  }
}

/**
 * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
 * @return {boolean}
 */
export function isRecordingUISourceCode(uiSourceCode) {
  return uiSourceCode.url().startsWith('recording://');
}

/**
 * @param {!Workspace.Workspace.Project} project
 * @return {boolean}
 */
export function isRecordingProject(project) {
  return project.type() === Workspace.Workspace.projectTypes.FileSystem &&
      Persistence.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(project) === 'recordings';
}

/**
 * @return {!Workspace.Workspace.Project}
 * */
export function findRecordingsProject() {
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const projects = workspace.projectsForType(Workspace.Workspace.projectTypes.FileSystem);
  const project = projects.find(project => {
    const type = Persistence.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(project);
    return type === 'recordings';
  });
  if (!project) {
    throw new Error('Unable to find workspace project for the recordings file system.');
  }
  return project;
}

/**
* @typedef {{
  * name:string,
  * content:string,
  * }}
  */
// @ts-ignore typedef
export let Snippet;
