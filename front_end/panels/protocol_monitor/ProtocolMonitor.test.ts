// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';
import {expectCall} from '../../testing/ExpectStubCall.js';
import {stubFileManager} from '../../testing/FileManagerHelpers.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as ProtocolMonitor from './protocol_monitor.js';

const ProtocolMonitorImpl = ProtocolMonitor.ProtocolMonitor.ProtocolMonitorImpl;
const InspectorBackend = ProtocolClient.InspectorBackend;
type ViewInput = ProtocolMonitor.ProtocolMonitor.ViewInput;
type ViewOutput = ProtocolMonitor.ProtocolMonitor.ViewOutput;
type DataGridRow = DataGrid.DataGridUtils.Row;

describeWithEnvironment('ProtocolMonitor', () => {
  let viewInputs!: ViewInput;
  let viewOutputs!: ViewOutput;

  function view(input: ViewInput, output: ViewOutput, _target: HTMLElement) {
    viewInputs = input;
    const dataGrid = new DataGrid.DataGridController.DataGridController();
    dataGrid.data = input.dataGridInitialData;
    viewOutputs = {
      splitWidget: new UI.SplitWidget.SplitWidget(false, false),
      dataGrid,
      infoWidget: new ProtocolMonitor.ProtocolMonitor.InfoWidget(new UI.Widget.WidgetElement()),
      bottomToolbar: new UI.Toolbar.ToolbarElement(),
      editor: new ProtocolMonitor.JSONEditor.JSONEditor(),
    };
    Object.assign(output, viewOutputs);
  }

  it('can toggle recording', () => {
    const protocolMonitor = new ProtocolMonitorImpl(view);
    protocolMonitor.wasShown();

    const {recordButton} = viewInputs;
    assert.isTrue(recordButton.toggled());

    assert.isNotNull(InspectorBackend.test.onMessageSent);
    assert.isNotNull(InspectorBackend.test.onMessageReceived);

    recordButton.clicked(new MouseEvent('click'));

    assert.isNull(InspectorBackend.test.onMessageSent);
    assert.isNull(InspectorBackend.test.onMessageReceived);

    recordButton.clicked(new MouseEvent('click'));

    assert.isNotNull(InspectorBackend.test.onMessageSent);
    assert.isNotNull(InspectorBackend.test.onMessageReceived);
  });

  const TARGET_ID = 'TARGET_ID';
  const METHOD = 'METHOD';
  const PARAMETERS = {foo: 1, bar: 2};

  const TEST_ROW = {
    cells: [
      {columnId: 'request', value: 'REQUEST'},
      {columnId: 'response', value: 'RESPONSE'},
      {columnId: 'target', value: TARGET_ID},
      {columnId: 'type', value: 'qux'},
      {columnId: 'method', value: METHOD},
    ],
  } as DataGridRow;

  it('can clear messages', () => {
    new ProtocolMonitorImpl(view);
    const {clearButton} = viewInputs;
    const {dataGrid, infoWidget} = viewOutputs;
    dataGrid.data.rows.push(TEST_ROW);
    const infoWidgetRender = sinon.stub(infoWidget, 'render');

    clearButton.clicked(new MouseEvent('click'));

    assert.isEmpty(dataGrid.data.rows);
    assert.isTrue(infoWidgetRender.calledOnceWith(null));
  });

  it('can save messages', async () => {
    new ProtocolMonitorImpl(view);
    const {saveButton} = viewInputs;
    const {dataGrid} = viewOutputs;
    dataGrid.data.rows.push(TEST_ROW);

    const fileManager = stubFileManager();
    const fileManagerCloseCall = expectCall(fileManager.close);

    saveButton.clicked(new MouseEvent('click'));
    await fileManagerCloseCall;
    assert.isTrue(fileManager.append.calledOnce);
    assert.match(fileManager.append.firstCall.args[0], /ProtocolMonitor-.*\.json/);
    assert.deepStrictEqual(
        JSON.parse(fileManager.append.firstCall.args[1]),
        [Object.fromEntries(TEST_ROW.cells.map(c => [c.columnId, c.value]))]);
  });

  it('can edit and resend a command', () => {
    new ProtocolMonitorImpl(view);
    const {infoWidget, splitWidget, editor} = viewOutputs;

    const menu = new UI.ContextMenu.ContextMenu(new MouseEvent('contextmenu'));
    const appendMenuItem = sinon.stub(menu.editSection(), 'appendItem');

    const dataGridData = viewInputs.dataGridInitialData;
    dataGridData.contextMenus!.bodyRow!(menu, dataGridData.columns, TEST_ROW, dataGridData.rows);

    sinon.stub(infoWidget, 'request').value(PARAMETERS);
    sinon.stub(infoWidget, 'targetId').value(TARGET_ID);
    sinon.stub(splitWidget, 'showMode').returns(UI.SplitWidget.ShowMode.OnlyMain);
    const toggleSidebar = sinon.stub(splitWidget, 'toggleSidebar');
    const displayCommand = sinon.stub(editor, 'displayCommand');

    appendMenuItem.firstCall.args[1]();

    assert.isTrue(toggleSidebar.calledOnce);
    assert.isTrue(displayCommand.calledOnceWith(METHOD, PARAMETERS, TARGET_ID));
  });

  it('can filter by the same method', () => {
    new ProtocolMonitorImpl(view);

    const menu = new UI.ContextMenu.ContextMenu(new MouseEvent('contextmenu'));
    const appendMenuItem = sinon.stub(menu.editSection(), 'appendItem');

    const dataGridData = viewInputs.dataGridInitialData;
    dataGridData.contextMenus!.bodyRow!(menu, dataGridData.columns, TEST_ROW, dataGridData.rows);

    const setFilterValue = sinon.stub(viewInputs.textFilterUI, 'setValue');

    appendMenuItem.secondCall.args[1]();

    assert.isTrue(setFilterValue.calledOnce);
    assert.isTrue(setFilterValue.calledOnceWith(`method:${METHOD}`));
  });

  describe('parseCommandInput', () => {
    it('parses various JSON formats', async () => {
      const input = {
        command: 'Input.dispatchMouseEvent',
        parameters: {parameter1: 'value1'},
      };
      // "command" variations.
      assert.deepStrictEqual(
          ProtocolMonitor.ProtocolMonitor.parseCommandInput(JSON.stringify({
            command: input.command,
            parameters: input.parameters,
          })),
          input);
      assert.deepStrictEqual(
          ProtocolMonitor.ProtocolMonitor.parseCommandInput(JSON.stringify({
            cmd: input.command,
            parameters: input.parameters,
          })),
          input);
      assert.deepStrictEqual(
          ProtocolMonitor.ProtocolMonitor.parseCommandInput(JSON.stringify({
            method: input.command,
            parameters: input.parameters,
          })),
          input);

      // "parameters" variations.
      assert.deepStrictEqual(
          ProtocolMonitor.ProtocolMonitor.parseCommandInput(JSON.stringify({
            command: input.command,
            params: input.parameters,
          })),
          input);
      assert.deepStrictEqual(
          ProtocolMonitor.ProtocolMonitor.parseCommandInput(JSON.stringify({
            cmd: input.command,
            args: input.parameters,
          })),
          input);
      assert.deepStrictEqual(
          ProtocolMonitor.ProtocolMonitor.parseCommandInput(JSON.stringify({
            method: input.command,
            arguments: input.parameters,
          })),
          input);
    });

    it('parses non-JSON data as a command name', async () => {
      assert.deepStrictEqual(ProtocolMonitor.ProtocolMonitor.parseCommandInput('Input.dispatchMouseEvent'), {
        command: 'Input.dispatchMouseEvent',
        parameters: {},
      });
    });

    it('should correctly creates a map of CDP commands with their corresponding metadata', async () => {
      const domains = [
        {
          domain: 'Test',
          metadata: {
            'Test.test': {
              parameters: [{
                name: 'test',
                type: 'test',
                optional: true,
              }],
              description: 'Description1',
              replyArgs: ['Test1'],
            },
          },
        },
        {
          domain: 'Test2',
          metadata: {
            'Test2.test2': {
              parameters: [{
                name: 'test2',
                type: 'test2',
                optional: true,
              }],
              description: 'Description2',
              replyArgs: ['Test2'],
            },
            'Test2.test3': {
              parameters: [{
                name: 'test3',
                type: 'test3',
                optional: true,
              }],
              description: 'Description3',
              replyArgs: ['Test3'],
            },
          },
        },
      ] as Iterable<ProtocolMonitor.JSONEditor.ProtocolDomain>;

      const expectedCommands = new Map();
      expectedCommands.set('Test.test', {
        parameters: [{
          name: 'test',
          type: 'test',
          optional: true,
        }],
        description: 'Description1',
        replyArgs: ['Test1'],
      });
      expectedCommands.set('Test2.test2', {
        parameters: [{
          name: 'test2',
          type: 'test2',
          optional: true,
        }],
        description: 'Description2',
        replyArgs: ['Test2'],
      });
      expectedCommands.set('Test2.test3', {
        parameters: [{
          name: 'test3',
          type: 'test3',
          optional: true,
        }],
        description: 'Description3',
        replyArgs: ['Test3'],
      });

      const metadataByCommand = ProtocolMonitor.JSONEditor.buildProtocolMetadata(domains);
      assert.deepStrictEqual(metadataByCommand, expectedCommands);
    });
  });

  describe('HistoryAutocompleteDataProvider', () => {
    it('should create completions with no history', async () => {
      const provider = new ProtocolMonitor.ProtocolMonitor.CommandAutocompleteSuggestionProvider();
      assert.deepStrictEqual(await provider.buildTextPromptCompletions('test', 'test'), []);
    });

    it('should build completions in the reverse insertion order', async () => {
      const provider = new ProtocolMonitor.ProtocolMonitor.CommandAutocompleteSuggestionProvider();

      provider.addEntry('test1');
      provider.addEntry('test2');
      provider.addEntry('test3');
      assert.deepStrictEqual(await provider.buildTextPromptCompletions('test', 'test'), [
        {text: 'test3'},
        {text: 'test2'},
        {text: 'test1'},
      ]);

      provider.addEntry('test1');
      assert.deepStrictEqual(await provider.buildTextPromptCompletions('test', 'test'), [
        {text: 'test1'},
        {text: 'test3'},
        {text: 'test2'},
      ]);
    });

    it('should limit the number of completions', async () => {
      const provider = new ProtocolMonitor.ProtocolMonitor.CommandAutocompleteSuggestionProvider(2);

      provider.addEntry('test1');
      provider.addEntry('test2');
      provider.addEntry('test3');

      assert.deepStrictEqual(await provider.buildTextPromptCompletions('test', 'test'), [
        {text: 'test3'},
        {text: 'test2'},
      ]);
    });
  });
});
