/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as Root from '../../core/root/root.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as Persistence from '../../models/persistence/persistence.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Workspace from '../../models/workspace/workspace.js';
import * as CodeMirror from '../../third_party/codemirror.next/codemirror.next.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as IssueCounter from '../../ui/components/issue_counter/issue_counter.js';
import * as TextEditor from '../../ui/components/text_editor/text_editor.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';

import type * as Coverage from '../../panels/coverage/coverage.js';

import {CoveragePlugin} from './CoveragePlugin.js';
import {DebuggerPlugin} from './DebuggerPlugin.js';
import {MemoryProfilePlugin, PerformanceProfilePlugin} from './ProfilePlugin.js';
import {JavaScriptCompilerPlugin} from './JavaScriptCompilerPlugin.js';
import {Plugin} from './Plugin.js';
import {ScriptOriginPlugin} from './ScriptOriginPlugin.js';
import {SnippetsPlugin} from './SnippetsPlugin.js';
import {SourcesPanel} from './SourcesPanel.js';

// The order of these plugins matters for toolbar items
const sourceFramePlugins: (typeof Plugin)[] = [
  DebuggerPlugin,
  JavaScriptCompilerPlugin,
  SnippetsPlugin,
  ScriptOriginPlugin,
  CoveragePlugin,
  MemoryProfilePlugin,
  PerformanceProfilePlugin,
];

export class UISourceCodeFrame extends
    Common.ObjectWrapper.eventMixin<EventTypes, typeof SourceFrame.SourceFrame.SourceFrameImpl>(
        SourceFrame.SourceFrame.SourceFrameImpl) {
  private uiSourceCodeInternal: Workspace.UISourceCode.UISourceCode;
  private muteSourceCodeEvents: boolean;
  private isSettingContent: boolean;
  private persistenceBinding: Persistence.Persistence.PersistenceBinding|null;
  private uiSourceCodeEventListeners: Common.EventTarget.EventDescriptor[];
  private messageAndDecorationListeners: Common.EventTarget.EventDescriptor[];
  private readonly boundOnBindingChanged: () => void;
  private plugins: Plugin[] = [];
  private pluginsLoaded = false;

  constructor(uiSourceCode: Workspace.UISourceCode.UISourceCode) {
    super(workingCopy);
    this.uiSourceCodeInternal = uiSourceCode;

    this.muteSourceCodeEvents = false;
    this.isSettingContent = false;

    this.persistenceBinding = Persistence.Persistence.PersistenceImpl.instance().binding(uiSourceCode);

    this.uiSourceCodeEventListeners = [];
    this.messageAndDecorationListeners = [];

    this.boundOnBindingChanged = this.onBindingChanged.bind(this);

    Common.Settings.Settings.instance()
        .moduleSetting('persistenceNetworkOverridesEnabled')
        .addChangeListener(this.onNetworkPersistenceChanged, this);

    this.initializeUISourceCode();

    function workingCopy(): Promise<TextUtils.ContentProvider.DeferredContent> {
      if (uiSourceCode.isDirty()) {
        return Promise.resolve({content: uiSourceCode.workingCopy(), isEncoded: false});
      }
      return uiSourceCode.requestContent();
    }
  }

  protected editorConfiguration(doc: string, readOnly: boolean): CodeMirror.Extension {
    return [
      super.editorConfiguration(doc, readOnly),
      this.plugins.map(plugin => plugin.editorExtension()).filter(value => value) as CodeMirror.Extension[],
      CodeMirror.EditorView.domEventHandlers({contextmenu: event => this.onContextMenu(event)}),
      CodeMirror.lineNumbers({
        domEventHandlers:
            {contextmenu: (_view, block, event) => this.onLineGutterContextMenu(block.from, event as MouseEvent)}
      }),
    ];
  }

  protected onFocus() {
    super.onFocus();
    UI.Context.Context.instance().setFlavor(UISourceCodeFrame, this);
  }

  protected onBlur() {
    super.onBlur();
    UI.Context.Context.instance().setFlavor(UISourceCodeFrame, null);
  }

  private installMessageAndDecorationListeners(): void {
    if (this.persistenceBinding) {
      const networkSourceCode = this.persistenceBinding.network;
      const fileSystemSourceCode = this.persistenceBinding.fileSystem;
      this.messageAndDecorationListeners = [
        networkSourceCode.addEventListener(Workspace.UISourceCode.Events.MessageAdded, this.onMessageAdded, this),
        networkSourceCode.addEventListener(Workspace.UISourceCode.Events.MessageRemoved, this.onMessageRemoved, this),
        networkSourceCode.addEventListener(
            Workspace.UISourceCode.Events.DecorationChanged, this.onDecorationChanged, this),

        fileSystemSourceCode.addEventListener(Workspace.UISourceCode.Events.MessageAdded, this.onMessageAdded, this),
        fileSystemSourceCode.addEventListener(
            Workspace.UISourceCode.Events.MessageRemoved, this.onMessageRemoved, this),
      ];
    } else {
      this.messageAndDecorationListeners = [
        this.uiSourceCodeInternal.addEventListener(
            Workspace.UISourceCode.Events.MessageAdded, this.onMessageAdded, this),
        this.uiSourceCodeInternal.addEventListener(
            Workspace.UISourceCode.Events.MessageRemoved, this.onMessageRemoved, this),
        this.uiSourceCodeInternal.addEventListener(
            Workspace.UISourceCode.Events.DecorationChanged, this.onDecorationChanged, this),
      ];
    }
  }

  uiSourceCode(): Workspace.UISourceCode.UISourceCode {
    return this.uiSourceCodeInternal;
  }

  setUISourceCode(uiSourceCode: Workspace.UISourceCode.UISourceCode): void {
    this.unloadUISourceCode();
    this.uiSourceCodeInternal = uiSourceCode;
    if (uiSourceCode.contentLoaded()) {
      if (uiSourceCode.workingCopy() !== this.textEditor.state.doc.toString()) {
        this.innerSetContent(uiSourceCode.workingCopy());
      }
    } else {
      uiSourceCode.requestContent().then(() => {
        if (this.uiSourceCodeInternal !== uiSourceCode) {
          return;
        }
        if (uiSourceCode.workingCopy() !== this.textEditor.state.doc.toString()) {
          this.innerSetContent(uiSourceCode.workingCopy());
        }
      });
    }
    this.initializeUISourceCode();
  }

  private unloadUISourceCode(): void {
    this.disposePlugins();
    Common.EventTarget.removeEventListeners(this.messageAndDecorationListeners);
    Common.EventTarget.removeEventListeners(this.uiSourceCodeEventListeners);
    this.uiSourceCodeInternal.removeWorkingCopyGetter();
    Persistence.Persistence.PersistenceImpl.instance().unsubscribeFromBindingEvent(
        this.uiSourceCodeInternal, this.boundOnBindingChanged);
  }

  private initializeUISourceCode(): void {
    this.uiSourceCodeEventListeners = [
      this.uiSourceCodeInternal.addEventListener(
          Workspace.UISourceCode.Events.WorkingCopyChanged, this.onWorkingCopyChanged, this),
      this.uiSourceCodeInternal.addEventListener(
          Workspace.UISourceCode.Events.WorkingCopyCommitted, this.onWorkingCopyCommitted, this),
      this.uiSourceCodeInternal.addEventListener(
          Workspace.UISourceCode.Events.TitleChanged, this.refreshHighlighterType, this),
    ];

    Persistence.Persistence.PersistenceImpl.instance().subscribeForBindingEvent(
        this.uiSourceCodeInternal, this.boundOnBindingChanged);
    this.installMessageAndDecorationListeners();
    this.updateStyle();
    this.refreshHighlighterType();
    if (Root.Runtime.experiments.isEnabled('sourcesPrettyPrint')) {
      const supportedPrettyTypes = new Set<string>(['text/html', 'text/css', 'text/javascript']);
      this.setCanPrettyPrint(supportedPrettyTypes.has(this.highlighterType()), true);
    }
    this.ensurePluginsLoaded();
  }

  wasShown(): void {
    super.wasShown();
    this.setEditable(this.canEditSourceInternal());
    for (const plugin of this.plugins) {
      plugin.wasShown();
    }
  }

  willHide(): void {
    for (const plugin of this.plugins) {
      plugin.willHide();
    }
    super.willHide();
    UI.Context.Context.instance().setFlavor(UISourceCodeFrame, null);
    this.uiSourceCodeInternal.removeWorkingCopyGetter();
  }

  private refreshHighlighterType(): void {
    const binding = Persistence.Persistence.PersistenceImpl.instance().binding(this.uiSourceCodeInternal);
    const highlighterType = binding ? binding.network.mimeType() : this.uiSourceCodeInternal.mimeType();
    if (this.highlighterType() === highlighterType) {
      return;
    }
    this.disposePlugins();
    this.setHighlighterType(highlighterType);
    this.ensurePluginsLoaded();
  }

  canEditSourceInternal(): boolean {
    if (this.hasLoadError()) {
      return false;
    }
    if (this.uiSourceCodeInternal.editDisabled()) {
      return false;
    }
    if (this.uiSourceCodeInternal.mimeType() === 'application/wasm') {
      return false;
    }
    if (Persistence.Persistence.PersistenceImpl.instance().binding(this.uiSourceCodeInternal)) {
      return true;
    }
    if (this.uiSourceCodeInternal.project().canSetFileContent()) {
      return true;
    }
    if (this.uiSourceCodeInternal.project().isServiceProject()) {
      return false;
    }
    if (this.uiSourceCodeInternal.project().type() === Workspace.Workspace.projectTypes.Network &&
        Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().active()) {
      return true;
    }
    // Because live edit fails on large whitespace changes, pretty printed scripts are not editable.
    if (this.pretty && this.uiSourceCodeInternal.contentType().hasScripts()) {
      return false;
    }
    return this.uiSourceCodeInternal.contentType() !== Common.ResourceType.resourceTypes.Document;
  }

  private onNetworkPersistenceChanged(): void {
    this.setEditable(this.canEditSourceInternal());
  }

  commitEditing(): void {
    if (!this.uiSourceCodeInternal.isDirty()) {
      return;
    }

    this.muteSourceCodeEvents = true;
    this.uiSourceCodeInternal.commitWorkingCopy();
    this.muteSourceCodeEvents = false;
  }

  setContent(content: string|null, loadError: string|null): void {
    this.disposePlugins();
    this.ensurePluginsLoaded();
    super.setContent(content, loadError);
    for (let plugin of this.plugins)
      plugin.editorCreated(this.textEditor.editor);
    Common.EventTarget.fireEvent('source-file-loaded', this.uiSourceCodeInternal.displayName(true));
  }

  private allMessages(): Set<Workspace.UISourceCode.Message> {
    if (this.persistenceBinding) {
      const combinedSet = this.persistenceBinding.network.messages();
      Platform.SetUtilities.addAll(combinedSet, this.persistenceBinding.fileSystem.messages());
      return combinedSet;
    }
    return this.uiSourceCodeInternal.messages();
  }

  onTextChanged(): void {
    const wasPretty = this.pretty;
    super.onTextChanged();
    if (this.isSettingContent) {
      return;
    }
    SourcesPanel.instance().updateLastModificationTime();
    this.muteSourceCodeEvents = true;
    if (this.isClean()) {
      this.uiSourceCodeInternal.resetWorkingCopy();
    } else {
      this.uiSourceCodeInternal.setWorkingCopyGetter(() => this.textEditor.state.doc.toString());
    }
    this.muteSourceCodeEvents = false;
    if (wasPretty !== this.pretty) {
      this.updateStyle();
      this.disposePlugins();
      this.ensurePluginsLoaded();
    }
  }

  onWorkingCopyChanged(): void {
    if (this.muteSourceCodeEvents) {
      return;
    }
    this.innerSetContent(this.uiSourceCodeInternal.workingCopy());
  }

  private onWorkingCopyCommitted(): void {
    if (!this.muteSourceCodeEvents) {
      this.innerSetContent(this.uiSourceCode().workingCopy());
    }
    this.contentCommitted();
    this.updateStyle();
  }

  private ensurePluginsLoaded(): void {
    if (!this.loaded || this.pluginsLoaded) {
      return;
    }
    this.pluginsLoaded = true;

    const binding = Persistence.Persistence.PersistenceImpl.instance().binding(this.uiSourceCodeInternal);
    const pluginUISourceCode = binding ? binding.network : this.uiSourceCodeInternal;

    // Enable row messages and, optionally, CSS extensions in the editor.
    // FIXME-SF
    const languagePlugin =
        pluginUISourceCode.contentType().isStyleSheet() ? TextEditor.CSS.cssPlugin() : Promise.resolve([]);
    languagePlugin.then(extension => this.setPlugins([extension, rowMessages([...this.allMessages()])]));

    for (let pluginType of sourceFramePlugins) {
      if (pluginType.accepts(pluginUISourceCode)) {
        this.plugins.push(new pluginType(pluginUISourceCode, this));
      }
    }

    this.dispatchEventToListeners(Events.ToolbarItemsChanged);
    for (const plugin of this.plugins) {
      plugin.wasShown();
    }
  }

  private disposePlugins(): void {
    for (const plugin of this.plugins) {
      plugin.dispose();
    }
    this.plugins = [];
    this.pluginsLoaded = false;
  }

  private onBindingChanged(): void {
    const binding = Persistence.Persistence.PersistenceImpl.instance().binding(this.uiSourceCodeInternal);
    if (binding === this.persistenceBinding) {
      return;
    }
    this.unloadUISourceCode();
    this.persistenceBinding = binding;
    this.initializeUISourceCode();
  }

  private updateStyle(): void {
    this.setEditable(this.canEditSourceInternal());
  }

  private innerSetContent(content: string): void {
    this.isSettingContent = true;
    const oldContent = this.textEditor.state.doc.toString();
    if (oldContent !== content) {
      this.setContent(content, null);
    }
    this.isSettingContent = false;
  }

  onContextMenu(event: MouseEvent): boolean {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    event.consume(true);  // Consume event now to prevent document from handling the async menu

    const {state} = this.textEditor;
    const pos = state.selection.main.from, line = state.doc.lineAt(pos);
    const lineNumber = line.number - 1, column = pos - line.from;

    contextMenu.appendApplicableItems(this.uiSourceCodeInternal);
    const location = this.editorLocationToUILocation(lineNumber, column);
    contextMenu.appendApplicableItems(
        new Workspace.UISourceCode.UILocation(this.uiSourceCodeInternal, location.lineNumber, location.columnNumber));
    contextMenu.appendApplicableItems(this);
    for (const plugin of this.plugins) {
      plugin.populateTextAreaContextMenu(contextMenu, lineNumber, column);
    }
    contextMenu.appendApplicableItems(this);
    contextMenu.show();
    return true;
  }

  onLineGutterContextMenu(position: number, event: MouseEvent): boolean {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    event.consume(true);  // Consume event now to prevent document from handling the async menu

    const lineNumber = this.textEditor.state.doc.lineAt(position).number - 1;
    for (const plugin of this.plugins) {
      plugin.populateLineGutterContextMenu(contextMenu, lineNumber);
    }
    contextMenu.appendApplicableItems(this);
    contextMenu.show();
    return true;
  }

  dispose(): void {
    this.unloadUISourceCode();
    this.textEditor.editor.destroy();
    this.detach();
    Common.Settings.Settings.instance()
        .moduleSetting('persistenceNetworkOverridesEnabled')
        .removeChangeListener(this.onNetworkPersistenceChanged, this);
  }

  // FIXME-SF See if this is going to be called in bulk, and if so
  // arrange for that to use a bulk interface instead of triggering a
  // thousand editor updates
  private onMessageAdded(event: Common.EventTarget.EventTargetEvent<Workspace.UISourceCode.Message>): void {
    const {editor} = this.textEditor, shownMessages = editor.state.field(showRowMessages, false);
    if (shownMessages) {
      editor.dispatch({effects: setRowMessages.of(shownMessages.messages.add(event.data))});
    }
  }

  private onMessageRemoved(event: Common.EventTarget.EventTargetEvent<Workspace.UISourceCode.Message>): void {
    const {editor} = this.textEditor, shownMessages = editor.state.field(showRowMessages, false);
    if (shownMessages) {
      editor.dispatch({effects: setRowMessages.of(shownMessages.messages.remove(event.data))});
    }
  }

  private onDecorationChanged(event: Common.EventTarget.EventTargetEvent<string>): void {
    for (let plugin of this.plugins) {
      plugin.decorationChanged(event.data as SourceFrame.SourceFrame.DecoratorType, this.textEditor.editor);
    }
  }

  async toolbarItems(): Promise<UI.Toolbar.ToolbarItem[]> {
    const leftToolbarItems = await super.toolbarItems();
    const rightToolbarItems = [];
    for (const plugin of this.plugins) {
      leftToolbarItems.push(...plugin.leftToolbarItems());
      rightToolbarItems.push(...await plugin.rightToolbarItems());
    }

    if (!rightToolbarItems.length) {
      return leftToolbarItems;
    }

    return [...leftToolbarItems, new UI.Toolbar.ToolbarSeparator(true), ...rightToolbarItems];
  }
}

function getIconDataForLevel(level: Workspace.UISourceCode.Message.Level): IconButton.Icon.IconData {
  if (level === Workspace.UISourceCode.Message.Level.Error) {
    return {color: '', width: '12px', height: '12px', iconName: 'error_icon'};
  }
  if (level === Workspace.UISourceCode.Message.Level.Warning) {
    return {color: '', width: '12px', height: '12px', iconName: 'warning_icon'};
  }
  if (level === Workspace.UISourceCode.Message.Level.Issue) {
    return {color: 'var(--issue-color-yellow)', width: '12px', height: '12px', iconName: 'issue-exclamation-icon'};
  }
  return {color: '', width: '12px', height: '12px', iconName: 'error_icon'};
}

function getBubbleTypePerLevel(level: Workspace.UISourceCode.Message.Level): string {
  switch (level) {
    case Workspace.UISourceCode.Message.Level.Error:
      return 'error';
    case Workspace.UISourceCode.Message.Level.Warning:
      return 'warning';
    case Workspace.UISourceCode.Message.Level.Issue:
      return 'warning';
  }
}

function getLineClassPerLevel(level: Workspace.UISourceCode.Message.Level): string {
  switch (level) {
    case Workspace.UISourceCode.Message.Level.Error:
      return 'text-editor-line-with-error';
    case Workspace.UISourceCode.Message.Level.Warning:
      return 'text-editor-line-with-warning';
    case Workspace.UISourceCode.Message.Level.Issue:
      return 'text-editor-line-with-warning';
  }
}

function getIconDataForMessage(message: Workspace.UISourceCode.Message): IconButton.Icon.IconData {
  if (message instanceof IssuesManager.SourceFrameIssuesManager.IssueMessage) {
    return {
      ...IssueCounter.IssueCounter.getIssueKindIconData(message.getIssueKind()),
      width: '12px',
      height: '12px',
    };
  }
  return getIconDataForLevel(message.level());
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  ToolbarItemsChanged = 'ToolbarItemsChanged',
}

export type EventTypes = {
  [Events.ToolbarItemsChanged]: void,
};

// Row message management and display logic

function addMessage(rows: Workspace.UISourceCode.Message[][], message: Workspace.UISourceCode.Message):
    Workspace.UISourceCode.Message[][] {
  const index = Platform.ArrayUtilities.upperBound(
      rows, message, (message, row): number => row[0].lineNumber() - message.lineNumber());
  if (index === rows.length || rows[index][0].lineNumber() > message.lineNumber()) {
    rows.splice(index, 0, [message]);
  } else {
    rows[index] = rows[index].concat(message);
  }
  return rows;
}

function removeMessage(rows: Workspace.UISourceCode.Message[][], message: Workspace.UISourceCode.Message): void {
  const index = Platform.ArrayUtilities.upperBound(
      rows, message, (message, row): number => row[0].lineNumber() - message.lineNumber());
  if (index < rows.length && rows[index][0].lineNumber() === message.lineNumber()) {
    rows[index] = rows[index].filter(m => !m.isEqual(message));
  }
}

class RowMessages {
  constructor(readonly rows: Workspace.UISourceCode.Message[][]) {
  }

  static create(messages: Workspace.UISourceCode.Message[]): RowMessages {
    const rows: Workspace.UISourceCode.Message[][] = [];
    for (let message of messages) {
      addMessage(rows, message);
    }
    return new RowMessages(rows);
  }

  remove(message: Workspace.UISourceCode.Message): RowMessages {
    const rows = this.rows.slice();
    removeMessage(rows, message);
    return new RowMessages(rows);
  }

  add(message: Workspace.UISourceCode.Message): RowMessages {
    return new RowMessages(addMessage(this.rows.slice(), message));
  }
}

const setRowMessages = CodeMirror.StateEffect.define<RowMessages>();

// FIXME-SF define the CSS part
const underlineMark = CodeMirror.Decoration.mark({class: 'message-wavy-underline'});

class MessageWidget extends CodeMirror.WidgetType {
  constructor(readonly messages: Workspace.UISourceCode.Message[]) {
    super();
  }

  eq(other: MessageWidget): boolean {
    return other.messages === this.messages;
  }

  toDOM() {
    const wrap = document.createElement('span');
    wrap.classList.add('text-editor-line-decoration-icon');
    if (this.messages.some(m => m.level() !== Workspace.UISourceCode.Message.Level.Issue)) {
      const errorIcon = wrap.appendChild(new IconButton.Icon.Icon());
      errorIcon.data = getIconDataForLevel(Workspace.UISourceCode.Message.Level.Warning);
      errorIcon.classList.add('text-editor-line-decoration-icon-error');
    }
    const issue = this.messages.find(m => m.level() === Workspace.UISourceCode.Message.Level.Issue);
    if (issue) {
      const issueIcon = wrap.appendChild(new IconButton.Icon.Icon());
      issueIcon.data = getIconDataForLevel(Workspace.UISourceCode.Message.Level.Issue);
      issueIcon.classList.add('text-editor-line-decoration-icon-issue');
      issueIcon.addEventListener('click', () => (issue.clickHandler() || Math.min)());
    }
    return wrap;
  }

  ignoreEvents() {
    return true;
  }
}

class RowMessageDecorations {
  constructor(readonly messages: RowMessages, readonly decorations: CodeMirror.DecorationSet) {
  }

  static create(messages: RowMessages, doc: CodeMirror.Text): RowMessageDecorations {
    const builder = new CodeMirror.RangeSetBuilder<CodeMirror.Decoration>();
    for (const row of messages.rows) {
      const line = doc.line(row[0].lineNumber() + 1);
      const minCol = row.reduce((col, msg) => Math.min(col, msg.columnNumber() || 0), line.length);
      if (minCol < line.length) {
        builder.add(line.from + minCol, line.to, underlineMark);
      }
      builder.add(line.to, line.to, CodeMirror.Decoration.widget({side: 1, widget: new MessageWidget(row)}));
    }
    return new RowMessageDecorations(messages, builder.finish());
  }

  apply(tr: CodeMirror.Transaction): RowMessageDecorations {
    let result: RowMessageDecorations = this;
    if (tr.docChanged) {
      result = new RowMessageDecorations(this.messages, this.decorations.map(tr.changes));
    }
    for (const effect of tr.effects) {
      if (effect.is(setRowMessages)) {
        result = RowMessageDecorations.create(effect.value, tr.state.doc);
      }
    }
    return result;
  }
}

const showRowMessages = CodeMirror.StateField.define<RowMessageDecorations>({
  create(state): RowMessageDecorations {
    return RowMessageDecorations.create(new RowMessages([]), state.doc);
  },
  update(value, tr): RowMessageDecorations {
    return value.apply(tr);
  },
  provide: field => CodeMirror.EditorView.decorations.from(field, value => value.decorations)
});

const rowMessageHover = CodeMirror.hoverTooltip((view, pos) => {
  const {messages: {rows}} = view.state.field(showRowMessages);
  if (!rows.length) {
    return null;
  }
  const line = view.state.doc.lineAt(pos);
  if (pos < line.to) {
    return null;
  }
  const index = Platform.ArrayUtilities.upperBound(
      rows, line.number, (lineNumber, row): number => row[0].lineNumber() - lineNumber);
  if (index === rows.length || rows[index][0].lineNumber() !== line.number) {
    return null;
  }
  return {
    pos,
    create: () => renderMessageHoverTooltip(rows[index]),
    above: true,
    arrow: true  // FIXME-SF upgrade @codemirror/tooltip, test
  };
}, {hideOnChange: true});

function countDuplicates(messages: Workspace.UISourceCode.Message[]): number[] {
  const counts = [];
  for (let i = 0; i < messages.length; i++) {
    counts[i] = 0;
    for (let j = 0; j <= i; j++) {
      if (messages[j].isEqual(messages[i])) {
        counts[j]++;
        break;
      }
    }
  }
  return counts;
}

function renderMessage(message: Workspace.UISourceCode.Message, count: number): HTMLElement {
  const element = document.createElement('div');
  element.classList.add('text-editor-row-message');

  if (count === 1) {
    const icon = element.appendChild(new IconButton.Icon.Icon());
    icon.data = getIconDataForMessage(message);
    icon.classList.add('text-editor-row-message-icon');
    icon.addEventListener('click', () => (message.clickHandler() || Math.min)());
  } else {
    const repeatCountElement =
        document.createElement('span', {is: 'dt-small-bubble'}) as UI.UIUtils.DevToolsSmallBubble;
    repeatCountElement.textContent = String(count);
    repeatCountElement.classList.add('text-editor-row-message-repeat-count');
    element.appendChild(repeatCountElement);
    repeatCountElement.type = getBubbleTypePerLevel(message.level());
  }
  const linesContainer = element.createChild('div');
  for (let line of message.text().split('\n')) {
    linesContainer.createChild('div').textContent = line;
  }

  return element;
}

function renderMessageHoverTooltip(messages: Workspace.UISourceCode.Message[]): CodeMirror.TooltipView {
  const counts = countDuplicates(messages);
  const dom = document.createElement('div');
  for (let i = 0; i < messages.length; i++) {
    if (counts[i]) {
      dom.appendChild(renderMessage(messages[i], counts[i]));
    }
  }
  return {dom};
}

function rowMessages(initialMessages: Workspace.UISourceCode.Message[]) {
  return [
    showRowMessages.init(state => RowMessageDecorations.create(RowMessages.create(initialMessages), state.doc)),
    rowMessageHover
  ];
}
