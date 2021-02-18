// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../i18n/i18n.js';

import * as CreateBreadcrumbs from './create_breadcrumbs.js';
import * as ToggleDarkMode from './toggle_dark_mode.js';

i18n.i18n.registerLocale('en-US');

ToggleDarkMode.init();
CreateBreadcrumbs.init();
