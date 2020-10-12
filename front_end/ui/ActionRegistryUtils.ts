// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';

import {ActionInterface, Events} from './Action.js';  // eslint-disable-line no-unused-vars
import {ActionCategory} from './ActionRegistry.js';
import {Context} from './Context.js';  // eslint-disable-line no-unused-vars

interface ExtensionOption {
  value: boolean;
  title: string;
  text?: string;
}

interface Binding {
  platform?: string;
  shortcut: string;
  keybindSets?: Array<string>;
}

export interface ActionRegistration<K extends keyof ActionIdMap> {
  actionId: K;
  category: ActionCategory;
  title?: string;
  iconClass?: string;
  toggledIconClass?: string;
  toggleWithRedColor?: boolean;
  tags?: string;
  toggleable?: boolean;
  loadActionDelegate?(): Promise<ActionIdMap[K]>;
  options?: Array<ExtensionOption>;
  loadContextTypes?(): Promise<Array<new(...args: unknown[]) => Object>>;
  bindings?: Array<Binding>;
}

const registeredActionExtensions: Array<ActionRegistration<keyof ActionIdMap>> = [];

export function registerActionExtension(registration: ActionRegistration<keyof ActionIdMap>): void {
  registeredActionExtensions.push(registration);
}

export function getRegisteredActionExtensions() {
  return registeredActionExtensions;
}

export class PreRegisteredAction extends Common.ObjectWrapper.ObjectWrapper implements ActionInterface {
  _actionRegistration: ActionRegistration<keyof ActionIdMap>;
  _enabled: boolean;
  _toggled: boolean;

  constructor(actionRegistration: ActionRegistration<keyof ActionIdMap>) {
    super();
    this._actionRegistration = actionRegistration;
    this._enabled = true;
    this._toggled = false;
  }

  id() {
    return this._actionRegistration.actionId;
  }

  async execute() {
    if (!this._actionRegistration.loadActionDelegate) {
      return false;
    }
    const delegate = await this._actionRegistration.loadActionDelegate();
    const actionId = this.id();
    return delegate.handleAction(Context.instance(), actionId);
  }

  icon() {
    return this._actionRegistration.iconClass;
  }

  toggledIcon() {
    return this._actionRegistration.toggledIconClass;
  }

  toggleWithRedColor() {
    return !!this._actionRegistration.toggleWithRedColor;
  }

  setEnabled(enabled: boolean) {
    if (this._enabled === enabled) {
      return;
    }
    this._enabled = enabled;
    this.dispatchEventToListeners(Events.Enabled, enabled);
  }

  enabled() {
    return this._enabled;
  }

  category() {
    return this._actionRegistration.category;
  }

  tags() {
    return this._actionRegistration.tags;
  }

  toggleable() {
    return !!this._actionRegistration.toggleable;
  }

  title() {
    let title = this._actionRegistration.title;
    const options = this._actionRegistration.options;
    if (options) {
      // Actions with an 'options' property don't have a title field. Instead, the displayed
      // title is taken from the 'title' property of the option that is not active. Only one of the
      // two options can be active at a given moment and the 'toggled' property of the action along
      // with the 'value' of the options are used to determine which one it is.

      for (const pair of options) {
        if (pair.value !== this._toggled) {
          title = pair.title;
        }
      }
    }
    return title;
  }

  toggled() {
    return this._toggled;
  }

  setToggled(toggled: boolean) {
    console.assert(this.toggleable(), 'Shouldn\'t be toggling an untoggleable action', this.id());
    if (this._toggled === toggled) {
      return;
    }

    this._toggled = toggled;
    this.dispatchEventToListeners(Events.Toggled, toggled);
  }

  options() {
    return this._actionRegistration.options;
  }

  async contextTypes() {
    if (!this._actionRegistration.loadContextTypes) {
      return [];
    }
    return await this._actionRegistration.loadContextTypes();
  }

  canInstantiate() {
    return !!this._actionRegistration.loadActionDelegate;
  }

  bindings() {
    return this._actionRegistration.bindings;
  }
}
