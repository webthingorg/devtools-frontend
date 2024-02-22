// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as Host from '../../../../core/host/host.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as Diff from '../../../../third_party/diff/diff.js';
import * as UI from '../../legacy.js';

import {FilteredListWidget, Provider, registerProvider} from './FilteredListWidget.js';
import {QuickOpenImpl} from './QuickOpen.js';

const UIStrings = {
  /**
   * @description Message to display if a setting change requires a reload of DevTools
   */
  oneOrMoreSettingsHaveChanged: 'One or more settings have changed which requires a reload to take effect.',
  /**
   * @description Text in Command Menu of the Command Menu
   */
  noCommandsFound: 'No commands found',
  /**
   * @description Text for command prefix of run a command
   */
  run: 'Run',
  /**
   * @description Text for command suggestion of run a command
   */
  command: 'Command',
  /**
   * @description Hint text to indicate that a selected command is deprecated
   */
  deprecated: '— deprecated',

  /**
   * @description Hint text to indicate that AI will take a while to respond
   */
  queryingAI: 'querying AI – this is going to take a while',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/quick_open/CommandMenu.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let commandMenuInstance: CommandMenu;

interface AidaRequest {
  input: string;
  client: string;
  options?: {
    temperature?: Number,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    model_id?: string,
  };
}

export class CommandMenu {
  private readonly commandsInternal: Command[];
  private commandPrompt: string;
  private constructor() {
    this.commandsInternal = [];
    this.commandPrompt = '';
    this.loadCommands();
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): CommandMenu {
    const {forceNew} = opts;
    if (!commandMenuInstance || forceNew) {
      commandMenuInstance = new CommandMenu();
    }
    return commandMenuInstance;
  }

  static createCommand(options: CreateCommandOptions): Command {
    const {
      category,
      keys,
      title,
      shortcut,
      executeHandler,
      availableHandler,
      userActionCode,
      deprecationWarning,
      isPanelOrDrawer,
    } = options;

    let handler = executeHandler;
    if (userActionCode) {
      const actionCode = userActionCode;
      handler = () => {
        Host.userMetrics.actionTaken(actionCode);
        executeHandler();
      };
    }
    return new Command(category, title, keys, shortcut, handler, availableHandler, deprecationWarning, isPanelOrDrawer);
  }

  static createSettingCommand<V>(setting: Common.Settings.Setting<V>, title: Common.UIString.LocalizedString, value: V):
      Command {
    const category = setting.category();
    if (!category) {
      throw new Error(`Creating '${title}' setting command failed. Setting has no category.`);
    }
    const tags = setting.tags() || '';
    const reloadRequired = Boolean(setting.reloadRequired());

    return CommandMenu.createCommand({
      category: Common.Settings.getLocalizedSettingsCategory(category),
      keys: tags,
      title,
      shortcut: '',
      executeHandler: () => {
        if (setting.deprecation?.disabled &&
            (!setting.deprecation?.experiment || setting.deprecation.experiment.isEnabled())) {
          void Common.Revealer.reveal(setting);
          return;
        }
        setting.set(value);

        if (setting.name === 'emulate-page-focus') {
          Host.userMetrics.actionTaken(Host.UserMetrics.Action.ToggleEmulateFocusedPageFromCommandMenu);
        }

        if (reloadRequired) {
          UI.InspectorView.InspectorView.instance().displayReloadRequiredWarning(
              i18nString(UIStrings.oneOrMoreSettingsHaveChanged));
        }
      },
      availableHandler,
      userActionCode: undefined,
      deprecationWarning: setting.deprecation?.warning,
    });

    function availableHandler(): boolean {
      return setting.get() !== value;
    }
  }

  static createActionCommand(options: ActionCommandOptions): Command {
    const {action, userActionCode} = options;
    const category = action.category();
    if (!category) {
      throw new Error(`Creating '${action.title()}' action command failed. Action has no category.`);
    }

    let panelOrDrawer = undefined;
    if (category === UI.ActionRegistration.ActionCategory.DRAWER) {
      panelOrDrawer = PanelOrDrawer.DRAWER;
    }

    const shortcut = UI.ShortcutRegistry.ShortcutRegistry.instance().shortcutTitleForAction(action.id()) || '';

    return CommandMenu.createCommand({
      category: UI.ActionRegistration.getLocalizedActionCategory(category),
      keys: action.tags() || '',
      title: action.title(),
      shortcut,
      executeHandler: action.execute.bind(action),
      userActionCode,
      availableHandler: undefined,
      isPanelOrDrawer: panelOrDrawer,
    });
  }

  static createRevealViewCommand(options: RevealViewCommandOptions): Command {
    const {title, tags, category, userActionCode, id} = options;
    if (!category) {
      throw new Error(`Creating '${title}' reveal view command failed. Reveal view has no category.`);
    }
    let panelOrDrawer = undefined;
    if (category === UI.ViewManager.ViewLocationCategory.PANEL) {
      panelOrDrawer = PanelOrDrawer.PANEL;
    } else if (category === UI.ViewManager.ViewLocationCategory.DRAWER) {
      panelOrDrawer = PanelOrDrawer.DRAWER;
    }

    const executeHandler = (): Promise<void> => {
      if (id === 'issues-pane') {
        Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.CommandMenu);
      }
      return UI.ViewManager.ViewManager.instance().showView(id, /* userGesture */ true);
    };

    return CommandMenu.createCommand({
      category: UI.ViewManager.getLocalizedViewLocationCategory(category),
      keys: tags,
      title,
      shortcut: '',
      executeHandler,
      userActionCode,
      availableHandler: undefined,
      isPanelOrDrawer: panelOrDrawer,
    });
  }

  private loadCommands(): void {
    const locations = new Map<UI.ViewManager.ViewLocationValues, UI.ViewManager.ViewLocationCategory>();
    for (const {category, name} of UI.ViewManager.getRegisteredLocationResolvers()) {
      if (category && name) {
        locations.set(name, category);
      }
    }
    const views = UI.ViewManager.getRegisteredViewExtensions();
    for (const view of views) {
      const viewLocation = view.location();
      const category = viewLocation && locations.get(viewLocation);
      if (!category) {
        continue;
      }

      const options: RevealViewCommandOptions = {
        title: view.commandPrompt(),
        tags: view.tags() || '',
        category,
        userActionCode: undefined,
        id: view.viewId(),
      };
      this.commandsInternal.push(CommandMenu.createRevealViewCommand(options));
    }
    // Populate allowlisted settings.
    const settingsRegistrations = Common.Settings.getRegisteredSettings();
    for (const settingRegistration of settingsRegistrations) {
      const options = settingRegistration.options;
      if (!options || !settingRegistration.category) {
        continue;
      }
      for (const pair of options) {
        const setting = Common.Settings.Settings.instance().moduleSetting(settingRegistration.settingName);
        this.commandsInternal.push(CommandMenu.createSettingCommand(setting, pair.title(), pair.value));
      }
    }
  }

  commands(): Command[] {
    return this.commandsInternal;
  }
}
export interface ActionCommandOptions {
  action: UI.ActionRegistration.Action;
  userActionCode?: number;
}

export interface RevealViewCommandOptions {
  id: string;
  title: Common.UIString.LocalizedString;
  tags: string;
  category: UI.ViewManager.ViewLocationCategory;
  userActionCode?: number;
}

export interface CreateCommandOptions {
  category: Platform.UIString.LocalizedString;
  keys: string;
  title: Common.UIString.LocalizedString;
  shortcut: string;
  executeHandler: () => void;
  availableHandler?: () => boolean;
  userActionCode?: number;
  deprecationWarning?: Platform.UIString.LocalizedString;
  isPanelOrDrawer?: PanelOrDrawer;
}

export const enum PanelOrDrawer {
  PANEL = 'PANEL',
  DRAWER = 'DRAWER',
}

export class CommandMenuProvider extends Provider {
  private commands: Command[];
  private commandPrompt: string;
  private queryingAI: boolean = false;

  constructor(commandsForTest: Command[] = []) {
    super();
    this.commands = commandsForTest;
    this.commandPrompt = '';
  }

  override attach(): void {
    const allCommands = CommandMenu.instance().commands();

    // Populate allowlisted actions.
    const actions = UI.ActionRegistry.ActionRegistry.instance().availableActions();
    for (const action of actions) {
      const category = action.category();
      if (!category) {
        continue;
      }

      const options: ActionCommandOptions = {action, userActionCode: undefined};
      this.commands.push(CommandMenu.createActionCommand(options));
    }

    for (const command of allCommands) {
      if (!command.available()) {
        continue;
      }
      if (this.commands.find(({title, category}) => title === command.title && category === command.category)) {
        continue;
      }
      this.commands.push(command);
    }

    this.commands = this.commands.sort(commandComparator);

    this.commandPrompt = '';
    for (const [index, command] of this.commands.entries()) {
      this.commandPrompt += index + ': (' + command.title + ', ' + command.key.replace('\u0000', ', ') + ')\n';
    }

    function commandComparator(left: Command, right: Command): number {
      const cats = Platform.StringUtilities.compare(left.category, right.category);
      return cats ? cats : Platform.StringUtilities.compare(left.title, right.title);
    }
  }

  override detach(): void {
    this.commands = [];
  }

  override itemCount(): number {
    return this.commands.length;
  }

  override itemKeyAt(itemIndex: number): string {
    return this.commands[itemIndex].key;
  }

  override itemScoreAt(itemIndex: number, query: string): number {
    const command = this.commands[itemIndex];
    let score = Diff.Diff.DiffWrapper.characterScore(query.toLowerCase(), command.title.toLowerCase());

    // Score panel/drawer reveals above regular actions.
    if (command.isPanelOrDrawer === PanelOrDrawer.PANEL) {
      score += 2;
    } else if (command.isPanelOrDrawer === PanelOrDrawer.DRAWER) {
      score += 1;
    }

    return score;
  }

  override renderItem(itemIndex: number, query: string, titleElement: Element, subtitleElement: Element): void {
    const command = this.commands[itemIndex];

    titleElement.removeChildren();
    UI.UIUtils.createTextChild(titleElement, command.title);
    FilteredListWidget.highlightRanges(titleElement, query, true);

    subtitleElement.textContent = command.shortcut;

    const deprecationWarning = command.deprecationWarning;
    if (deprecationWarning) {
      const deprecatedTagElement = (titleElement.parentElement?.createChild('span', 'deprecated-tag') as HTMLElement);
      if (deprecatedTagElement) {
        deprecatedTagElement.textContent = i18nString(UIStrings.deprecated);
        deprecatedTagElement.title = deprecationWarning;
      }
    }
    const tagElement = (titleElement.parentElement?.parentElement?.createChild('span', 'tag') as HTMLElement);
    if (!tagElement) {
      return;
    }
    const index = Platform.StringUtilities.hashCode(command.category) % MaterialPaletteColors.length;
    tagElement.style.backgroundColor = MaterialPaletteColors[index];
    tagElement.style.color = '#fff';
    tagElement.textContent = command.category;
  }

  override selectItem(itemIndex: number|null, _promptValue: string): void {
    if (itemIndex === null) {
      return;
    }
    this.commands[itemIndex].execute();
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.SelectCommandFromCommandMenu);
  }

  override notFoundText(): string {
    if (this.queryingAI) {
      return i18nString(UIStrings.queryingAI);
    }
    return i18nString(UIStrings.noCommandsFound);
  }

  setQueryingAI(queryingAI: boolean): void {
    this.queryingAI = queryingAI;
  }

  override queryChanged(query: string, filterItems: (forcedTop: number[]) => void): void {
    if (query.endsWith('?')) {
      const prompt = 'This is the available list of commands by index:\n' + this.commandPrompt + '\n\n' +
          'Give me the indices of the five most suitable commands in this list for this query, ranked in decreasing suitability:\n' +
          query;
      const aiRanking: number[] = [];
      const setQueryingAI = this.setQueryingAI.bind(this);
      setQueryingAI(true);
      this.getRanking(prompt)
          .then(function(value) {
            for (const match of value.matchAll(/\d+/g)) {
              aiRanking.push(parseInt(match[0]));
            }
          })
          .finally(function() {
            setQueryingAI(false);
          })
          .then(function() {
            filterItems(aiRanking);
          });
    }
    return undefined;
  }

  buildApiRequest(input: string): AidaRequest {
    const request: AidaRequest = {
      input,
      client: 'CHROME_DEVTOOLS',
      options: {
        temperature: 0,
        model_id: 'codey_gemit_m_streaming_chrome',
      },
    };
    return request;
  }

  async getRanking(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!Host.InspectorFrontendHost.InspectorFrontendHostInstance.doAidaConversation) {
        return reject(new Error('doAidaConversation is not available'));
      }
      console.time('request');
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.doAidaConversation(
          JSON.stringify(this.buildApiRequest(input)),
          result => {
            console.timeEnd('request');
            try {
              const results = JSON.parse(result.response);
              const text = [];
              let inCodeChunk = false;
              const CODE_CHUNK_SEPARATOR = '\n`````\n';
              for (const result of results) {
                if ('textChunk' in result) {
                  if (inCodeChunk) {
                    text.push(CODE_CHUNK_SEPARATOR);
                    inCodeChunk = false;
                  }
                  text.push(result.textChunk.text);
                } else if ('codeChunk' in result) {
                  if (!inCodeChunk) {
                    text.push(CODE_CHUNK_SEPARATOR);
                    inCodeChunk = true;
                  }
                  text.push(result.codeChunk.code);
                } else if ('error' in result) {
                  if (result['detail']?.[0]?.error?.code === 403) {
                    throw new Error('Server responded: permission denied');
                  }
                  throw new Error(`Server responded: ${JSON.stringify(result)}`);
                } else {
                  throw new Error('Unknown chunk result');
                }
              }
              if (inCodeChunk) {
                text.push(CODE_CHUNK_SEPARATOR);
                inCodeChunk = false;
              }
              resolve(text.join(''));
            } catch (err) {
              reject(err);
            }
          },
      );
    });
  }
}

export const MaterialPaletteColors = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
];

export class Command {
  readonly category: Common.UIString.LocalizedString;
  readonly title: Common.UIString.LocalizedString;
  readonly key: string;
  readonly shortcut: string;
  readonly deprecationWarning?: Platform.UIString.LocalizedString;
  readonly isPanelOrDrawer?: PanelOrDrawer;

  readonly #executeHandler: () => unknown;
  readonly #availableHandler?: () => boolean;

  constructor(
      category: Common.UIString.LocalizedString, title: Common.UIString.LocalizedString, key: string, shortcut: string,
      executeHandler: () => unknown, availableHandler?: () => boolean,
      deprecationWarning?: Platform.UIString.LocalizedString, isPanelOrDrawer?: PanelOrDrawer) {
    this.category = category;
    this.title = title;
    this.key = category + '\0' + title + '\0' + key;
    this.shortcut = shortcut;
    this.#executeHandler = executeHandler;
    this.#availableHandler = availableHandler;
    this.deprecationWarning = deprecationWarning;
    this.isPanelOrDrawer = isPanelOrDrawer;
  }

  available(): boolean {
    return this.#availableHandler ? this.#availableHandler() : true;
  }

  execute(): unknown {
    return this.#executeHandler();  // Tests might want to await the action in case it's async.
  }
}

export class ShowActionDelegate implements UI.ActionRegistration.ActionDelegate {
  handleAction(_context: UI.Context.Context, _actionId: string): boolean {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();
    QuickOpenImpl.show('>');
    return true;
  }
}

registerProvider({
  prefix: '>',
  iconName: 'chevron-right',
  iconWidth: '20px',
  provider: () => Promise.resolve(new CommandMenuProvider()),
  titlePrefix: () => i18nString(UIStrings.run),
  titleSuggestion: () => i18nString(UIStrings.command),
});
