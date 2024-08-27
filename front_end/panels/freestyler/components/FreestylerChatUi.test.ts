// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../../core/host/host.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import {renderElementIntoDOM} from '../../../testing/DOMHelpers.js';
import {describeWithEnvironment} from '../../../testing/EnvironmentHelpers.js';
import * as Marked from '../../../third_party/marked/marked.js';
import * as MarkdownView from '../../../ui/components/markdown_view/markdown_view.js';
import * as Freestyler from '../freestyler.js';

import * as FreestylerChatUi from './FreestylerChatUi.js';

const {MarkdownRendererWithCodeBlock} = FreestylerChatUi.FOR_TEST;

describeWithEnvironment('FreestylerChatUi', () => {
  describe('MarkdownRendererWithCodeBlock', () => {
    it('should transform code token for multiline code blocks with `css` language written in the first line', () => {
      const renderer = new MarkdownRendererWithCodeBlock();
      const templateForTokenStub =
          sinon.stub(MarkdownView.MarkdownView.MarkdownInsightRenderer.prototype, 'templateForToken');
      const codeBlock = `\`\`\`
css
* {
  color: red;
}
\`\`\``;
      const codeToken = Marked.Marked.lexer(codeBlock)[0] as Marked.Marked.Tokens.Code;
      assert.isEmpty(codeToken.lang);
      renderer.renderToken(codeToken);

      sinon.assert.calledWith(templateForTokenStub, sinon.match({
        lang: 'css',
        text: `* {
  color: red;
}`,
      }));
    });
  });

  function getProp(options: Partial<FreestylerChatUi.Props>): FreestylerChatUi.Props {
    const noop = () => {};
    const messages: Freestyler.ChatMessage[] = options.messages ?? [];
    return {
      onTextSubmit: noop,
      onInspectElementClick: noop,
      onFeedbackSubmit: noop,
      onAcceptConsentClick: noop,
      onCancelClick: noop,
      onFixThisIssueClick: noop,
      inspectElementToggled: false,
      state: Freestyler.State.CHAT_VIEW,
      aidaAvailability: Host.AidaClient.AidaAccessPreconditions.AVAILABLE,
      messages,
      selectedNode: {} as unknown as SDK.DOMModel.DOMNode,
      isLoading: false,
      canShowFeedbackForm: false,
      userInfo: {},
      ...options,
    };
  }

  describe('SideEffects', () => {
    it('should show SideEffects', async () => {
      const props = getProp({
        messages: [
          {
            entity: Freestyler.ChatMessageEntity.MODEL,
            suggestingFix: false,
            steps: [
              {
                isLoading: false,
                title: 'Updating element styles',
                thought: 'Updating element styles',
                sideEffect: {
                  code: '$0.style.background = "blue";',
                  onAnswer: () => {},
                },
              },
            ],
          },
        ],
      });
      const chat = new FreestylerChatUi.FreestylerChatUi(props);
      renderElementIntoDOM(chat);

      const sideEffect = chat.shadowRoot!.querySelector('.side-effect-confirmation');
      assert.exists(sideEffect);
    });
  });
});
