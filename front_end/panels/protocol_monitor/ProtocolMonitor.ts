// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Bindings from '../../models/bindings/bindings.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';
import * as Components from './components/components.js';

import protocolMonitorStyles from './protocolMonitor.css.js';

const {render, html, Directives: {ref}} = LitHtml;
type NewUserFilterTextEvent = DataGrid.DataGridEvents.NewUserFilterTextEvent;
type SubmitEditorEvent = Components.JSONEditor.SubmitEditorEvent;
const {WidgetElement} = UI.Widget;
const {SplitWidget} = UI.SplitWidget;
const {DataGridController} = DataGrid.DataGridController;
type JSONEditor = Components.JSONEditor.JSONEditor;
const {JSONEditor} = Components.JSONEditor;
const {ToolbarElement} = UI.Toolbar;
type ToolbarElement = UI.Toolbar.ToolbarElement;

const UIStrings = {
  /**
   *@description Text for one or a group of functions
   */
  method: 'Method',
  /**
   * @description Text in Protocol Monitor. Title for a table column which shows in which direction
   * the particular protocol message was travelling. Values in this column will either be 'sent' or
   * 'received'.
   */
  type: 'Type',
  /**
   * @description Text in Protocol Monitor of the Protocol Monitor tab. Noun relating to a network request.
   */
  request: 'Request',
  /**
   *@description Title of a cell content in protocol monitor. A Network response refers to the act of acknowledging a
  network request. Should not be confused with answer.
   */
  response: 'Response',
  /**
   *@description Text for timestamps of items
   */
  timestamp: 'Timestamp',
  /**
   *@description Title of a cell content in protocol monitor. It describes the time between sending a request and receiving a response.
   */
  elapsedTime: 'Elapsed time',
  /**
   *@description Text in Protocol Monitor of the Protocol Monitor tab
   */
  target: 'Target',
  /**
   *@description Text to record a series of actions for analysis
   */
  record: 'Record',
  /**
   *@description Text to clear everything
   */
  clearAll: 'Clear all',
  /**
   *@description Text to filter result items
   */
  filter: 'Filter',
  /**
   *@description Text for the documentation of something
   */
  documentation: 'Documentation',
  /**
   *@description Text to open the CDP editor with the selected command
   */
  editAndResend: 'Edit and resend',
  /**
   *@description Cell text content in Protocol Monitor of the Protocol Monitor tab
   *@example {30} PH1
   */
  sMs: '{PH1} ms',
  /**
   *@description Text in Protocol Monitor of the Protocol Monitor tab
   */
  noMessageSelected: 'No message selected',
  /**
   *@description Text in Protocol Monitor for the save button
   */
  save: 'Save',
  /**
   *@description Text in Protocol Monitor to describe the sessions column
   */
  session: 'Session',
  /**
   *@description A placeholder for an input in Protocol Monitor. The input accepts commands that are sent to the backend on Enter. CDP stands for Chrome DevTools Protocol.
   */
  sendRawCDPCommand: 'Send a raw `CDP` command',
  /**
   * @description A tooltip text for the input in the Protocol Monitor panel. The tooltip describes what format is expected.
   */
  sendRawCDPCommandExplanation:
      'Format: `\'Domain.commandName\'` for a command without parameters, or `\'{"command":"Domain.commandName", "parameters": {...}}\'` as a JSON object for a command with parameters. `\'cmd\'`/`\'method\'` and `\'args\'`/`\'params\'`/`\'arguments\'` are also supported as alternative keys for the `JSON` object.',

  /**
   * @description A label for a select input that allows selecting a CDP target to send the commands to.
   */
  selectTarget: 'Select a target',
  /**
   * @description Tooltip for the the console sidebar toggle in the Console panel. Command to
   * open/show the sidebar.
   */
  showCDPCommandEditor: 'Show CDP command editor',
  /**
   * @description Tooltip for the the console sidebar toggle in the Console panel. Command to
   * open/show the sidebar.
   */
  hideCDPCommandEditor: 'Hide  CDP command editor',
  /**
   * @description Screen reader announcement when the sidebar is shown in the Console panel.
   */
  CDPCommandEditorShown: 'CDP command editor shown',
  /**
   * @description Screen reader announcement when the sidebar is hidden in the Console panel.
   */
  CDPCommandEditorHidden: 'CDP command editor hidden',
};
const str_ = i18n.i18n.registerUIStrings('panels/protocol_monitor/ProtocolMonitor.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const timeRenderer = (value: DataGrid.DataGridUtils.CellValue): LitHtml.TemplateResult => {
  return LitHtml.html`${i18nString(UIStrings.sMs, {PH1: String(value)})}`;
};

export const buildProtocolMetadata = (domains: Iterable<ProtocolDomain>):
    Map<string, {parameters: Components.JSONEditor.Parameter[], description: string, replyArgs: string[]}> => {
      const metadataByCommand:
          Map<string, {parameters: Components.JSONEditor.Parameter[], description: string, replyArgs: string[]}> =
              new Map();
      for (const domain of domains) {
        for (const command of Object.keys(domain.metadata)) {
          metadataByCommand.set(command, domain.metadata[command]);
        }
      }
      return metadataByCommand;
    };

const metadataByCommand = buildProtocolMetadata(
    ProtocolClient.InspectorBackend.inspectorBackend.agentPrototypes.values() as Iterable<ProtocolDomain>);
const typesByName = ProtocolClient.InspectorBackend.inspectorBackend.typeMap;
const enumsByName = ProtocolClient.InspectorBackend.inspectorBackend.enumMap;
export interface Message {
  id?: number;
  method: string;
  error: Object;
  result: Object;
  params: Object;
  sessionId?: string;
}
export interface LogMessage {
  id?: number;
  domain: string;
  method: string;
  params: Object;
  type: 'send'|'recv';
}

export interface ProtocolDomain {
  readonly domain: string;
  readonly metadata: {
    [commandName: string]: {parameters: Components.JSONEditor.Parameter[], description: string, replyArgs: string[]},
  };
}

type Constructor<T, Args extends unknown[]> = {
  new (...args: Args): T,
};

function widgetRef<T extends UI.Widget.Widget, Args extends unknown[]>(
    type: Constructor<T, Args>, callback: (_: T) => any): ReturnType<typeof ref> {
  return ref((e?: Element) => {
    if (!(e instanceof WidgetElement || e instanceof UI.Widget.WidgetBaseElement)) {
      throw new Error(`Expected an element with a widget of type ${type.name} but got ${e?.constructor?.name}`);
    }
    if (!(e.getWidget() instanceof type)) {
      throw new Error(
          `Expected an element with a widget of type ${type.name} but got ${e.getWidget().constructor.name}`);
    }
    callback((e as UI.Widget.WidgetElement<T>).getWidget());
  });
}

function typedRef<T extends Element, Args extends unknown[]>(
    type: Constructor<T, Args>, callback: (_: T) => any): ReturnType<typeof ref> {
  return ref((e?: Element) => {
    if (!(e instanceof type)) {
      throw new Error(`Expected an element of type ${type.name} but got ${e?.constructor?.name}`);
    }
    callback(e as T);
  });
}

export class ProtocolMonitorImpl extends UI.Widget.VBox {
  // This width corresponds to the optimal width to use the editor properly
  // It is randomly chosen
  #sideBarMinWidth = 400;
  private started: boolean;
  private startTime: number;
  private readonly requestTimeForId: Map<number, number>;
  private readonly dataGridRowForId: Map<number, DataGrid.DataGridUtils.Row>;
  private infoWidget!: InfoWidget;
  private dataGrid!: DataGrid.DataGridController.DataGridController;
  private readonly textFilterUI: UI.Toolbar.ToolbarInput;
  #selectedTargetId?: string;
  #splitWidget!: UI.SplitWidget.SplitWidget;
  #editor!: Components.JSONEditor.JSONEditor;

  #createRecordButton(): UI.Toolbar.ToolbarToggle {
    const recordButton = new UI.Toolbar.ToolbarToggle(
        i18nString(UIStrings.record), 'record-start', 'record-stop', 'protocol-monitor.toggle-recording');
    recordButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
      recordButton.setToggled(!recordButton.toggled());
      this.setRecording(recordButton.toggled());
    });
    recordButton.setToggleWithRedColor(true);
    recordButton.setToggled(true);
    return recordButton;
  }

  #createClearButton(): UI.Toolbar.ToolbarButton {
    const clearButton =
        new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearAll), 'clear', undefined, 'protocol-monitor.clear-all');
    clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
      this.dataGrid.data = {
        ...this.dataGrid.data,
        rows: [],
      };
      this.infoWidget.render(null);
    });
    return clearButton;
  }

  #createSaveButton(): UI.Toolbar.ToolbarButton {
    const saveButton =
        new UI.Toolbar.ToolbarButton(i18nString(UIStrings.save), 'download', undefined, 'protocol-monitor.save');
    saveButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
      void this.saveAsFile();
    });
    return saveButton;
  }

  #createDataGridInitialData(): DataGrid.DataGridController.DataGridControllerData {
    return {
      paddingRowsCount: 100,
      showScrollbar: true,
      columns: [
        {
          id: 'type',
          title: i18nString(UIStrings.type),
          sortable: true,
          widthWeighting: 1,
          visible: true,
          hideable: true,
          styles: {
            'text-align': 'center',
          },
        },
        {
          id: 'method',
          title: i18nString(UIStrings.method),
          sortable: false,
          widthWeighting: 5,
          visible: true,
          hideable: false,
        },
        {
          id: 'request',
          title: i18nString(UIStrings.request),
          sortable: false,
          widthWeighting: 5,
          visible: true,
          hideable: true,
        },
        {
          id: 'response',
          title: i18nString(UIStrings.response),
          sortable: false,
          widthWeighting: 5,
          visible: true,
          hideable: true,
        },
        {
          id: 'elapsed-time',
          title: i18nString(UIStrings.elapsedTime),
          sortable: true,
          widthWeighting: 2,
          visible: false,
          hideable: true,
        },
        {
          id: 'timestamp',
          title: i18nString(UIStrings.timestamp),
          sortable: true,
          widthWeighting: 5,
          visible: false,
          hideable: true,
        },
        {
          id: 'target',
          title: i18nString(UIStrings.target),
          sortable: true,
          widthWeighting: 5,
          visible: false,
          hideable: true,
        },
        {
          id: 'session',
          title: i18nString(UIStrings.session),
          sortable: true,
          widthWeighting: 5,
          visible: false,
          hideable: true,
        },
      ],
      rows: [],
      contextMenus: {
        bodyRow:
            (menu: UI.ContextMenu.ContextMenu, columns: readonly DataGrid.DataGridUtils.Column[],
             row: Readonly<DataGrid.DataGridUtils.Row>) => {
              const methodColumn = DataGrid.DataGridUtils.getRowEntryForColumnId(row, 'method');
              const typeColumn = DataGrid.DataGridUtils.getRowEntryForColumnId(row, 'type');
              /**
               * You can click the "Edit and resend" item in the context menu to be
               * taken to the CDP editor with the filled with the selected command.
               */
              menu.editSection().appendItem(
                  i18nString(UIStrings.editAndResend),
                  () => {
                    if (!methodColumn.value) {
                      return;
                    }
                    const parameters = this.infoWidget.request;
                    const targetId = this.infoWidget.targetId;
                    const command = String(methodColumn.value);
                    if (this.#splitWidget.showMode() === UI.SplitWidget.ShowMode.OnlyMain) {
                      this.#splitWidget.toggleSidebar();
                    }
                    this.#editor.displayCommand(
                        command,
                        parameters,
                        targetId,
                    );
                  },
                  {jslogContext: 'edit-and-resend'},
              );

              /**
               * You can click the "Filter" item in the context menu to filter the
               * protocol monitor entries to those that match the method of the
               * current row.
               */
              menu.editSection().appendItem(i18nString(UIStrings.filter), () => {
                const methodColumn = DataGrid.DataGridUtils.getRowEntryForColumnId(row, 'method');
                this.textFilterUI.setValue(`method:${methodColumn.value}`, true);
              }, {jslogContext: 'filter'});

              /**
               * You can click the "Documentation" item in the context menu to be
               * taken to the CDP Documentation site entry for the given method.
               */
              menu.footerSection().appendItem(i18nString(UIStrings.documentation), () => {
                if (!methodColumn.value) {
                  return;
                }
                const [domain, method] = String(methodColumn.value).split('.');
                const type = typeColumn.value === 'sent' ? 'method' : 'event';
                Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(
                    `https://chromedevtools.github.io/devtools-protocol/tot/${domain}#${type}-${method}` as
                    Platform.DevToolsPath.UrlString);
              }, {jslogContext: 'documentation'});
            },
      },
    };
  }

  onCellFocused(event: DataGrid.DataGridEvents.BodyCellFocusedEvent): void {
    const focusedRow = event.data.row;
    const infoWidgetData = {
      request: DataGrid.DataGridUtils.getRowEntryForColumnId(focusedRow, 'request'),
      response: DataGrid.DataGridUtils.getRowEntryForColumnId(focusedRow, 'response'),
      target: DataGrid.DataGridUtils.getRowEntryForColumnId(focusedRow, 'target'),
      type: DataGrid.DataGridUtils.getRowEntryForColumnId(focusedRow, 'type').title as 'sent' | 'received' | undefined,
      selectedTab: event.data.cell.columnId === 'request' ? 'request' as const:
          event.data.cell.columnId === 'response'         ? 'response' as const:
                                                            undefined,
    };
    this.infoWidget.render(infoWidgetData);
  }

  #createTextFilterUI(): UI.Toolbar.ToolbarInput {
    const keys = ['method', 'request', 'response', 'type', 'target', 'session'];
    const filterParser = new TextUtils.TextUtils.FilterParser(keys);
    const suggestionBuilder = new UI.FilterSuggestionBuilder.FilterSuggestionBuilder(keys);

    const textFilterUI = new UI.Toolbar.ToolbarInput(
        i18nString(UIStrings.filter),
        '',
        1,
        0.2,
        '',
        suggestionBuilder.completions.bind(suggestionBuilder),
        true,
        'filter',
    );
    textFilterUI.addEventListener(
        UI.Toolbar.ToolbarInput.Event.TextChanged,
        event => {
          const query = event.data as string;
          const filters = filterParser.parse(query);
          this.dataGrid.data = {
            ...this.dataGrid.data,
            filters,
          };
        },
    );
    return textFilterUI;
  }

  #createCommandInput(): UI.Toolbar.ToolbarInput {
    const placeholder = i18nString(UIStrings.sendRawCDPCommand);
    const accessiblePlaceholder = placeholder;
    const growFactor = 1;
    const shrinkFactor = 0.2;
    const tooltip = i18nString(UIStrings.sendRawCDPCommandExplanation);
    const commandAutocompleteSuggestionProvider = new CommandAutocompleteSuggestionProvider();
    const input = new UI.Toolbar.ToolbarInput(
        placeholder,
        accessiblePlaceholder,
        growFactor,
        shrinkFactor,
        tooltip,
        commandAutocompleteSuggestionProvider.buildTextPromptCompletions,
        false,
        'command-input',
    );
    input.addEventListener(UI.Toolbar.ToolbarInput.Event.EnterPressed, () => {
      commandAutocompleteSuggestionProvider.addEntry(input.value());
      const {command, parameters} = parseCommandInput(input.value());
      this.onCommandSend(command, parameters, this.#selectedTargetId);
    });
    return input;
  }

  #createTargetSelector(): UI.Toolbar.ToolbarComboBox {
    const selector = new UI.Toolbar.ToolbarComboBox(() => {
      this.#selectedTargetId = selector.selectedOption()?.value;
    }, i18nString(UIStrings.selectTarget), undefined, 'target-selector');
    selector.setMaxWidth(120);
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const syncTargets = (): void => {
      selector.removeOptions();
      for (const target of targetManager.targets()) {
        selector.createOption(`${target.name()} (${target.inspectedURL()})`, target.id());
      }
    };
    targetManager.addEventListener(SDK.TargetManager.Events.AvailableTargetsChanged, syncTargets);
    syncTargets();
    return selector;
  }

  onCommandSend(command: string, parameters: object, target?: string): void {
    const test = ProtocolClient.InspectorBackend.test;
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const selectedTarget = target ? targetManager.targetById(target) : null;
    const sessionId = selectedTarget ? selectedTarget.sessionId : '';
    // TS thinks that properties are read-only because
    // in TS test is defined as a namespace.
    // @ts-ignore
    test.sendRawMessage(command, parameters, () => {}, sessionId);
  }

  override wasShown(): void {
    if (this.started) {
      return;
    }
    this.registerCSSFiles([protocolMonitorStyles]);
    this.started = true;
    this.startTime = Date.now();
    this.setRecording(true);
  }

  private setRecording(recording: boolean): void {
    const test = ProtocolClient.InspectorBackend.test;
    if (recording) {
      // TODO: TS thinks that properties are read-only because
      // in TS test is defined as a namespace.
      // @ts-ignore
      test.onMessageSent = this.messageSent.bind(this);
      // @ts-ignore
      test.onMessageReceived = this.messageReceived.bind(this);
    } else {
      // @ts-ignore
      test.onMessageSent = null;
      // @ts-ignore
      test.onMessageReceived = null;
    }
  }

  private targetToString(target: SDK.Target.Target|null): string {
    if (!target) {
      return '';
    }
    return target.decorateLabel(
        `${target.name()} ${target === SDK.TargetManager.TargetManager.instance().rootTarget() ? '' : target.id()}`);
  }

  private messageReceived(message: Message, target: ProtocolClient.InspectorBackend.TargetBase|null): void {
    if ('id' in message && message.id) {
      const existingRow = this.dataGridRowForId.get(message.id);
      if (!existingRow) {
        return;
      }
      const allExistingRows = this.dataGrid.data.rows;
      const matchingExistingRowIndex = allExistingRows.findIndex(r => existingRow === r);
      const newRowWithUpdate = {
        ...existingRow,
        cells: existingRow.cells.map(cell => {
          if (cell.columnId === 'response') {
            return {
              ...cell,
              value: JSON.stringify(message.result || message.error),

            };
          }

          if (cell.columnId === 'elapsed-time') {
            const requestTime = this.requestTimeForId.get(message.id as number);
            if (requestTime) {
              return {
                ...cell,
                value: Date.now() - requestTime,
                renderer: timeRenderer,
              };
            }
          }

          return cell;
        }),
      };

      const newRowsArray = [...this.dataGrid.data.rows];
      newRowsArray[matchingExistingRowIndex] = newRowWithUpdate;

      // Now we've updated the message, it won't be updated again, so we can delete it from the tracking map.
      this.dataGridRowForId.delete(message.id);
      this.dataGrid.data = {
        ...this.dataGrid.data,
        rows: newRowsArray,
      };
      return;
    }

    const sdkTarget = target as SDK.Target.Target | null;
    const responseIcon = new IconButton.Icon.Icon();
    responseIcon.data = {iconName: 'arrow-down', color: 'var(--icon-request)', width: '16px', height: '16px'};
    const newRow: DataGrid.DataGridUtils.Row = {
      cells: [
        {columnId: 'method', value: message.method, title: message.method},
        {columnId: 'request', value: '', renderer: DataGrid.DataGridRenderers.codeBlockRenderer},
        {
          columnId: 'response',
          value: JSON.stringify(message.params),
          renderer: DataGrid.DataGridRenderers.codeBlockRenderer,
        },
        {
          columnId: 'timestamp',
          value: Date.now() - this.startTime,
          renderer: timeRenderer,
        },
        {columnId: 'elapsed-time', value: ''},
        {columnId: 'type', value: responseIcon, title: 'received', renderer: DataGrid.DataGridRenderers.iconRenderer},
        {columnId: 'target', value: this.targetToString(sdkTarget)},
        {columnId: 'session', value: message.sessionId || ''},
      ],
      hidden: false,
    };

    this.dataGrid.data = {
      ...this.dataGrid.data,
      rows: this.dataGrid.data.rows.concat([newRow]),
    };
  }

  private messageSent(
      message: {domain: string, method: string, params: Object, id: number, sessionId?: string},
      target: ProtocolClient.InspectorBackend.TargetBase|null): void {
    const sdkTarget = target as SDK.Target.Target | null;
    const requestResponseIcon = new IconButton.Icon.Icon();
    requestResponseIcon
        .data = {iconName: 'arrow-up-down', color: 'var(--icon-request-response)', width: '16px', height: '16px'};
    const newRow: DataGrid.DataGridUtils.Row = {
      styles: {
        '--override-data-grid-row-background-color': 'var(--sys-color-surface3)',
      },
      cells: [
        {columnId: 'method', value: message.method, title: message.method},
        {
          columnId: 'request',
          value: JSON.stringify(message.params),
          renderer: DataGrid.DataGridRenderers.codeBlockRenderer,
        },
        {columnId: 'response', value: '(pending)', renderer: DataGrid.DataGridRenderers.codeBlockRenderer},
        {
          columnId: 'timestamp',
          value: Date.now() - this.startTime,
          renderer: timeRenderer,
        },
        {columnId: 'elapsed-time', value: '(pending)'},
        {
          columnId: 'type',
          value: requestResponseIcon,
          title: 'sent',
          renderer: DataGrid.DataGridRenderers.iconRenderer,
        },
        {columnId: 'target', value: String(sdkTarget?.id())},
        {columnId: 'session', value: message.sessionId || ''},
      ],
      hidden: false,
    };
    this.requestTimeForId.set(message.id, Date.now());
    this.dataGridRowForId.set(message.id, newRow);
    this.dataGrid.data = {
      ...this.dataGrid.data,
      rows: this.dataGrid.data.rows.concat([newRow]),
    };
  }

  private async saveAsFile(): Promise<void> {
    const now = new Date();
    const fileName = 'ProtocolMonitor-' + Platform.DateUtilities.toISO8601Compact(now) + '.json' as
        Platform.DevToolsPath.RawPathString;
    const stream = new Bindings.FileUtils.FileOutputStream();

    const accepted = await stream.open(fileName);
    if (!accepted) {
      return;
    }

    const rowEntries = [];
    for (const row of this.dataGrid.data.rows) {
      const rowEntry = Object.fromEntries(row.cells.map(cell => ([cell.columnId, cell.value])));
      rowEntries.push(rowEntry);
    }

    void stream.write(JSON.stringify(rowEntries, null, '  '));
    void stream.close();
  }

  constructor() {
    super(true);
    this.started = false;
    this.startTime = 0;
    this.dataGridRowForId = new Map();
    this.requestTimeForId = new Map();

    this.textFilterUI = this.#createTextFilterUI();
    this.contentElement.classList.add('protocol-monitor');
    this.element.setAttribute('jslog', `${VisualLogging.panel('protocol-monitor').track({resize: true})}`);
    this.dataGrid = new DataGrid.DataGridController.DataGridController();
    let bottomToolbar!: ToolbarElement;
    render(
        html`<devtools-split-widget .options=${{
          vertical:
            true, defaultSidebarWidth: this.#sideBarMinWidth,
        }}
                                  ${widgetRef(SplitWidget, e => this.#splitWidget = e)}>
            <div slot="main" class="widget vbox protocol-monitor">
              <devtools-toolbar class="protocol-monitor-toolbar"
                                jslog=${VisualLogging.toolbar('top')}
                                .items=${
                [this.#createRecordButton(),
                 this.#createClearButton(),
                 this.#createSaveButton(),
                 this.textFilterUI,
    ]}></devtools-toolbar>
              <devtools-split-widget .options=${{
          vertical:
            true, secondIsSidebar: true, settingName: 'protocol-monitor-panel-split', defaultSidebarWidth: 250,
        }}>
                <devtools-data-grid-controller
                  .data=${this.#createDataGridInitialData()}
                  @cellfocused=${this.onCellFocused}
                  @newuserfiltertext=${
            (event: NewUserFilterTextEvent) =>
                this.textFilterUI.setValue(event.data.filterText, /* notify listeners */ true)}
                  slot="main"
                  ${typedRef(DataGridController, e => this.dataGrid = e)}>
                </devtools-data-grid-controller>
                <div is="devtools-widget" .widgetClass=${InfoWidget}
                     ${widgetRef(InfoWidget, e => this.infoWidget = e)}
                     slot="sidebar"></div>
              </devtools-split-widget>
               <devtools-toolbar class="protocol-monitor-bottom-toolbar"
                 jslog=${VisualLogging.toolbar('bottom')}
                 ${typedRef(ToolbarElement, e => bottomToolbar = e)}>
                </devtools-toolbar>
            </div>
            <devtools-json-editor jslog=${VisualLogging.pane('command-editor').track({
          resize: true,
        })}
                                  ${typedRef(JSONEditor, e => this.#editor = e)}
                                  slot="sidebar"
                                  style="overflow:hidden"
                                  .metadataByCommand=${metadataByCommand}
                                  .typesByName=${
            typesByName as Map < string,
            Components.JSONEditor.Parameter[] >}
                                  .enumsByName=${enumsByName}
                  @submiteditor=${
            (event: SubmitEditorEvent) =>
                this.onCommandSend(event.data.command, event.data.parameters, event.data.targetId)}>
            </devtools-json-editor>
          </div>`,
        this.contentElement, {host: this});
    this.#splitWidget.hideSidebar(true);
    const commandInput = this.#createCommandInput();
    const selector = this.#createTargetSelector();
    bottomToolbar.items = [
      this.#splitWidget.createShowHideSidebarButton(
          i18nString(UIStrings.showCDPCommandEditor),
          i18nString(UIStrings.hideCDPCommandEditor),
          i18nString(UIStrings.CDPCommandEditorShown),
          i18nString(UIStrings.CDPCommandEditorHidden),
          'protocol-monitor.toggle-command-editor',
          ),
      commandInput,
      selector,
    ];
    const shadowRoot = bottomToolbar?.shadowRoot;
    const inputBar = shadowRoot?.querySelector('.toolbar-input');
    const tabSelector = shadowRoot?.querySelector('.toolbar-select-container');

    const populateToolbarInput = (): void => {
      const commandJson = this.#editor.getCommandJson();
      const targetId = this.#editor.targetId;
      if (targetId) {
        const selectedIndex = selector.options().findIndex(option => option.value === targetId);
        if (selectedIndex !== -1) {
          selector.setSelectedIndex(selectedIndex);
          this.#selectedTargetId = targetId;
        }
      }
      if (commandJson) {
        commandInput.setValue(commandJson);
      }
    };

    this.#splitWidget.addEventListener(UI.SplitWidget.Events.ShowModeChanged, (event => {
                                         if (event.data === 'OnlyMain') {
                                           populateToolbarInput();

                                           inputBar?.setAttribute('style', 'display:flex; flex-grow: 1');
                                           tabSelector?.setAttribute('style', 'display:flex');
                                         } else {
                                           const {command, parameters} = parseCommandInput(commandInput.value());
                                           this.#editor.displayCommand(
                                               command,
                                               parameters,
                                               this.#selectedTargetId,
                                           );
                                           inputBar?.setAttribute('style', 'display:none');
                                           tabSelector?.setAttribute('style', 'display:none');
                                         }
                                       }));
  }
}

export class CommandAutocompleteSuggestionProvider {
  #maxHistorySize = 200;
  #commandHistory = new Set<string>();

  constructor(maxHistorySize?: number) {
    if (maxHistorySize !== undefined) {
      this.#maxHistorySize = maxHistorySize;
    }
  }

  buildTextPromptCompletions =
      async(expression: string, prefix: string, force?: boolean): Promise<UI.SuggestBox.Suggestions> => {
    if (!prefix && !force && expression) {
      return [];
    }

    const newestToOldest = [...this.#commandHistory].reverse();
    newestToOldest.push(...metadataByCommand.keys());
    return newestToOldest.filter(cmd => cmd.startsWith(prefix)).map(text => ({
                                                                      text,
                                                                    }));
  };

  addEntry(value: string): void {
    if (this.#commandHistory.has(value)) {
      this.#commandHistory.delete(value);
    }
    this.#commandHistory.add(value);
    if (this.#commandHistory.size > this.#maxHistorySize) {
      const earliestEntry = this.#commandHistory.values().next().value;
      this.#commandHistory.delete(earliestEntry);
    }
  }
}

export class InfoWidget extends UI.Widget.VBox {
  private readonly tabbedPane: UI.TabbedPane.TabbedPane;
  request: {[x: string]: unknown};
  targetId = '';
  constructor(element: UI.Widget.WidgetElement<InfoWidget>) {
    super(element as unknown as UI.Widget.WidgetElement);
    this.tabbedPane = new UI.TabbedPane.TabbedPane();
    this.tabbedPane.appendTab('request', i18nString(UIStrings.request), new UI.Widget.Widget());
    this.tabbedPane.appendTab('response', i18nString(UIStrings.response), new UI.Widget.Widget());
    this.tabbedPane.show(this.contentElement);
    this.tabbedPane.selectTab('response');
    this.request = {};
    this.render(null);
  }

  render(data: {
    request: DataGrid.DataGridUtils.Cell|undefined,
    response: DataGrid.DataGridUtils.Cell|undefined,
    target: DataGrid.DataGridUtils.Cell|undefined,
    type: 'sent'|'received'|undefined,
    selectedTab: 'request'|'response'|undefined,
  }|null): void {
    if (!data || !data.request || !data.response || !data.target) {
      this.tabbedPane.changeTabView('request', new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.noMessageSelected)));
      this.tabbedPane.changeTabView(
          'response', new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.noMessageSelected)));
      return;
    }

    const requestEnabled = data && data.type && data.type === 'sent';
    this.tabbedPane.setTabEnabled('request', Boolean(requestEnabled));
    if (!requestEnabled) {
      this.tabbedPane.selectTab('response');
    }

    const requestParsed = JSON.parse(String(data.request.value) || 'null');
    this.request = requestParsed;
    this.targetId = String(data.target.value);
    this.tabbedPane.changeTabView('request', SourceFrame.JSONView.JSONView.createViewSync(requestParsed));
    const responseParsed =
        data.response.value === '(pending)' ? null : JSON.parse(String(data.response.value) || 'null');
    this.tabbedPane.changeTabView('response', SourceFrame.JSONView.JSONView.createViewSync(responseParsed));
    if (data.selectedTab) {
      this.tabbedPane.selectTab(data.selectedTab);
    }
  }
}

export const enum Events {
  CommandSent = 'CommandSent',
  CommandChange = 'CommandChange',
}

export type EventTypes = {
  [Events.CommandSent]: Components.JSONEditor.Command,
  [Events.CommandChange]: Components.JSONEditor.Command,
};

export function parseCommandInput(input: string): {command: string, parameters: {[paramName: string]: unknown}} {
  // If input cannot be parsed as json, we assume it's the command name
  // for a command without parameters. Otherwise, we expect an object
  // with "command"/"method"/"cmd" and "parameters"/"params"/"args"/"arguments" attributes.
  let json = null;
  try {
    json = JSON.parse(input);
  } catch (err) {
  }

  const command = json ? json.command || json.method || json.cmd || '' : input;
  const parameters = json?.parameters || json?.params || json?.args || json?.arguments || {};

  return {command, parameters};
}
