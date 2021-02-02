// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Abbreviated example
const stylelint = require('stylelint');
const postcss = require('postcss');
const path = require('path');
const fs = require('fs');

const ruleName = 'plugin/use_theme_colors';

const rulesThatUseColors = new Set([
  'color', 'box-shadow', 'text-shadow', 'outline-color', 'background-image', 'background-color', 'border-left-color',
  'border-right-color', 'border-top-color', 'border-bottom-color', '-webkit-border-image', 'fill', 'stroke'
]);

function getRootVariableDeclarationsFromCSSFile(filePath) {
  const fileContents = fs.readFileSync(filePath, {encoding: 'utf-8'});
  const definedVariableNames = new Set();
  const parsed = postcss.parse(fileContents);
  // Only parse the colors in the :root declaration.
  parsed.walkRules(':root', rule => {
    for (const node of (rule.nodes || [])) {
      if (node.prop && node.prop.startsWith('--')) {
        definedVariableNames.add(node.prop);
      }
    }
  });
  return definedVariableNames;
}
const themeColorsPath = path.join(__dirname, '..', '..', '..', 'front_end', 'ui', 'themeColors.css');
const DEFINED_THEME_COLOR_VARIABLES = getRootVariableDeclarationsFromCSSFile(themeColorsPath);
const inspectorStylesPath = path.join(__dirname, '..', '..', '..', 'front_end', 'ui', 'inspectorStyle.css');
const DEFINED_INSPECTOR_STYLE_VARIABLES = getRootVariableDeclarationsFromCSSFile(inspectorStylesPath);
/**
 *
 * @param {postcss.Rule} rule
 * @returns {Array<postcss.Node>}
 */
function gatherColorDeclarations(rule) {
  if (!rule.nodes) {
    return [];
  }
  /**
   * @type {Array<postcss.Node>}
   */
  const declarationsWithColors = [];

  for (const node of rule.nodes) {
    if (rulesThatUseColors.has(node.prop)) {
      declarationsWithColors.push(node);
    }
  }
  return declarationsWithColors;
}

const thingsThatIndicateColor = new Set([
  // We don't have to check for named colors ("blue") as we lint to ban those separately.
  /^#[a-zA-Z0-9]{3,6}/,
  /^hsla?/,
  /^rgba?/,
]);


module.exports = stylelint.createPlugin(ruleName, function(primary, secondary, context) {
  return function(postcssRoot, postcssResult) {
    function reportError(declaration) {
      stylelint.utils.report({
        message: 'All CSS color declarations should use a variable defined in ui/themeColors.css',
        ruleName,
        node: declaration,
        result: postcssResult,
      });
    }

    /**
     * @param {postcss.Node} declaration
     */
    function dealWithError(declaration) {
      if (context.fix) {
        // Unfortunately if you add crbug.com/X to the same comment as the
        // stylelint-disable-line, it doesn't work, hence why we add two
        // comments, one to disable and one with the tracking bug.
        declaration.after(' /* stylelint-disable-line plugin/use_theme_colors */ /* crbug.com/1152736 */');
      } else {
        reportError(declaration);
      }
    }
    const sourceFile = postcssResult.opts.from;
    // For now, only apply this linting to CSS within our components.
    if (sourceFile && path.extname(sourceFile) !== '.ts') {
      return;
    }
    postcssRoot.walkRules(rule => {
      // If you are providing a selector specifically for dark mode, you can use
      // any colors you want, as it means you are purposefully deviating. This
      // is not encouraged but we do need to allow it.
      if (rule.selector.startsWith(':host-context(.-theme-with-dark-background)') ||
          rule.selector.startsWith('.-theme-with-dark-background')) {
        return;
      }

      const declarationsToCheck = gatherColorDeclarations(rule);

      for (const declaration of declarationsToCheck) {
        for (const indicator of thingsThatIndicateColor) {
          if (indicator.test(declaration.value)) {
            dealWithError(declaration);
          }
        }

        if (declaration.value.startsWith('var')) {
          const [match, variableName] = /var\((--[\w-]+)/.exec(declaration.value);
          if (!match) {
            throw new Error(`Could not parse CSS variable usage: ${declaration.value}`);
          }
          const variableIsValid =
              DEFINED_INSPECTOR_STYLE_VARIABLES.has(variableName) || DEFINED_THEME_COLOR_VARIABLES.has(variableName);
          if (!variableIsValid) {
            dealWithError(declaration);
          }
        }
      }
    });
  };
});

module.exports.ruleName = ruleName;
