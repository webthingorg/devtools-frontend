// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class LocalizedStringTag {
  localizationTag: (string|undefined);
}
export type LocalizedString = string&LocalizedStringTag;

export const LocalizedEmptyString = '' as LocalizedString;

export const escapeCharacters = (inputString: string, charsToEscape: string): string => {
  let foundChar = false;
  for (let i = 0; i < charsToEscape.length; ++i) {
    if (inputString.indexOf(charsToEscape.charAt(i)) !== -1) {
      foundChar = true;
      break;
    }
  }

  if (!foundChar) {
    return String(inputString);
  }

  let result = '';
  for (let i = 0; i < inputString.length; ++i) {
    if (charsToEscape.indexOf(inputString.charAt(i)) !== -1) {
      result += '\\';
    }
    result += inputString.charAt(i);
  }

  return result;
};

export const enum FormatterType {
  STRING = 'string',
  SPECIFIER = 'specifier',
}

export interface FormatterToken {
  type: FormatterType;
  value?: string|{description: string};
  specifier?: string;
  precision?: number;
  substitutionIndex?: number;
}

export const tokenizeFormatString = function(
    formatString: string, formatters: Record<string, Function>): FormatterToken[] {
  const tokens: FormatterToken[] = [];

  function addStringToken(str: string): void {
    if (!str) {
      return;
    }
    if (tokens.length && tokens[tokens.length - 1].type === FormatterType.STRING) {
      tokens[tokens.length - 1].value += str;
    } else {
      tokens.push({
        type: FormatterType.STRING,
        value: str,
      });
    }
  }

  function addSpecifierToken(specifier: string, precision: number, substitutionIndex: number): void {
    tokens.push({type: FormatterType.SPECIFIER, specifier, precision, substitutionIndex, value: undefined});
  }

  function addAnsiColor(code: number): void {
    type ColorType = 'color'|'colorLight'|'bgColor'|'bgColorLight';

    const types: Record<number, ColorType> = {3: 'color', 9: 'colorLight', 4: 'bgColor', 10: 'bgColorLight'};
    const colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'];
    const colorCodesLight =
        ['darkGray', 'lightRed', 'lightGreen', 'lightYellow', 'lightBlue', 'lightMagenta', 'lightCyan', 'white', ''];
    const colors: Record<ColorType, string[]> =
        {color: colorCodes, colorLight: colorCodesLight, bgColor: colorCodes, bgColorLight: colorCodesLight};
    const type = types[Math.floor(code / 10)] as ColorType;
    if (!type) {
      return;
    }
    const color = colors[type][code % 10];
    if (!color) {
      return;
    }
    tokens.push({
      type: FormatterType.SPECIFIER,
      specifier: 'c',
      value: {description: (type.startsWith('bg') ? 'background : ' : 'color: ') + color},
      precision: undefined,
      substitutionIndex: undefined,
    });
  }

  let textStart = 0;
  let substitutionIndex = 0;
  const re =
      new RegExp(`%%|%(?:(\\d+)\\$)?(?:\\.(\\d*))?([${Object.keys(formatters).join('')}])|\\u001b\\[(\\d+)m`, 'g');
  for (let match = re.exec(formatString); match !== null; match = re.exec(formatString)) {
    const matchStart = match.index;
    if (matchStart > textStart) {
      addStringToken(formatString.substring(textStart, matchStart));
    }

    if (match[0] === '%%') {
      addStringToken('%');
    } else if (match[0].startsWith('%')) {
      const [, substitionString, precisionString, specifierString] = match;
      if (substitionString && Number(substitionString) > 0) {
        substitutionIndex = Number(substitionString) - 1;
      }
      const precision = precisionString ? Number(precisionString) : -1;
      addSpecifierToken(specifierString, precision, substitutionIndex);
      ++substitutionIndex;
    } else {
      const code = Number(match[4]);
      addAnsiColor(code);
    }
    textStart = matchStart + match[0].length;
  }
  addStringToken(formatString.substring(textStart));
  return tokens;
};

type FormatterFunction<T> = (input: string|{description: string}|undefined|T, token: FormatterToken) => unknown;

export const format = function<T, U>(
    formatString: string, substitutions: ArrayLike<U>|null, formatters: Record<string, FormatterFunction<U>>,
    initialValue: T, append: (initialValue: T, newString?: string) => T, tokenizedFormat?: FormatterToken[]): {
  formattedResult: T,
  unusedSubstitutions: ArrayLike<U>|null,
} {
  if (!formatString || ((!substitutions || !substitutions.length) && formatString.search(/\u001b\[(\d+)m/) === -1)) {
    return {formattedResult: append(initialValue, formatString), unusedSubstitutions: substitutions};
  }

  function prettyFunctionName(): string {
    return 'String.format("' + formatString + '", "' + Array.prototype.join.call(substitutions, '", "') + '")';
  }

  function warn(msg: string): void {
    console.warn(prettyFunctionName() + ': ' + msg);
  }

  function error(msg: string): void {
    console.error(prettyFunctionName() + ': ' + msg);
  }

  let result = initialValue;
  const tokens = tokenizedFormat || tokenizeFormatString(formatString, formatters);
  const usedSubstitutionIndexes: Record<number, boolean> = {};
  const actualSubstitutions: ArrayLike<U> = substitutions || [];

  for (const token of tokens) {
    if (token.type === FormatterType.STRING) {
      result = append(result, token.value as string);
      continue;
    }

    if (token.type !== FormatterType.SPECIFIER) {
      error('Unknown token type "' + token.type + '" found.');
      continue;
    }

    if (!token.value && token.substitutionIndex !== undefined &&
        token.substitutionIndex >= actualSubstitutions.length) {
      // If there are not enough substitutions for the current substitutionIndex
      // just output the format specifier literally and move on.
      error(
          'not enough substitution arguments. Had ' + actualSubstitutions.length + ' but needed ' +
          (token.substitutionIndex + 1) + ', so substitution was skipped.');
      result = append(
          result,
          '%' + ((token.precision !== undefined && token.precision > -1) ? token.precision : '') + token.specifier);
      continue;
    }

    if (!token.value && token.substitutionIndex !== undefined) {
      usedSubstitutionIndexes[token.substitutionIndex] = true;
    }

    if (token.specifier === undefined || !(token.specifier in formatters)) {
      // Encountered an unsupported format character, treat as a string.
      warn('unsupported format character \u201C' + token.specifier + '\u201D. Treating as a string.');
      const stringToAppend = (token.value || token.substitutionIndex === undefined) ?
          '' :
          String(actualSubstitutions[token.substitutionIndex]);
      result = append(result, stringToAppend);
      continue;
    }

    const formatter = formatters[token.specifier];
    const valueToFormat = token.value ||
        (token.substitutionIndex !== undefined ? actualSubstitutions[token.substitutionIndex] : undefined);
    const stringToAppend = formatter(valueToFormat, token);

    result = append(
        result,
        stringToAppend as string,
    );
  }

  const unusedSubstitutions = [];
  for (let i = 0; i < actualSubstitutions.length; ++i) {
    if (i in usedSubstitutionIndexes) {
      continue;
    }
    unusedSubstitutions.push(actualSubstitutions[i]);
  }

  return {formattedResult: result, unusedSubstitutions: unusedSubstitutions};
};
