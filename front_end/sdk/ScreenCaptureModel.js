// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {OverlayModel} from './OverlayModel.js';
import {Capability, SDKModel, Target} from './SDKModel.js';  // eslint-disable-line no-unused-vars

/**
 * @implements {Protocol.PageDispatcher}
 */
export class ScreenCaptureModel extends SDKModel {
  /**
   * @param {!Target} target
   */
  constructor(target) {
    super(target);
    this._agent = target.pageAgent();
    /** @type {?function(!Protocol.binary, !Protocol.Page.ScreencastFrameMetadata):void} */
    this._onScreencastFrame = null;
    /** @type {?function(boolean):void} */
    this._onScreencastVisibilityChanged = null;
    // @ts-ignore
    // TODO(crbug.com/1081686): fix type
    target.registerPageDispatcher(this);
  }

  /**
   * @param {!Protocol.Page.StartScreencastRequestFormat} format
   * @param {number} quality
   * @param {number|undefined} maxWidth
   * @param {number|undefined} maxHeight
   * @param {number|undefined} everyNthFrame
   * @param {function(!Protocol.binary, !Protocol.Page.ScreencastFrameMetadata): void} onFrame
   * @param {function(boolean): void} onVisibilityChanged
   */
  startScreencast(format, quality, maxWidth, maxHeight, everyNthFrame, onFrame, onVisibilityChanged) {
    this._onScreencastFrame = onFrame;
    this._onScreencastVisibilityChanged = onVisibilityChanged;
    this._agent.invoke_startScreencast({format, quality, maxWidth, maxHeight, everyNthFrame});
  }

  stopScreencast() {
    this._onScreencastFrame = null;
    this._onScreencastVisibilityChanged = null;
    this._agent.invoke_stopScreencast();
  }

  /**
   * @param {!Protocol.Page.CaptureScreenshotRequestFormat} format
   * @param {number} quality
   * @param {!Protocol.Page.Viewport=} clip
   * @return {!Promise<?Protocol.binary>}
   */
  async captureScreenshot(format, quality, clip) {
    await OverlayModel.muteHighlight();
    const result = await this._agent.invoke_captureScreenshot({format, quality, clip, fromSurface: true});
    await OverlayModel.unmuteHighlight();
    return result.data;
  }

  /**
   * @return {!Promise<?{viewportX: number, viewportY: number, viewportScale: number, contentWidth: number, contentHeight: number}>}
   */
  async fetchLayoutMetrics() {
    const response = await this._agent.invoke_getLayoutMetrics();
    if (response.getError()) {
      return null;
    }
    return {
      viewportX: response.visualViewport.pageX,
      viewportY: response.visualViewport.pageY,
      viewportScale: response.visualViewport.scale,
      contentWidth: response.contentSize.width,
      contentHeight: response.contentSize.height
    };
  }

  /**
   * @override
   * @param {!Protocol.binary} data
   * @param {!Protocol.Page.ScreencastFrameMetadata} metadata
   * @param {!Protocol.integer} sessionId
   */
  screencastFrame(data, metadata, sessionId) {
    this._agent.invoke_screencastFrameAck({sessionId});
    if (this._onScreencastFrame) {
      this._onScreencastFrame.call(null, data, metadata);
    }
  }

  /**
   * @override
   * @param {boolean} visible
   */
  screencastVisibilityChanged(visible) {
    if (this._onScreencastVisibilityChanged) {
      this._onScreencastVisibilityChanged.call(null, visible);
    }
  }

  /**
   * @override
   * @param {number} time
   */
  domContentEventFired(time) {
  }

  /**
   * @override
   * @param {number} time
   */
  loadEventFired(time) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   * @param {!Protocol.Network.LoaderId} loaderId
   * @param {string} name
   * @param {number} time
   */
  lifecycleEvent(frameId, loaderId, name, time) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   * @param {string} url
   */
  navigatedWithinDocument(frameId, url) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   * @param {!Protocol.Page.FrameId} parentFrameId
   */
  frameAttached(frameId, parentFrameId) {
  }

  /**
   * @override
   * @param {!Protocol.Page.Frame} frame
   */
  frameNavigated(frame) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   */
  frameDetached(frameId) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   */
  frameStartedLoading(frameId) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   */
  frameStoppedLoading(frameId) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   */
  frameRequestedNavigation(frameId) {
  }


  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   * @param {number} delay
   */
  frameScheduledNavigation(frameId, delay) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   */
  frameClearedScheduledNavigation(frameId) {
  }

  /**
   * @override
   */
  frameResized() {
  }

  /**
   * @override
   * @param {string} url
   * @param {string} message
   * @param {string} dialogType
   * @param {boolean} hasBrowserHandler
   * @param {string=} prompt
   */
  javascriptDialogOpening(url, message, dialogType, hasBrowserHandler, prompt) {
  }

  /**
   * @override
   * @param {boolean} result
   * @param {string} userInput
   */
  javascriptDialogClosed(result, userInput) {
  }

  /**
   * @override
   */
  interstitialShown() {
  }

  /**
   * @override
   */
  interstitialHidden() {
  }

  /**
   * @override
   * @param {string} url
   * @param {string} windowName
   * @param {!Array<string>} windowFeatures
   * @param {boolean} userGesture
   */
  windowOpen(url, windowName, windowFeatures, userGesture) {
  }

  /**
   * @override
   * @param {string} mode
   */
  fileChooserOpened(mode) {
  }

  /**
   * @override
   * @param {string} url
   * @param {string} data
   */
  compilationCacheProduced(url, data) {
  }

  /**
   * @override
   * @param {!Protocol.Page.FrameId} frameId
   * @param {string} url
   */
  downloadWillBegin(frameId, url) {
  }

  /**
   * @override
   */
  downloadProgress() {
  }
}

SDKModel.register(ScreenCaptureModel, Capability.ScreenCapture, false);
