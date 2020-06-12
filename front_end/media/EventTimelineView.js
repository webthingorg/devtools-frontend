// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {PlayerEvent} from './MediaModel.js';  // eslint-disable-line no-unused-vars
import {ColdColorScheme, HotColorScheme, TickingFlameChart} from './TickingFlameChart.js';


/**
 * @typedef {{
 *     level: int,
 *     startTime: int,
 *     duration: int,
 *     name: string,
 *     color: string,
 *     hoverData: Object
 * }}
 */


/**
 * @unrestricted
 */
export class PlayerEventsTimeline extends TickingFlameChart {
  constructor() {
    super();

    this._normalizedTimestamp = -1;

    this.addGroup('Playback Status', 1);
    this.addGroup('Buffering Status', 2);  // video on top, audio on bottom

    this._playbackStatusLastEvent = null;
    this._audioBufferingStateEvent = null;
    this._videoBufferingStateEvent = null;
  }

  _ensureNoPreviousPlaybackEvent(normalizedTime) {
    if (this._playbackStatusLastEvent !== null) {
      this._playbackStatusLastEvent.endTime = normalizedTime;
      this._playbackStatusLastEvent = null;
    }
  }

  /**
   * Playback events are {kPlay, kPause, kSuspended, kEnded, and kWebMediaPlayerDestroyed}
   * once destroyed, a player cannot recieve more events of any kind.
   */
  _onPlaybackEvent(event, normalizedTime) {
    switch (event.event) {
      case 'kPlay':
        this.canTick = true;
        this._ensureNoPreviousPlaybackEvent(normalizedTime);

        this._playbackStatusLastEvent = this.startEvent({level: 0, startTime: normalizedTime, name: 'Play'});
        break;

      case 'kPause':
        // Don't change ticking state - the player is still active even during
        // video pause. It may recieve buffering events, seeks, etc.
        this._ensureNoPreviousPlaybackEvent(normalizedTime);
        this._playbackStatusLastEvent =
            this.startEvent({level: 0, startTime: normalizedTime, name: 'Pause', color: HotColorScheme[1]});
        break;

      case 'kWebMediaPlayerDestroyed':
      case 'kSuspended':
        // Other event's can't happen during suspension or while the player is
        // destroyed, so stop the ticking.
        this.canTick = false;
        this._ensureNoPreviousPlaybackEvent(normalizedTime);
        break;

      case 'kEnded':
        // Player ending can still have seeks & other events.
        this._ensureNoPreviousPlaybackEvent(normalizedTime);
        this._playbackStatusLastEvent =
            this.startEvent({level: 0, startTime: normalizedTime, name: 'Ended', color: HotColorScheme[2]});
        break;

      default:
        throw `_onPlaybackEvent cant handle ${event.event}`;
    }
  }

  _bufferedEnough(state) {
    return state['state'] === 'BUFFERING_HAVE_ENOUGH';
  }

  _onBufferingStatus(event, normalizedTime) {
    // No declarations inside the case labels.
    let audioState = null;
    let videoState = null;

    switch (event.event) {
      case 'kBufferingStateChanged':
        // There are three allowed entries, audio, video, and pipeline.
        // We only want the buffering for audio and video to be displayed.
        // One event may have changes for a single type, or for both audio/video
        // simultaneously.
        audioState = event.value['audio_buffering_state'];
        videoState = event.value['video_buffering_state'];

        if (audioState) {
          if (this._audioBufferingStateEvent !== null) {
            this._audioBufferingStateEvent.endTime = normalizedTime;
            this._audioBufferingStateEvent = null;
          }
          if (!this._bufferedEnough(audioState)) {
            this._audioBufferingStateEvent = this.startEvent({
              level: 2,
              startTime: normalizedTime,
              name: 'Audio Buffering',
              color: ColdColorScheme[1],
            });
          }
        }

        if (videoState) {
          if (this._videoBufferingStateEvent !== null) {
            this._videoBufferingStateEvent.endTime = normalizedTime;
            this._videoBufferingStateEvent = null;
          }
          if (!this._bufferedEnough(videoState)) {
            this._videoBufferingStateEvent = this.startEvent({
              level: 1,
              startTime: normalizedTime,
              name: 'Video Buffering',
              color: ColdColorScheme[0],
            });
          }
        }
        break;

      default:
        throw `_onPlaybackEvent cant handle ${event.event}`;
    }
  }

  /**
   * @param {!PlayerEvent} event
   */
  onEvent(event) {
    if (this._normalizedTimestamp === -1) {
      this._normalizedTimestamp = event.timestamp;
    }
    const in_ms = (event.timestamp - this._normalizedTimestamp) * 1000;

    switch (event.event) {
      case 'kPlay':
      case 'kPause':
      case 'kWebMediaPlayerDestroyed':
      case 'kSuspended':
      case 'kEnded':
        return this._onPlaybackEvent(event, in_ms);

      case 'kBufferingStateChanged':
        return this._onBufferingStatus(event, in_ms);

      default:
    }
  }
}
