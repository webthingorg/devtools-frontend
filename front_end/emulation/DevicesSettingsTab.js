// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import * as UI from '../ui/ui.js';

import {DeviceModeModel, MaxDeviceNameLength, UA} from './DeviceModeModel.js';
import {Capability, EmulatedDevice, EmulatedDevicesList, Events, Horizontal, Vertical,} from './EmulatedDevices.js';

export const UIStrings = {
  /**
  *@description Text of a DOM element in Devices Settings Tab of the Device Toolbar
  */
  emulatedDevices: 'Emulated Devices',
  /**
  *@description Add custom button in Devices Settings Tab of the Device Toolbar
  */
  addCustomDevice: 'Add custom device...',
  /**
  *@description Label in the Devices settings pane for the device name input of a custom device
  */
  deviceName: 'Device Name',
  /**
  *@description Width input title in Device Mode Toolbar of the Device Toolbar
  */
  width: 'Width',
  /**
  *@description Label in the Devices settings pane for the height input of a custom device
  */
  height: 'Height',
  /**
  *@description Title of device scale item in device mode toolbar of the device toolbar
  */
  devicePixelRatio: 'Device pixel ratio',
  /**
  *@description Label in the Devices settings pane for the user agent type input of a custom device
  */
  userAgentType: 'User agent type',
  /**
  *@description Error message in the Devices settings pane that declares the maximum length of the device name input
  *@example {50} PH1
  */
  deviceNameMustBeLessThanS: 'Device name must be less than {PH1} characters.',
  /**
  *@description Error message in the Devices settings pane that declares that the device name input must not be empty
  */
  deviceNameCannotBeEmpty: 'Device name cannot be empty.',
};
const str_ = i18n.i18n.registerUIStrings('emulation/DevicesSettingsTab.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
/**
 * @implements {UI.ListWidget.Delegate<!EmulatedDevice>}
 * @unrestricted
 */
export class DevicesSettingsTab extends UI.Widget.VBox {
  constructor() {
    super();
    this.element.classList.add('settings-tab-container');
    this.element.classList.add('devices-settings-tab');
    this.registerRequiredCSS('emulation/devicesSettingsTab.css', {enableLegacyPatching: true});

    const header = this.element.createChild('header');
    UI.UIUtils.createTextChild(header.createChild('h1'), i18nString(UIStrings.emulatedDevices));
    this.containerElement = this.element.createChild('div', 'settings-container-wrapper')
                                .createChild('div', 'settings-tab settings-content settings-container');

    const buttonsRow = this.containerElement.createChild('div', 'devices-button-row');
    this._addCustomButton =
        UI.UIUtils.createTextButton(i18nString(UIStrings.addCustomDevice), this._addCustomDevice.bind(this));
    buttonsRow.appendChild(this._addCustomButton);

    this._list = new UI.ListWidget.ListWidget(this, false /* delegatesFocus */);
    this._list.registerRequiredCSS('emulation/devicesSettingsTab.css', {enableLegacyPatching: true});
    this._list.element.classList.add('devices-list');
    this._list.show(this.containerElement);

    this._muteUpdate = false;
    this._emulatedDevicesList = EmulatedDevicesList.instance();
    this._emulatedDevicesList.addEventListener(Events.CustomDevicesUpdated, this._devicesUpdated, this);
    this._emulatedDevicesList.addEventListener(Events.StandardDevicesUpdated, this._devicesUpdated, this);

    this.setDefaultFocusedElement(this._addCustomButton);
  }

  /**
   * @override
   */
  wasShown() {
    super.wasShown();
    this._devicesUpdated();
  }

  _devicesUpdated() {
    if (this._muteUpdate) {
      return;
    }

    this._list.clear();

    let devices = this._emulatedDevicesList.custom().slice();
    for (let i = 0; i < devices.length; ++i) {
      this._list.appendItem(devices[i], true);
    }

    this._list.appendSeparator();

    devices = this._emulatedDevicesList.standard().slice();
    devices.sort(EmulatedDevice.deviceComparator);
    for (let i = 0; i < devices.length; ++i) {
      this._list.appendItem(devices[i], false);
    }
  }

  /**
   * @param {boolean} custom
   */
  _muteAndSaveDeviceList(custom) {
    this._muteUpdate = true;
    if (custom) {
      this._emulatedDevicesList.saveCustomDevices();
    } else {
      this._emulatedDevicesList.saveStandardDevices();
    }
    this._muteUpdate = false;
  }

  _addCustomDevice() {
    const device = new EmulatedDevice();
    device.deviceScaleFactor = 0;
    device.horizontal.width = 700;
    device.horizontal.height = 400;
    device.vertical.width = 400;
    device.vertical.height = 700;
    this._list.addNewItem(this._emulatedDevicesList.custom().length, device);
  }

  /**
   * @param {number} value
   * @return {string}
   */
  _toNumericInputValue(value) {
    return value ? String(value) : '';
  }

  /**
   * @override
   * @param {!EmulatedDevice} device
   * @param {boolean} editable
   * @return {!Element}
   */
  renderItem(device, editable) {
    const label = document.createElement('label');
    label.classList.add('devices-list-item');
    const checkbox = /** @type {!HTMLInputElement}*/ (label.createChild('input', 'devices-list-checkbox'));
    checkbox.type = 'checkbox';
    checkbox.checked = device.show();
    checkbox.addEventListener('click', onItemClicked.bind(this), false);
    label.appendChild(document.createTextNode(device.title));
    return label;

    /**
     * @param {!Event} event
     * @this {DevicesSettingsTab}
     */
    function onItemClicked(event) {
      const show = checkbox.checked;
      device.setShow(show);
      this._muteAndSaveDeviceList(editable);
      event.consume();
    }
  }

  /**
   * @override
   * @param {*} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
    this._emulatedDevicesList.removeCustomDevice(/** @type {!EmulatedDevice} */ (item));
  }

  /**
   * @override
   * @param {!EmulatedDevice} device
   * @param {!UI.ListWidget.Editor<!EmulatedDevice>} editor
   * @param {boolean} isNew
   */
  commitEdit(device, editor, isNew) {
    device.title = editor.control('title').value.trim();
    device.vertical.width = editor.control('width').value ? parseInt(editor.control('width').value, 10) : 0;
    device.vertical.height = editor.control('height').value ? parseInt(editor.control('height').value, 10) : 0;
    device.horizontal.width = device.vertical.height;
    device.horizontal.height = device.vertical.width;
    device.deviceScaleFactor = editor.control('scale').value ? parseFloat(editor.control('scale').value) : 0;
    device.userAgent = editor.control('user-agent').value;
    device.modes = [];
    device.modes.push({title: '', orientation: Vertical, insets: new UI.Geometry.Insets(0, 0, 0, 0), image: null});
    device.modes.push({title: '', orientation: Horizontal, insets: new UI.Geometry.Insets(0, 0, 0, 0), image: null});
    device.capabilities = [];
    const uaType = editor.control('ua-type').value;
    if (uaType === UA.Mobile || uaType === UA.MobileNoTouch) {
      device.capabilities.push(Capability.Mobile);
    }
    if (uaType === UA.Mobile || uaType === UA.DesktopTouch) {
      device.capabilities.push(Capability.Touch);
    }
    if (isNew) {
      this._emulatedDevicesList.addCustomDevice(device);
    } else {
      this._emulatedDevicesList.saveCustomDevices();
    }
    this._addCustomButton.scrollIntoViewIfNeeded();
    this._addCustomButton.focus();
  }

  /**
   * @override
   * @param {!EmulatedDevice} device
   * @return {!UI.ListWidget.Editor<!EmulatedDevice>}
   */
  beginEdit(device) {
    const editor = this._createEditor();
    editor.control('title').value = device.title;
    editor.control('width').value = this._toNumericInputValue(device.vertical.width);
    editor.control('height').value = this._toNumericInputValue(device.vertical.height);
    editor.control('scale').value = this._toNumericInputValue(device.deviceScaleFactor);
    editor.control('user-agent').value = device.userAgent;
    let uaType;
    if (device.mobile()) {
      uaType = device.touch() ? UA.Mobile : UA.MobileNoTouch;
    } else {
      uaType = device.touch() ? UA.DesktopTouch : UA.Desktop;
    }
    editor.control('ua-type').value = uaType;
    return editor;
  }

  /**
   * @return {!UI.ListWidget.Editor<!EmulatedDevice>}
   */
  _createEditor() {
    if (this._editor) {
      return this._editor;
    }

    const editor = new UI.ListWidget.Editor();
    this._editor = editor;
    const content = editor.contentElement();

    const fields = content.createChild('div', 'devices-edit-fields');
    fields.createChild('div', 'hbox')
        .appendChild(editor.createInput('title', 'text', i18nString(UIStrings.deviceName), titleValidator));
    const screen = fields.createChild('div', 'hbox');
    screen.appendChild(editor.createInput('width', 'text', i18nString(UIStrings.width), widthValidator));
    screen.appendChild(editor.createInput('height', 'text', i18nString(UIStrings.height), heightValidator));
    const dpr = editor.createInput('scale', 'text', i18nString(UIStrings.devicePixelRatio), scaleValidator);
    dpr.classList.add('device-edit-fixed');
    screen.appendChild(dpr);
    const ua = fields.createChild('div', 'hbox');
    ua.appendChild(editor.createInput('user-agent', 'text', i18nString(UIStrings.userAgentType), () => {
      return {valid: true, errorMessage: undefined};
    }));
    const uaTypeOptions = [UA.Mobile, UA.MobileNoTouch, UA.Desktop, UA.DesktopTouch];
    const uaType = editor.createSelect('ua-type', uaTypeOptions, () => {
      return {valid: true, errorMessage: undefined};
    }, i18nString(UIStrings.userAgentType));
    uaType.classList.add('device-edit-fixed');
    ua.appendChild(uaType);

    return editor;

    /**
     * @param {*} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function titleValidator(item, index, input) {
      let valid = false;
      let errorMessage;

      const value = input.value.trim();
      if (value.length >= MaxDeviceNameLength) {
        errorMessage = i18nString(UIStrings.deviceNameMustBeLessThanS, {PH1: MaxDeviceNameLength});
      } else if (value.length === 0) {
        errorMessage = i18nString(UIStrings.deviceNameCannotBeEmpty);
      } else {
        valid = true;
      }

      return {valid, errorMessage};
    }

    /**
     * @param {*} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function widthValidator(item, index, input) {
      return DeviceModeModel.widthValidator(input.value);
    }

    /**
     * @param {*} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function heightValidator(item, index, input) {
      return DeviceModeModel.heightValidator(input.value);
    }

    /**
     * @param {*} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!UI.ListWidget.ValidatorResult}
     */
    function scaleValidator(item, index, input) {
      return DeviceModeModel.scaleValidator(input.value);
    }
  }
}
