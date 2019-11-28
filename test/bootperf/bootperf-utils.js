// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function median(values) {
    if (values.length === 0) {
        return 0;
    }

    values.sort();

    const mid = values.length / 2;
    if (values.length % 2 == 1) {
        return values[Math.floor(mid)];
    } else {
        return (values[mid] + values[mid - 1]) / 2;
    }
}

function mean(values) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((prev, curr) => prev + curr, 0) / values.length;
}

module.exports = {
    median,
    mean
};
