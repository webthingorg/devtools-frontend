import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import {BreakpointManager} from './BreakpointManager.js';

let debuggerStateManagerInstance: DebuggerStateManager;

export class DebuggerStateManager implements SDK.TargetManager.SDKModelObserver<SDK.DebuggerModel.DebuggerModel> {

  private debuggerModels : Set<SDK.DebuggerModel.DebuggerModel>;
  private breakpointManager : BreakpointManager;

  private constructor() {
    this.debuggerModels = new Set();
    this.breakpointManager = BreakpointManager.instance();
    this.breakpointManager.targetManager.observeModels(SDK.DebuggerModel.DebuggerModel, this);

  }

  static instance(opts: {forceNew: boolean|null}) {
    if (!debuggerStateManagerInstance || opts.forceNew) {
      console.error('Creating new instance');
      debuggerStateManagerInstance = new DebuggerStateManager();
    }
  }

  onEnabledEvent = (event: Common.EventTarget.EventTargetEvent<SDK.DebuggerModel.DebuggerModel>) => this.updateBreakpoints(event.data);

  private register(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    console.error('debugger state during registering: ' + debuggerModel.state);
    if (debuggerModel.state() === SDK.DebuggerModel.DebuggerState.Enabled) {
      this.updateBreakpoints(debuggerModel);
    } else if (debuggerModel.state() < SDK.DebuggerModel.DebuggerState.Enabled) {
      console.error('registering debuggerModel: ' + debuggerModel);
      this.debuggerModels.add(debuggerModel);
      debuggerModel.addEventListener(
        SDK.DebuggerModel.Events.DebuggerWasEnabled, this.onEnabledEvent, this);
      debuggerModel.addEventListener(
        SDK.DebuggerModel.Events.DebuggerPausedOnInstrumentation, this.onInstrumentationBreakpoint.bind(this, debuggerModel), this);
    } else {
      throw new Error('Unexpected state: ' + debuggerModel.state());
    }
  }
  
  private async onInstrumentationBreakpoint(debuggerModel: SDK.DebuggerModel.DebuggerModel, event: Common.EventTarget.EventTargetEvent<string>) {
    const url = event.data;
    await this.breakpointManager.restoreBreakpointsForUrl(debuggerModel, url);
    debuggerModel.resume();
  }

  modelAdded(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    this.register(debuggerModel);
  }

  modelRemoved(debuggerModel: SDK.DebuggerModel.DebuggerModel): void {
    console.error('removing debuggerModel: ' + debuggerModel);
    debuggerModel.removeEventListener(
      SDK.DebuggerModel.Events.DebuggerWasEnabled, this.onEnabledEvent, this);
    this.debuggerModels.delete(debuggerModel);
  }

  updateBreakpoints(debuggerModel: SDK.DebuggerModel.DebuggerModel) {
   console.error("updateBreakpoints");
   this.breakpointManager.refreshBreakpointsForDebugger(debuggerModel).then(() => debuggerModel.allBreakpointsSet());
  }

}