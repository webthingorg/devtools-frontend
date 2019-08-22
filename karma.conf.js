// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

module.exports = function(config) {
  const options = {
    basePath: "",

    files: [{
      pattern: 'front_end/**/*.js',
      included: false,
      served: true
    },{
      pattern: 'tests/**/*.ts',
      type: 'module'
    }],

    reporters: ["dots"],

    preprocessors: {
      './tests/**/*.ts': ['karma-typescript']
    },

    browsers: ["ChromeHeadless"],

    frameworks: ["mocha", "chai", "karma-typescript"],

    karmaTypescriptConfig: {
      compilerOptions: {
        target: "esnext",
        module: "esnext",
      },
      coverageOptions: {
        instrumentation: false
      }
    },

    proxies: {
      '/front_end': '/base/front_end',
    },

    plugins: [
      "karma-chrome-launcher",
      "karma-mocha",
      "karma-chai",
      "karma-typescript"
    ],

    singleRun: true
  };

  config.set(options);
};
