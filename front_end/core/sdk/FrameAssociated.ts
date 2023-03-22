// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type PageResourceLoadInitiator} from './PageResourceLoader.js';
import type * as Platform from '../../core/platform/platform.js';

export interface FrameAssociated {
  sourceURL: Platform.DevToolsPath.UrlString;
  endLine: number;
  endColumn: number;
  createPageResourceLoadInitiator: () => PageResourceLoadInitiator;
}
