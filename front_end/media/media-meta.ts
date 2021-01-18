// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Platform from '../platform/platform.js';
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Media from './media.js';

export const UIStrings = {
  /**
    *@description Text that appears on a button for the media resource type filter.
    */
  media: 'Media',
  /**
    *@description The type of media. Lower case.
    */
  video: 'video',
};
i18n.i18n.registerUIStrings('media/media-meta.ts', UIStrings);

const str_ = i18n.i18n.registerUIStrings('help/help-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

let loadedMediaModule: (typeof Media|undefined);

async function loadMediaModule(): Promise<typeof Media> {
  if (!loadedMediaModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('media');
    loadedMediaModule = await import('./media.js');
  }
  return loadedMediaModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.PANEL,
  id: 'medias',
  title: (): Platform.UIString.LocalizedString => i18nString(UIStrings.media),
  commandPrompt: 'Show Media',
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 100,
  async loadView() {
    const Media = await loadMediaModule();
    return Media.MainView.MainView.instance();
  },
  tags: [
    (): Platform.UIString.LocalizedString => i18nString(UIStrings.media),
    (): Platform.UIString.LocalizedString => i18nString(UIStrings.video),
  ],
});
