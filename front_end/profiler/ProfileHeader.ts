// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Bindings from '../bindings/bindings.js'; // eslint-disable-line no-unused-vars
import * as Common from '../common/common.js';
import * as UI from '../ui/ui.js'; // eslint-disable-line no-unused-vars

// Transformation: updatePropertyDeclarations
export class ProfileHeader extends Common.ObjectWrapper.ObjectWrapper {
  _profileType: ProfileType;
  title: string;
  uid: number;
  _fromFile: boolean;
  tempFile: Bindings.TempFile.TempFile | null;
  // Transformation: updateParameters
  constructor(profileType: ProfileType, title: string) {
    super();
    this._profileType = profileType;
    this.title = title;
    this.uid = profileType.incrementProfileUid();
    this._fromFile = false;

    this.tempFile = null;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setTitle(title: string): void {
    this.title = title;
    this.dispatchEventToListeners(Events.ProfileTitleChanged, this);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profileType(): ProfileType {
    return this._profileType;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  updateStatus(subtitle: string | null, wait?: boolean): void {
    this.dispatchEventToListeners(Events.UpdateStatus, new StatusUpdate(subtitle, wait));
  }

  /**
   * Must be implemented by subclasses.
   */
  // Transformation: updateReturnType
  // Transformation: updateParameters
  createSidebarTreeElement(dataDisplayDelegate: DataDisplayDelegate): UI.TreeOutline.TreeElement {
    throw new Error('Not implemented.');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createView(dataDisplayDelegate: DataDisplayDelegate): UI.Widget.Widget {
    throw new Error('Not implemented.');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  removeTempFile(): void {
    if (this.tempFile) {
      this.tempFile.remove();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  dispose(): void {
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  canSaveToFile(): boolean {
    return false;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  saveToFile(): void {
    throw new Error('Not implemented');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  loadFromFile(file: File): Promise<Error | DOMError | null> {
    throw new Error('Not implemented');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  fromFile(): boolean {
    return this._fromFile;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setFromFile(): void {
    this._fromFile = true;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setProfile(profile: Protocol.Profiler.Profile): void {
  }
}

// Transformation: updatePropertyDeclarations
export class StatusUpdate {
  subtitle: string | null;
  wait: boolean | undefined;
  // Transformation: updateParameters
  constructor(subtitle: string | null, wait: boolean | undefined) {
    this.subtitle = subtitle;
    this.wait = wait;
  }
}

export const enum Events {
  UpdateStatus = 'UpdateStatus',
  ProfileReceived = 'ProfileReceived',
  ProfileTitleChanged = 'ProfileTitleChanged'
}
;

// Transformation: updatePropertyDeclarations
export class ProfileType extends Common.ObjectWrapper.ObjectWrapper {
  _id: string;
  _name: string;
  _profiles: ProfileHeader[];
  _profileBeingRecorded: ProfileHeader | null;
  _nextProfileUid: number;
  // Transformation: updateParameters
  constructor(id: string, name: string) {
    super();
    this._id = id;
    this._name = name;
    this._profiles = [];
    this._profileBeingRecorded = null;
    this._nextProfileUid = 1;

    if (!window.opener) {
      window.addEventListener('unload', this._clearTempStorage.bind(this), false);
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  typeName(): string {
    return '';
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  nextProfileUid(): number {
    return this._nextProfileUid;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  incrementProfileUid(): number {
    return this._nextProfileUid++;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  hasTemporaryView(): boolean {
    return false;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  fileExtension(): string | null {
    return null;
  }

  get buttonTooltip() {
    return '';
  }

  get id() {
    return this._id;
  }

  get treeItemTitle() {
    return this._name;
  }

  get name() {
    return this._name;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  buttonClicked(): boolean {
    return false;
  }

  get description() {
    return '';
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  isInstantProfile(): boolean {
    return false;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  isEnabled(): boolean {
    return true;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  getProfiles(): ProfileHeader[] {
    // Transformation: updateReturnType
    // Transformation: updateParameters
    // Transformation: updateThisDeclaration
    function isFinished(this: ProfileType, profile: ProfileHeader): boolean {
      return this._profileBeingRecorded !== profile;
    }
    return this._profiles.filter(isFinished.bind(this));
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  customContent(): Element | null {
    return null;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setCustomContentEnabled(enable: boolean): void {
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  getProfile(uid: number): ProfileHeader | null {
    for (let i = 0; i < this._profiles.length; ++i) {
      if (this._profiles[i].uid === uid) {
        return this._profiles[i];
      }
    }
    return null;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  loadFromFile(file: File): Promise<Error | DOMError | null> {
    let 
    // Transformation: updateTypeDefinitionsForLocalTypes
    name: string = file.name;
    const fileExtension = this.fileExtension();
    if (fileExtension && name.endsWith(fileExtension)) {
      name = name.substr(0, name.length - fileExtension.length);
    }
    const profile = this.createProfileLoadedFromFile(name);
    profile.setFromFile();
    this.setProfileBeingRecorded(profile);
    this.addProfile(profile);
    return profile.loadFromFile(file);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  createProfileLoadedFromFile(title: string): ProfileHeader {
    throw new Error('Needs implemented.');
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  addProfile(profile: ProfileHeader): void {
    this._profiles.push(profile);
    this.dispatchEventToListeners(ProfileEvents.AddProfileHeader, profile);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  removeProfile(profile: ProfileHeader): void {
    const index = this._profiles.indexOf(profile);
    if (index === -1) {
      return;
    }
    this._profiles.splice(index, 1);
    this._disposeProfile(profile);
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _clearTempStorage(): void {
    for (let i = 0; i < this._profiles.length; ++i) {
      this._profiles[i].removeTempFile();
    }
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profileBeingRecorded(): ProfileHeader | null {
    return this._profileBeingRecorded;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  setProfileBeingRecorded(profile: ProfileHeader | null): void {
    this._profileBeingRecorded = profile;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  profileBeingRecordedRemoved(): void {
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  reset(): void {
    for (const profile of this._profiles.slice()) {
      this._disposeProfile(profile);
    }
    this._profiles = [];
    this._nextProfileUid = 1;
  }

  // Transformation: updateReturnType
  // Transformation: updateParameters
  _disposeProfile(profile: ProfileHeader): void {
    this.dispatchEventToListeners(ProfileEvents.RemoveProfileHeader, profile);
    profile.dispose();
    if (this._profileBeingRecorded === profile) {
      this.profileBeingRecordedRemoved();
      this.setProfileBeingRecorded(null);
    }
  }
}

export const enum ProfileEvents {
  AddProfileHeader = 'add-profile-header',
  ProfileComplete = 'profile-complete',
  RemoveProfileHeader = 'remove-profile-header',
  ViewUpdated = 'view-updated'
}
;
// Transformation: updateInterfaceDeclarations

/**
 * @interface
 */
// Transformation: updatePropertyDeclarations
export interface DataDisplayDelegate {
  // Transformation: updateReturnType
  // Transformation: updateParameters
  showProfile(profile: ProfileHeader | null): UI.Widget.Widget | null;

  // Transformation: updateReturnType
  // Transformation: updateParameters
  showObject(snapshotObjectId: string, perspectiveName: string): void;

  // Transformation: updateReturnType
  // Transformation: updateParameters
  async linkifyObject(nodeIndex: number): Promise<Element | null>;
}
