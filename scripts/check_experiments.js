// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const fs = require('fs');
const path = require('path');

const localizationUtils = require('./localization/utils/localization_utils');
const espree = localizationUtils.espree;

const USER_METRICS_ENUM_ENDPOINT = '__lastValidEnumPosition';

/**
 * Determines if a node is a class declaration.
 * If className is provided, node must also match class name.
 */
function isClassNameDeclaration(node, className) {
  const isClassDeclaration = node.type === 'ExportNamedDeclaration' && node.declaration.type === 'ClassDeclaration';
  return className ? (isClassDeclaration && node.declaration.id.name === className) : isClassDeclaration;
}

/**
 * Finds a function declaration node inside a class declaration node
 */
function findFunctionInClass(classNode, functionName) {
  for (const node of classNode.declaration.body.body) {
    if (node.key.name === functionName) {
      return node;
    }
  }
}

/**
 * Determines if AST Node is a call to register a DevtoolsExperiment
 */
function isExperimentRegistrationCall(node) {
  return node.expression && node.expression.type === 'CallExpression' &&
      node.expression.callee.property.name === 'register';
}

/**
 * Gets list of experiments registered in MainImpl.js
 */
function getMainImplExperimentList(mainImplFile) {
  const experiments = [];
  const mainAST = espree.parse(mainImplFile, {ecmaVersion: 11, sourceType: 'module', range: true});
  for (const node of mainAST.body) {
    // Find MainImpl Class node
    if (!isClassNameDeclaration(node, 'MainImpl')) {
      continue;
    }
    // Find function in MainImpl Class
    const initializeExperimentNode = findFunctionInClass(node, '_initializeExperiments');
    if (!initializeExperimentNode) {
      continue;
    }
    for (const statement of initializeExperimentNode.value.body.body) {
      if (isExperimentRegistrationCall(statement)) {
        experiments.push(statement.expression.arguments[0].value);
      }
    }
    break;
  }
  return experiments;
}

/**
 * Determines if AST Node is the DevtoolsExperiments Enum declaration
 */
function isExperimentEnumDeclaration(node) {
  return node.type === 'ExportNamedDeclaration' && node.declaration.declarations &&
      node.declaration.declarations[0].id.name === 'DevtoolsExperiments';
}

/**
 * Gets list of experiments registered in UserMetrics.js
 */
function getUserMetricExperimentList(userMetricsFile) {
  const userMetricsAST = espree.parse(userMetricsFile, {ecmaVersion: 11, sourceType: 'module', range: true});
  for (const node of userMetricsAST.body) {
    if (isExperimentEnumDeclaration(node)) {
      return node.declaration.declarations[0].init.properties.map(property => {
        return property.key.value;
      });
    }
  }
  return [];
}

/**
 * Compares list of experiments, fires error if an experiemnt is registered without telemetry entry.
 */
function compareExperimentLists(mainImplList, userMetricsList) {
  let errorFound = false;
  if (!mainImplList.length) {
    console.log(
        'Changes to Devtools Experiment registration have prevented this check from finding registered experiments.');
    console.log('Please update scripts/check_experiments.js to account for the new experiemnt registration.');
    errorFound = true;
  }
  if (!userMetricsList.length) {
    console.log(
        'Changes to Devtools Experiment UserMetrics enum have prevented this check from finding experiments registered for telemetry.');
    console.log('Please update scripts/check_experiments.js to account for the new experiemnt telemetry format.');
    errorFound = true;
  }
  const missingTelemetry = mainImplList.filter(experiment => !userMetricsList.includes(experiment));
  const staleTelemetry = userMetricsList.filter(
      experiment => !mainImplList.includes(experiment) && experiment !== USER_METRICS_ENUM_ENDPOINT);
  if (missingTelemetry.length) {
    console.log('Devtools Experiments have been added without corresponding histogram update!');
    console.log(missingTelemetry.join('\n'));
    console.log(
        'Please ensure that the DevtoolsExperiments enum in UserMetrics.js is updated with the new experiment.');
    console.log(
        'Please ensure that a corresponding CL is openend against chromium.src/tools/metrics/histograms/enums.xml to update the DevtoolsExperiments enum');
    errorFound = true;
  }
  if (staleTelemetry.length) {
    console.log('Devtools Experiments that are no longer registered are still listed in the telemetry enum!');
    console.log(staleTelemetry.join('\n'));
    console.log(
        'Please ensure that the DevtoolsExperiments enum in UserMetrics.js is updated to remove these stale experiments.');
    errorFound = true;
  }
  if (errorFound) {
    process.exit(1);
  }
  console.log('DevTools Experiment Telemetry checker passed.');
}

function main() {
  const mainImplPath = path.resolve(__dirname, '..', 'front_end', 'main', 'MainImpl.js');
  const mainImplFile = fs.readFileSync(mainImplPath, 'utf-8');

  const userMetricsPath = path.resolve(__dirname, '..', 'front_end', 'host', 'UserMetrics.js');
  const userMetricsFile = fs.readFileSync(userMetricsPath, 'utf-8');

  compareExperimentLists(getMainImplExperimentList(mainImplFile), getUserMetricExperimentList(userMetricsFile));
}

main();
