// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @interface
 */
/* eslint-disable rulesdir/no_underscored_properties */

export interface Linkifier {
  linkify(object: Object, options?: Options): Node;

  static linkify(object: Object | null, options?: Options): Promise<Node>;
}
export interface Options {
  tooltip?: string;
  preventKeyboardFocus?: boolean;
}

const registeredLinkifiers: LinkifierRegistration[] = [];

export function registerLinkifier(registration: LinkifierRegistration): void {
  registeredLinkifiers.push(registration);
}
export function getApplicableRegisteredlinkifiers(object: Object): LinkifierRegistration[] {
  return registeredLinkifiers.filter(isLinkifierApplicableToContextTypes);

  function isLinkifierApplicableToContextTypes(linkifierRegistration: LinkifierRegistration): boolean {
    if (!linkifierRegistration.contextTypes) {
      return true;
    }
    for (const contextType of linkifierRegistration.contextTypes()) {
      if (object instanceof contextType) {
        return true;
      }
    }
    return false;
  }
}
export interface LinkifierRegistration {
  loadLinkifier: () => Promise<Linkifier>;
  contextTypes?: (() => Array<unknown>);
}
