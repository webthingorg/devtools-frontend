// Copyright 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import type * as Workspace from '../../models/workspace/workspace.js';
import * as NetworkUtils from '../network/utils/utils.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';

import {FilteredUISourceCodeListProvider} from './FilteredUISourceCodeListProvider.js';
import {SourcesView} from './SourcesView.js';

let openFileQuickOpenInstance: OpenFileQuickOpen;

export class OpenFileQuickOpen extends FilteredUISourceCodeListProvider {
  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): OpenFileQuickOpen {
    const {forceNew} = opts;
    if (!openFileQuickOpenInstance || forceNew) {
      openFileQuickOpenInstance = new OpenFileQuickOpen();
    }

    return openFileQuickOpenInstance;
  }

  attach(): void {
    this.setDefaultScores(SourcesView.defaultUISourceCodeScores());
    super.attach();
  }

  uiSourceCodeSelected(
      uiSourceCode: Workspace.UISourceCode.UISourceCode|null, lineNumber?: number, columnNumber?: number): void {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.SelectFileFromFilePicker);

    if (!uiSourceCode) {
      return;
    }
    if (typeof lineNumber === 'number') {
      Common.Revealer.reveal(uiSourceCode.uiLocation(lineNumber, columnNumber));
    } else {
      Common.Revealer.reveal(uiSourceCode);
    }
  }

  filterProject(project: Workspace.Workspace.Project): boolean {
    return !project.isServiceProject();
  }

  renderItem(itemIndex: number, query: string, titleElement: Element, subtitleElement: Element): void {
    super.renderItem(itemIndex, query, titleElement, subtitleElement);

    const iconElement = new IconButton.Icon.Icon();
    iconElement.data = {
      iconName: NetworkUtils.imageNameForResourceType(this.itemContentTypeAt(itemIndex)),
      color: '',
      width: '18px',
      height: '18px',
    };
    titleElement.parentElement?.parentElement?.insertBefore(iconElement, titleElement.parentElement);
  }

  selectedItemChanged(fromElement: Element|null, toElement: Element|null): void {
    const fromElementIcon = fromElement?.querySelector('devtools-icon');  // as IconButton.Icon.Icon|null;
    if (fromElementIcon) {
      fromElementIcon.data = {...fromElementIcon?.data, color: ''};
    }
    const toElementIcon = toElement?.querySelector('devtools-icon');
    if (toElementIcon) {
      toElementIcon.data = {...toElementIcon.data, color: 'var(--color-background)'};
    }
  }

  renderAsTwoRows(): boolean {
    return true;
  }
}
