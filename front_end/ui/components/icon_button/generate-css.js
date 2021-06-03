// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs');
const path = require('path');
const [, , srcDir, targetGenDir, fileName] = process.argv;

const output = fs.readFileSync(path.join(srcDir, fileName), {encoding: 'utf8', flag: 'r'});

fs.writeFileSync(path.join(targetGenDir, 'generate_css-tsconfig.json'), `{
        "compilerOptions": {
            "composite": true,
            "outDir": "."
        },
        "files": [
            "${fileName + '.js'}"
        ]
    }
`);

fs.writeFileSync(
    path.join(targetGenDir, fileName + '.d.ts'),
    `// Copyright ${new Date().getFullYear()} The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const styles: CSSStyleSheet;
export default styles;
`);

fs.writeFileSync(
    path.join(targetGenDir, fileName + '.js'),
    `// Copyright ${new Date().getFullYear()} The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const styles = new CSSStyleSheet();
styles.replaceSync(
\`${output}
/*# sourceURL=IconButton.css */
\`);
export default styles;
`);
