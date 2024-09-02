// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';

import {ChangeManager} from './ChangeManager.js';
import {ExtensionScope, FREESTYLER_WORLD_NAME} from './ExtensionScope.js';
import {ExecutionError, FreestylerEvaluateAction, SideEffectError} from './FreestylerEvaluateAction.js';

// Example is based on `data:text/html,<div style="display:flex;justify-content:center;"><div>child</div></div>`;

const preamble = `# System instructions

You are a CSS debugging assistant integrated into Chrome DevTools.
The user selected a DOM element in DevTools and sends a query about the selected DOM element or the page.
You are going to answer the query using THOUGHT, ACTION, ANSWER keywords stricly following instructions for each keyword.

## Rules for producing THOUGHT

Use THOUGHT to explain what ACTIONs you plan to take and why.
Remember to consider CSS concepts such as the CSS cascade, explicit and implicit stacking contexts and various CSS layout types.
A THOUGHT is always followed by a TITLE.

## Rules for producing TITLE

Use TITLE to provide a short summary of the previous THOUGHT. TITLE always follows a THOUGHT.

## Rules for producing ACTION

Use ACTION to run JavaScript on the page. Following ACTION write the JavaScript code you want to run, followed by STOP.
Inside the ACTION's code use JavaScript and Web APIs to help fulfil the user query.
To return results from an ACTION, define the variable \`data\` inside the JavaScript code and put results into it.
DevTools will serialize the data as JSON and pass the result back to you as OBSERVATION.
The \`data\` from previous interactions will not be available in the JavaScript code.
You have access to a special $0 variable referencing the current element in the scope of the JavaScript code. Use $0 to learn about the selected element.
If you need to set styles on an HTML element, always call the \`async setElementStyles(el: Element, styles: object)\` function.

## Rules for producing ANSWER

After you collected the debugging information, you can answer the question with ANSWER.
If you cannot provide a definite answer, explain why. Do not ask the user for screenshots.
ANSWER is always followed by FIXABLE.

## Rules for producing FIXABLE

Write FIXABLE: true if the user request needs a fix using JavaScript or Web APIs and it has not been fixed previously.
FIXABLE always follows an ANSWER.

## Example conversation

QUERY: Why is this element centered in its container?

THOUGHT: Let's check the layout properties of the current element and its container.
TITLE: Checking layout properties
ACTION
const computedStyles = window.getComputedStyle($0);
const parentComputedStyles = window.getComputedStyle($0.parentElement);
const data = {
  styles: {
    display: computedStyles['display'],
    textAlign: computedStyles['textAlign'],
    justifyContent: computedStyles['justifyContent'],
    alignItems: computedStyles['alignItems'],
    justifySelf: computedStyles['justifySelf'],
    alignSelf: computedStyles['alignSelf'],
    position: computedStyles['position'],
  },
  parentStyles: {
    display: parentComputedStyles['display'],
    textAlign: parentComputedStyles['textAlign'],
    justifyContent: parentComputedStyles['justifyContent'],
    alignItems: parentComputedStyles['alignItems'],
    position: parentComputedStyles['position'],
  }
}
STOP

OBSERVATION: {"styles":{"display":"block","textAlign":"start","justifyContent":"normal","alignItems":"normal","justifySelf":"auto","alignSelf":"auto","position":"static"},"parentStyles":{"display":"flex","textAlign":"start","justifyContent":"center","alignItems":"normal","position":"static"}}

ANSWER: The element is centered horizontally within its container because the container is a flex container (\`display: flex\`) with \`justify-content\` set to \`center\`. This distributes the available space around the flex items, centering the element in this case.
FIXABLE: false`;

export const FIX_THIS_ISSUE_PROMPT = 'Fix this issue using JavaScript code execution';

export enum ResponseType {
  THOUGHT = 'thought',
  ACTION = 'action',
  SIDE_EFFECT = 'side-effect',
  ANSWER = 'answer',
  ERROR = 'error',
  QUERYING = 'querying',
}

export interface AnswerResponse {
  type: ResponseType.ANSWER;
  text: string;
  rpcId?: number;
  fixable: boolean;
}

export interface ErrorResponse {
  type: ResponseType.ERROR;
  error: string;
  rpcId?: number;
}

export interface ThoughtResponse {
  type: ResponseType.THOUGHT;
  thought: string;
  title?: string;
  rpcId?: number;
}

export interface SideEffectResponse {
  type: ResponseType.SIDE_EFFECT;
  code: string;
  confirm: (confirm: boolean) => void;
  rpcId?: number;
}

export interface ActionResponse {
  type: ResponseType.ACTION;
  code: string;
  output: string;
  rpcId?: number;
}

export interface QueryResponse {
  type: ResponseType.QUERYING;
}

export type ResponseData = AnswerResponse|ErrorResponse|ActionResponse|SideEffectResponse|ThoughtResponse|QueryResponse;

// TODO: this should use the current execution context pased on the
// node.
async function executeJsCode(code: string, {throwOnSideEffect}: {throwOnSideEffect: boolean}): Promise<string> {
  const target = UI.Context.Context.instance().flavor(SDK.Target.Target);
  if (!target) {
    throw new Error('Target is not found for executing code');
  }

  const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
  const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
  const pageAgent = target.pageAgent();
  if (!resourceTreeModel?.mainFrame) {
    throw new Error('Main frame is not found for executing code');
  }

  // This returns previously created world if it exists for the frame.
  const {executionContextId} = await pageAgent.invoke_createIsolatedWorld(
      {frameId: resourceTreeModel.mainFrame.id, worldName: FREESTYLER_WORLD_NAME});
  const executionContext = runtimeModel?.executionContext(executionContextId);
  if (!executionContext) {
    throw new Error('Execution context is not found for executing code');
  }

  try {
    return await FreestylerEvaluateAction.execute(code, executionContext, {throwOnSideEffect});
  } catch (err) {
    if (err instanceof ExecutionError) {
      return `Error: ${err.message}`;
    }

    throw err;
  }
}

type HistoryChunk = {
  text: string,
  entity: Host.AidaClient.Entity,
};

const MAX_STEPS = 10;
const MAX_OBSERVATION_BYTE_LENGTH = 25_000;

type CreateExtensionScopeFunction = (changes: ChangeManager) => {
  install(): Promise<void>, uninstall(): Promise<void>,
};

type AgentOptions = {
  aidaClient: Host.AidaClient.AidaClient,
  changeManager?: ChangeManager,
  confirmSideEffectForTest?: typeof Promise.withResolvers,
  serverSideLoggingEnabled?: boolean,
  createExtensionScope?: CreateExtensionScopeFunction,
  execJs?: typeof executeJsCode,
};

interface AidaRequestOptions {
  input: string;
  preamble?: string;
  chatHistory?: Host.AidaClient.Chunk[];
  /**
   * @default false
   */
  serverSideLoggingEnabled?: boolean;
  sessionId?: string;
}

/**
 * One agent instance handles one conversation. Create a new agent
 * instance for a new conversation.
 */
export class FreestylerAgent {
  static buildRequest(opts: AidaRequestOptions): Host.AidaClient.AidaRequest {
    const config = Common.Settings.Settings.instance().getHostConfig();
    const request: Host.AidaClient.AidaRequest = {
      input: opts.input,
      preamble: opts.preamble,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chat_history: opts.chatHistory,
      client: Host.AidaClient.CLIENT_NAME,
      options: {
        temperature: config.devToolsFreestylerDogfood?.temperature ?? 0,
        model_id: config.devToolsFreestylerDogfood?.modelId ?? undefined,
      },
      metadata: {
        // TODO: disable logging based on query params.
        disable_user_content_logging: !(opts.serverSideLoggingEnabled ?? false),
        string_session_id: opts.sessionId,
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      functionality_type: Host.AidaClient.FunctionalityType.CHAT,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_feature: Host.AidaClient.ClientFeature.CHROME_FREESTYLER,
    };
    return request;
  }

  static parseResponse(response: string):
      {thought?: string, title?: string, action?: string, answer?: string, fixable: boolean} {
    const lines = response.split('\n');
    let thought: string|undefined;
    let title: string|undefined;
    let action: string|undefined;
    let answer: string|undefined;
    let fixable = false;
    let i = 0;
    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('THOUGHT:') && !thought) {
        // TODO: multiline thoughts.
        thought = trimmed.substring('THOUGHT:'.length).trim();
        i++;
      } else if (trimmed.startsWith('TITLE:')) {
        title = trimmed.substring('TITLE:'.length).trim();
        i++;
      } else if (trimmed.startsWith('ACTION') && !action) {
        const actionLines = [];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== 'STOP') {
          // Sometimes the code block is in the form of "`````\njs\n{code}`````"
          if (lines[j].trim() !== 'js') {
            actionLines.push(lines[j]);
          }
          j++;
        }
        // TODO: perhaps trying to parse with a Markdown parser would
        // yield more reliable results.
        action = actionLines.join('\n').replaceAll('```', '').replaceAll('``', '').trim();
        i = j + 1;
      } else if (trimmed.startsWith('ANSWER:') && !answer) {
        const answerLines = [
          trimmed.substring('ANSWER:'.length).trim(),
        ];
        let j = i + 1;
        while (j < lines.length) {
          const line = lines[j].trim();
          if (line.startsWith('ACTION') || line.startsWith('OBSERVATION:') || line.startsWith('THOUGHT:') ||
              line.startsWith('FIXABLE:')) {
            break;
          }
          answerLines.push(lines[j]);
          j++;
        }
        answer = answerLines.join('\n').trim();
        i = j;
      } else if (trimmed.startsWith('FIXABLE: true')) {
        fixable = true;
        i++;
      } else {
        i++;
      }
    }
    // If we could not parse the parts, consider the response to be an
    // answer.
    if (!answer && !thought && !action) {
      answer = response;
    }
    return {thought, title, action, answer, fixable};
  }

  #aidaClient: Host.AidaClient.AidaClient;
  #chatHistory: Map<number, HistoryChunk[]> = new Map();
  #serverSideLoggingEnabled: boolean;

  #execJs: typeof executeJsCode;

  #confirmSideEffect: typeof Promise.withResolvers;
  readonly #sessionId = crypto.randomUUID();
  #changes: ChangeManager;
  #createExtensionScope: CreateExtensionScopeFunction;

  constructor(opts: AgentOptions) {
    this.#aidaClient = opts.aidaClient;
    this.#changes = opts.changeManager || new ChangeManager();
    this.#execJs = opts.execJs ?? executeJsCode;
    this.#createExtensionScope = opts.createExtensionScope ?? ((changes: ChangeManager) => {
                                   return new ExtensionScope(changes);
                                 });
    this.#serverSideLoggingEnabled = opts.serverSideLoggingEnabled ?? false;
    this.#confirmSideEffect = opts.confirmSideEffectForTest ?? (() => Promise.withResolvers());
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.PrimaryPageChanged,
        this.onPrimaryPageChanged, this);
  }

  onPrimaryPageChanged(): void {
    void this.#changes.clear();
  }

  get #getHistoryEntry(): Array<HistoryChunk> {
    return [...this.#chatHistory.values()].flat();
  }

  get chatHistoryForTesting(): Array<HistoryChunk> {
    return this.#getHistoryEntry;
  }

  async #aidaFetch(request: Host.AidaClient.AidaRequest): Promise<{response: string, rpcId: number|undefined}> {
    let response = '';
    let rpcId;
    for await (const lastResult of this.#aidaClient.fetch(request)) {
      response = lastResult.explanation;
      rpcId = lastResult.metadata.rpcGlobalId ?? rpcId;
      if (lastResult.metadata.attributionMetadata?.some(
              meta => meta.attributionAction === Host.AidaClient.RecitationAction.BLOCK)) {
        throw new Error('Attribution action does not allow providing the response');
      }
    }

    return {response, rpcId};
  }

  async #generateObservation(
      action: string,
      {
        throwOnSideEffect,
        confirmExecJs: confirm,
        execJsDeniedMessage: denyErrorMessage,
      }: {
        throwOnSideEffect: boolean,
        confirmExecJs?: Promise<boolean>,
        execJsDeniedMessage?: string,
      },
      ): Promise<{
    observation: string,
    sideEffect: boolean,
  }> {
    const actionExpression = `{const scope = {$0, $1, getEventListeners}; with (scope) {${
        action};((typeof data !== "undefined") ? data : undefined)}}`;
    try {
      const runConfirmed = await confirm ?? Promise.resolve(true);
      if (!runConfirmed) {
        throw new Error(denyErrorMessage ?? 'Code execution is not allowed');
      }
      const result = await this.#execJs(
          actionExpression,
          {throwOnSideEffect},
      );
      const byteCount = Platform.StringUtilities.countWtf8Bytes(result);
      if (byteCount > MAX_OBSERVATION_BYTE_LENGTH) {
        throw new Error('Output exceeded the maximum allowed length.');
      }
      return {
        observation: result,
        sideEffect: false,
      };
    } catch (error) {
      if (error instanceof SideEffectError) {
        return {
          observation: error.message,
          sideEffect: true,
        };
      }

      return {
        observation: `Error: ${error.message}`,
        sideEffect: false,
      };
    }
  }

  #runId = 0;
  async *
      run(query: string, options: {signal?: AbortSignal, isFixQuery: boolean} = {isFixQuery: false}):
          AsyncGenerator<ResponseData, void, void> {
    const genericErrorMessage = 'Sorry, I could not help you with this query.';
    const structuredLog = [];
    query = `QUERY: ${query}`;
    const currentRunId = ++this.#runId;

    options.signal?.addEventListener('abort', () => {
      this.#chatHistory.delete(currentRunId);
    });

    for (let i = 0; i < MAX_STEPS; i++) {
      yield {
        type: ResponseType.QUERYING,
      };

      const request = FreestylerAgent.buildRequest({
        input: query,
        preamble,
        chatHistory: this.#chatHistory.size ? this.#getHistoryEntry : undefined,
        serverSideLoggingEnabled: this.#serverSideLoggingEnabled,
        sessionId: this.#sessionId,
      });
      let response: string;
      let rpcId: number|undefined;
      try {
        const fetchResult = await this.#aidaFetch(request);
        response = fetchResult.response;
        rpcId = fetchResult.rpcId;
      } catch (err) {
        debugLog('Error calling the AIDA API', err);

        if (options.signal?.aborted) {
          break;
        }

        yield {
          type: ResponseType.ERROR,
          error: genericErrorMessage,
          rpcId,
        };
        break;
      }

      if (options.signal?.aborted) {
        break;
      }

      debugLog(`Iteration: ${i}`, 'Request', request, 'Response', response);
      structuredLog.push({
        request: structuredClone(request),
        response: response,
      });
      const currentRunEntries = this.#chatHistory.get(currentRunId) ?? [];
      this.#chatHistory.set(currentRunId, [
        ...currentRunEntries,
        {
          text: query,
          entity: Host.AidaClient.Entity.USER,
        },
        {
          text: response,
          entity: Host.AidaClient.Entity.SYSTEM,
        },
      ]);

      const {thought, title, action, answer, fixable} = FreestylerAgent.parseResponse(response);
      // Sometimes the answer will follow an action and a thought. In
      // that case, we only use the action and the thought (if present)
      // since the answer is not based on the observation resulted from
      // the action.
      if (action) {
        if (thought) {
          yield {
            type: ResponseType.THOUGHT,
            thought,
            title,
            rpcId,
          };
        }
        debugLog(`Action to execute: ${action}`);
        const scope = this.#createExtensionScope(this.#changes);
        await scope.install();
        try {
          let result = await this.#generateObservation(action, {throwOnSideEffect: !options.isFixQuery});
          debugLog(`Action result: ${result}`);
          if (result.sideEffect) {
            const sideEffectConfirmationPromiseWithResolvers = this.#confirmSideEffect<boolean>();
            if (isDebugMode()) {
              window.dispatchEvent(new CustomEvent(
                  'freestylersideeffect', {detail: {confirm: sideEffectConfirmationPromiseWithResolvers.resolve}}));
            }

            yield {
              type: ResponseType.SIDE_EFFECT,
              code: action,
              confirm: sideEffectConfirmationPromiseWithResolvers.resolve,
              rpcId,
            };

            result = await this.#generateObservation(action, {
              throwOnSideEffect: false,
              confirmExecJs: sideEffectConfirmationPromiseWithResolvers.promise,
              execJsDeniedMessage: result.observation,
            });
          }
          yield {
            type: ResponseType.ACTION,
            code: action,
            output: result.observation,
            rpcId,
          };

          query = `OBSERVATION: ${result.observation}`;
        } finally {
          await scope.uninstall();
        }
      } else if (answer) {
        yield {
          type: ResponseType.ANSWER,
          text: answer,
          rpcId,
          fixable,
        };
        break;
      } else {
        yield {
          type: ResponseType.ERROR,
          error: genericErrorMessage,
          rpcId,
        };
        break;
      }

      if (i === MAX_STEPS - 1) {
        yield {
          type: ResponseType.ERROR,
          error: 'Max steps reached, please try again.',
        };
        break;
      }
    }
    if (isDebugMode()) {
      localStorage.setItem('freestylerStructuredLog', JSON.stringify(structuredLog));
      window.dispatchEvent(new CustomEvent('freestylerdone'));
    }
  }
}

function isDebugMode(): boolean {
  return Boolean(localStorage.getItem('debugFreestylerEnabled'));
}

function debugLog(...log: unknown[]): void {
  if (!isDebugMode()) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(...log);
}

function setDebugFreestylerEnabled(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('debugFreestylerEnabled', 'true');
  } else {
    localStorage.removeItem('debugFreestylerEnabled');
  }
}

// @ts-ignore
globalThis.setDebugFreestylerEnabled = setDebugFreestylerEnabled;
