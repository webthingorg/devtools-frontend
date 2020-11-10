// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @enum {symbol}
 * events:   . . . . . . . . . . . . .
 * Leading:  ^ - - - - - - - - - - - -
 * Trailing: - - - - - - - - - - - - ^
 * Both:     ^ - - - - - - - - - - - ^
*/
export const DebounceType = {
  Leading: Symbol('Leading'),
  Trailing: Symbol('Trailing'),
  Both: Symbol('Both'),
};

/**
 * Debounce utility function, ensures that the function passed in is only called once the function stops being called and the delay has expired.
 * @param {!Function} func The function to debounce
 * @param {number} delay The time to wait before calling the function
 * @param {DebounceType} type
 * @return {!Function} The debounced function
 */
export const debounce = function(func, delay, type = DebounceType.Trailing) {
  switch (type) {
    case DebounceType.Leading:
      return leadingDebounce(func, delay);
    case DebounceType.Both:
      return twoSidedDebounce(func, delay);
    default:
      // This is the default behavior because it is the most common
      return trailingDebounce(func, delay);
  }
};

/**
 * @param {!Function} func The function to debounce
 * @param {number} cooldown The cooldown period before next call
 */
const leadingDebounce = function(func, cooldown) {
  let timer = 0;
  const debounced = () => {
    if (timer) {
      clearTimeout(timer);
    } else {
      func();
    }
    timer = setTimeout(() => {
      timer = 0;
    }, cooldown);
  };
  return debounced;
};

/**
 * @param {!Function} func The function to debounce
 * @param {number} delay The time to wait before calling the function
 */
const trailingDebounce = function(func, delay) {
  let timer = 0;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(() => func(), delay);
  };
  return debounced;
};

/**
 * @param {!Function} func The function to debounce
 * @param {number} cooldown The cooldown period before next call
 */
const twoSidedDebounce = function(func, cooldown) {
  let timer = 0;
  const debounced = () => {
    if (timer) {
      clearTimeout(timer);
    } else {
      func();
    }
    timer = setTimeout(() => {
      timer = 0;
      func();
    }, cooldown);
  };
  return debounced;
};
