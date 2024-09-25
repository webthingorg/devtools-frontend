// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {html} from '../../lit-html/lit-html.js';

import {type ButtonData, Size, Variant} from './Button.js';

// This default export determines where your story goes in the story list
export default {
  title: 'Button',
  component: 'devtools-button',
  render: ({data, slot}: {data: ButtonData}&{slot: string}) =>
      html`<devtools-button .data=${data}>${slot}</devtools-button>`,
  argTypes: {
    data: {
      control: 'object',
      description: 'Object wrapping all properties.',
    },
  },
};

export const Default = {
  args: {
    data: {
      variant: Variant.PRIMARY,
      size: Size.REGULAR,
    },
    slot: 'Label',
  },
};

export const IconButton = {
  args: {
    data: {
      variant: Variant.ICON,
      iconName: 'plus',
    },
  },
};
