// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {PlayerEvent} from './MediaModel.js';  // eslint-disable-line no-unused-vars
import {ColdColorScheme, HotColorScheme, TickingFlameChart} from './EasyFlame.js';


/** @enum {string} */
const EventText = {
  kWebMediaPlayerCreated: ls`Player Created`,
  kDurationChanged: ls`Duration Changed`,
  kVideoSizeChanged: ls`Video resolution changed`,
  kLoad: ls`Url loaded`,

  kPipelineStateChange: ls`Pipeline State Change`,
  kBufferingStateChanged: ls`Buffering state changed`,
  
  // Playback states
  kPlay: ls`Playing`,
  kPause: ls`Paused`,
  kSuspended: ls`Suspended`,
};

class AutoGroups {
  constructor(easyFlameInstance) {
    this._easyFlame = easyFlameInstance;
    this._symbolBindings = {}
  }

  addGroup(name, symbols) {
    const group = this._easyFlame.bindGroup({
      groupName: name,
      timelineSymbols: symbols
    });

    group.recent = null;
    
    for (let symbol of symbols) {
      this._symbolBindings[symbol] = group;
    }
  }

  startEvent(symbol, timestamp) {
    const group = this._symbolBindings[EventText[symbol]];
    if (!group) {
      console.log(symbol);
      console.log(this._symbolBindings);
      throw `invalid symbol: ${symbol}`;
    }
    if (group.recent !== null)
      group.recent.stop()
    group.recent = group.startEvent(EventText[symbol], timestamp);
  }
}









/**
 * @unrestricted
 */
export class PlayerEventsTimeline extends TickingFlameChart {
  constructor() {
    super();

    this._normalizedTimestamp = -1;

    this.addGroup('Playback Status', 1);
    this.addGroup('Buffering Status', 2);  // video on top, audio on bottom

    this._playback_status_last_event = null;
    this._bufferingState = [null, null]; // video, then audio.
  }

  _onPlaybackEvent(event, normalized_time) {
    switch(event.event) {
      case 'kPlay':
        this.canTick = true;
        if (this._playback_status_last_event != null) {
          this._playback_status_last_event.endTime = normalized_time;
        }
        this._playback_status_last_event = this.startEvent(normalized_time, 'Play');
        this._playback_status_last_event.color = HotColorScheme[0];
        break;

      case 'kPause':
        if (this._playback_status_last_event != null) {
          this._playback_status_last_event.endTime = normalized_time;
        }
        this._playback_status_last_event = this.startEvent(normalized_time, 'Pause');
        this._playback_status_last_event.color = HotColorScheme[1];
        break;

      case 'kWebMediaPlayerDestroyed':
      case 'kSuspended':
        this.canTick = false;
        // Intentionally don't break, but ended shoun't prevent ticking.
      case 'kEnded':
        if (this._playback_status_last_event != null) {
          this._playback_status_last_event.endTime = normalized_time;
          this._playback_status_last_event = null;
        }
        break;

      default:
        throw `_onPlaybackEvent cant handle ${event.event}`;
    }
  }

  _buffered_enough(state) {
    return state['state'] == 'BUFFERING_HAVE_ENOUGH';
  }

  _onBufferingStatus(event, normalized_time) {
    switch(event.event) {
      case 'kBufferingStateChanged':
        const audio_state = event.value['audio_buffering_state'];
        const video_state = event.value['video_buffering_state'];

        if (audio_state) {
          if (this._bufferingState[1] !== null) {
            this._bufferingState[1].endTime = normalized_time;
            this._bufferingState[1] = null;
          }
          if (!this._buffered_enough(audio_state)) {
            this._bufferingState[1] = this.startEvent(normalized_time, "Audio buffering");
            this._bufferingState[1].color = ColdColorScheme[1];
            this._bufferingState[1].level = 2;
            this._bufferingState[1].displayData = {'Type': 'Audio', 'State': 'Buffering'};
          }
        }

        if (video_state) {
          if (this._bufferingState[0] !== null) {
            this._bufferingState[0].endTime = normalized_time;
            this._bufferingState[0] = null;
          }
          if (!this._buffered_enough(video_state)) {
            this._bufferingState[0] = this.startEvent(normalized_time, "Video buffering");
            this._bufferingState[0].color = ColdColorScheme[0];
            this._bufferingState[0].level = 1;
            this._bufferingState[0].displayData = {'Type': 'Video', 'State': 'Buffering'};
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
    if (this._normalizedTimestamp === -1)
      this._normalizedTimestamp = event.timestamp;
    const in_ms = (event.timestamp - this._normalizedTimestamp) * 1000;

    switch(event.event) {
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
