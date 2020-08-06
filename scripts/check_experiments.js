// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const fs = require('fs');
const path = require('path');

function findExperiementInLine(line) {
  const experimentRegex = /\'.*?\'/;
  const experimentMatchArray = line.match(experimentRegex);
  if (experimentMatchArray) {
    return experimentMatchArray[0];
  }
  return null;
}

/**
 * Gets list of experiments registered in MainImpl.js
 */
function getMainImplExperimentList(linesToCheck) {
  const experiments = [];
  const lines = linesToCheck.map(line => line.trim());
  let insideExperiemntRegistrationCall = false;
  for (const line of lines) {
    if (line.includes('Root.Runtime.experiments.register')) {
      const experiementMatch = findExperiementInLine(line);
      if (experiementMatch) {
        experiments.push(experiementMatch);
      } else {
        // Experiemnt is on the next line due to formating
        insideExperiemntRegistrationCall = true;
      }
    } else if (insideExperiemntRegistrationCall) {
      const experiementMatch = findExperiementInLine(line);
      if (experiementMatch) {
        experiments.push(experiementMatch);
      }
      insideExperiemntRegistrationCall = false;
    }
  }

  return experiments;
}

/**
 * Gets list of experiments registered in UserMetrics.js
 */
function getUserMetricExperimentList(linesToCheck) {
  const experiments = [];
  const lines = linesToCheck.map(line => line.trim());
  let insideExperiementEnum = false;
  for (const line of lines) {
    if (line.includes('export const DevtoolsExperiments = {')) {
      insideExperiementEnum = true;
    } else if (insideExperiementEnum) {
      if (line.includes('};')) {
        return experiments;
      }
      const experimentMatch = findExperiementInLine(line);
      if (experimentMatch) {
        experiments.push(experimentMatch);
      }
    }
  }

  return experiments;
}

/**
 * Compares list of experiments, fires error if an experiemnt is registered without telemetry entry.
 */
function compareExperimentLists(mainImplList, userMetricsList) {
  const missingTelemetry = mainImplList.filter(experiment => !userMetricsList.includes(experiment));
  if (missingTelemetry.length) {
    console.log('Devtools Experiments have been added without corresponding histogram update!');
    console.log(missingTelemetry.join('\n'));
    console.log(
        'Please ensure that the DevtoolsExperiments enum in UserMetrics.js is updated with the new experiment.');
    console.log(
        'Please ensure that a corresponding CL is openend against chromium.src/tools/metrics/histograms/enums.xml to update the DevtoolsExperiments enum');
    process.exit(1);
  }
  console.log('DevTools Experiment Telemetry checker passed.');
}

function main() {
  const mainImplPath = path.resolve(__dirname, '..', 'front_end', 'main', 'MainImpl.js');
  const mainImplFile = fs.readFileSync(mainImplPath, 'utf-8');
  const mainImplLines = mainImplFile.split('\n');

  const userMetricsPath = path.resolve(__dirname, '..', 'front_end', 'host', 'UserMetrics.js');
  const userMetricsFile = fs.readFileSync(userMetricsPath, 'utf-8');
  const userMetricsLines = userMetricsFile.split('\n');

  compareExperimentLists(getMainImplExperimentList(mainImplLines), getUserMetricExperimentList(userMetricsLines));
}

main();
