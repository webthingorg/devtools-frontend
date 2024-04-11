// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';

import * as ProtocolMonitor from './protocol_monitor.js';

const Widget = UI.Widget.Widget;
const EmptyWidget = UI.EmptyWidget.EmptyWidget;
const ProtocolMonitorImpl = ProtocolMonitor.ProtocolMonitor.ProtocolMonitorImpl;
const InspectorBackend = ProtocolClient.InspectorBackend;
type ProtocolMonitorRender = ProtocolMonitor.ProtocolMonitor.Renderer;
type TabbedPane = UI.TabbedPane.TabbedPane;
type ToolbarElement = UI.Toolbar.ToolbarElement;
type ToolbarToggle = UI.Toolbar.ToolbarToggle;
type ToolbarButton = UI.Toolbar.ToolbarButton;
type DataGridRow = DataGrid.DataGridUtils.Row;
type DataGridController = DataGrid.DataGridController.DataGridController;
type BodyCellFocusedEvent = DataGrid.DataGridEvents.BodyCellFocusedEvent;

const fakeView = sinon.stub().callsFake((input, output) => {
  output.splitWidget = sinon.createStubInstance(UI.SplitWidget.SplitWidget);
  output.dataGrid = sinon.createStubInstance(DataGrid.DataGridController.DataGridController);
  output.infoWidget = sinon.createStubInstance(ProtocolMonitor.ProtocolMonitor.InfoWidget);
  output.bottomToolbar = sinon.createStubInstance(UI.Toolbar.ToolbarElement;
  output.editor = sinon.createStubInstance(ProtocolMonitor.JSONEditor.JSONEditor);
});

describeWithEnvironment('ProtocolMonitor', () => {
  it('can toggle recording', () => {
    const protocolMonitor = new ProtocolMonitorImpl(fakeRenderer);
    protocolMonitor.wasShown();
    const toolbar = protocolMonitor.contentElement.querySelector('.protocol-monitor-toolbar') as ToolbarElement;

    const recordButton = toolbar.items[0] as ToolbarToggle;
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

  const TEST_ROW = {
    cells: [
      {columnId: 'request', value: ''},
      {columnId: 'response', value: ''},
      {columnId: 'target', value: ''},
      {columnId: 'type', value: ''},
    ],
  } as DataGridRow;

  // it('can clear messages', ()=> {
  //   const protocolMonitor = new ProtocolMonitorImpl();
  //   protocolMonitor.wasShown();
  //   const dataGrid =
  //       protocolMonitor.contentElement.querySelector('devtools-data-grid-controller') as DataGridController;
  //   dataGrid.data.rows.push(TEST_ROW);
  //   protocolMonitor.onCellFocused({data: {row: TEST_ROW, cell: {}}} as BodyCellFocusedEvent);
  //
  //   const infoWidget = Widget.get(protocolMonitor.contentElement.querySelector('.protocol-monitor-info')!)!;
  //   const tabbedPane = Widget.get(infoWidget.contentElement.querySelector('.tabbed-pane')!) as TabbedPane;
  //   assert.isFalse(tabbedPane.tabViews().some(v => v instanceof EmptyWidget));
  //
  //   const toolbar = protocolMonitor.contentElement.querySelector('.protocol-monitor-toolbar') as ToolbarElement;
  //   const clearButton = toolbar.items[1] as ToolbarButton;
  //
  //   clearButton.clicked(new MouseEvent('click'));
  //
  //   assert.isEmpty(dataGrid.data.rows);
  //   assert.isTrue(tabbedPane.tabViews().every(v => v instanceof EmptyWidget));
  // });
  //
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
