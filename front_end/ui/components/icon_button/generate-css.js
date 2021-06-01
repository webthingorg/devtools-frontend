// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const path = require('path');
const [, , targetGenDir] = process.argv;

const output = fs.readFileSync(
    '/usr/local/google/home/kritisapra/src/devtools/devtools-frontend/front_end/ui/components/icon_button/IconButton.css',
    {encoding: 'utf8', flag: 'r'});


fs.writeFileSync(path.join(targetGenDir, 'IconButton.css'), output);
