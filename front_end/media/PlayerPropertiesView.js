// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @unrestricted
 */
Media.PropertyRenderer = class extends UI.VBox {
  constructor(title) {
    super();
    this.contentElement.classList.add('media-property-renderer');
    this._title = this.contentElement.createChild('span', 'media-property-renderer-title');
    this._contents = this.contentElement.createChild('span', 'media-property-renderer-contents');
    this._title.createTextChild(title);
    this._title = title;
    this._value = null;
    this._pseudo_color_protection_element = null;
    this.contentElement.classList.add('media-property-renderer-hidden');
  }

  updateData(propname, propvalue) {
    // convert all empty possibilities into nulls for easier handling.
    if (propvalue === '' || propvalue === null) {
      return this._updateData(propname, null);
    }
    try {
      propvalue = JSON.parse(propvalue);
    } catch (err) {
      // TODO(tmathmeyer) typecheck the type of propvalue against
      // something defined or sourced from the c++ definitions.
      // Do nothing, some strings just stay strings!
    }
    return this._updateData(propname, propvalue);
  }

  _updateData(propname, propvalue) {
    if (propvalue === null) {
      this.changeContents(null);
    } else if (this._value === propvalue) {
      return;  // Don't rebuild element!
    } else {
      this._value = propvalue;
      this.changeContents(propvalue);
    }
  }

  changeContents(value) {
    if (value === null) {
      this.contentElement.classList.add('media-property-renderer-hidden');
      if (this._pseudo_color_protection_element === null) {
        this._pseudo_color_protection_element = createElementWithClass('div', 'media-property-renderer');
        this._pseudo_color_protection_element.classList.add('media-property-renderer-hidden');
        this.contentElement.parentNode.insertBefore(this._pseudo_color_protection_element, this.contentElement);
      }
    } else {
      if (this._pseudo_color_protection_element !== null) {
        this.contentElement.parentNode.removeChild(this._pseudo_color_protection_element);
        this._pseudo_color_protection_element = null;
      }
      this.contentElement.classList.remove('media-property-renderer-hidden');
      this._contents.removeChildren();
      const spanElement = createElement('span');
      spanElement.textContent = value;
      this._contents.appendChild(spanElement);
    }
  }
};

Media.FormattedPropertyRenderer = class extends Media.PropertyRenderer {
  constructor(title, formatfunction) {
    super(Common.UIString(title));
    this._formatfunction = formatfunction;
  }

  /**
   * @override
   */
  _updateData(propname, propvalue) {
    if (propvalue === null) {
      this.changeContents(null);
    } else {
      this.changeContents(this._formatfunction(propvalue));
    }
  }
};

/**
 * @unrestricted
 */
Media.DefaultPropertyRenderer = class extends Media.PropertyRenderer {
  constructor(title, default_text) {
    super(Common.UIString(title));
    this.changeContents(default_text);
  }
};

/**
 * @unrestricted
 */
Media.DimensionPropertyRenderer = class extends Media.PropertyRenderer {
  constructor(title) {
    super(Common.UIString(title));
    this._width = 0;
    this._height = 0;
  }

  /**
   * @override
   */
  _updateData(propname, propvalue) {
    let needs_update = false;
    if (propname === 'width' && propvalue !== this._width) {
      this._width = propvalue;
      needs_update = true;
    }
    if (propname === 'height' && propvalue !== this._height) {
      this._height = propvalue;
      needs_update = true;
    }
    // If both properties arent set, don't bother updating, since
    // temporarily showing ie: 1920x0 is meaningless.
    if (this._width === 0 || this._height === 0) {
      this.changeContents(null);
    } else if (needs_update) {
      this.changeContents(`${this._width}x${this._height}`);
    }
  }
};

/**
 * @unrestricted
 */
Media.AttributesView = class extends UI.VBox {
  constructor(elements) {
    super();
    this.contentElement.classList.add('media-attributes-view');

    for (const index in elements) {
      elements[index].show(this.contentElement);
    }
  }
};

Media.TrackManager = class {
  constructor(properties_view, type) {
    this._type = type;
    this._view = properties_view;
    this._previous_tabs = [];
  }

  updateData(name, value) {
    const tabs = this._view.GetTabs(this._type);
    tabs.RemoveTabs(this._previous_tabs);

    const newtabs = /** @type {!Array.<!Object>} */ (JSON.parse(value));
    let enumerate = 1;
    for (const tabdata of newtabs) {
      this.addNewTab(tabs, tabdata, enumerate);
      enumerate++;
    }
  }

  addNewTab(tabs, data, index) {
    // abstract method!
  }
};

Media.VideoTrackManager = class extends Media.TrackManager {
  constructor(properties_view) {
    super(properties_view, 'video');
  }

  /**
   * @override
   */
  addNewTab(tabs, tabdata, tabnumber) {
    const tab_elements = [];
    for (const name in tabdata) {
      tab_elements.push(new Media.DefaultPropertyRenderer(name, tabdata[name]));
    }
    const newtab = new Media.AttributesView(tab_elements);
    tabs.CreateAndAddDropdownButton('tab_' + tabnumber, {'title': UI.html`Track #${tabnumber}`, 'element': newtab});
  }
};

Media.AudioTrackManager = class extends Media.TrackManager {
  constructor(properties_view) {
    super(properties_view, 'audio');
  }

  /**
   * @override
   */
  addNewTab(tabs, tabdata, tabnumber) {
    const tab_elements = [];
    for (const name in tabdata) {
      tab_elements.push(new Media.DefaultPropertyRenderer(name, tabdata[name]));
    }
    const newtab = new Media.AttributesView(tab_elements);
    tabs.CreateAndAddDropdownButton('tab_' + tabnumber, {'title': UI.html`Track #${tabnumber}`, 'element': newtab});
  }
};

/**
 * @unrestricted
 */
Media.PlayerPropertiesView = class extends UI.VBox {
  constructor() {
    super();
    this.contentElement.classList.add('media-properties-frame');
    this.registerRequiredCSS('media/playerPropertiesView.css');
    this.populateAttributesAndElements();
    this._video_properties = new Media.AttributesView(this._media_elements);
    this._video_decoder_properties = new Media.AttributesView(this._video_decoder_elements);
    this._audio_decoder_properties = new Media.AttributesView(this._audio_decoder_elements);

    const video = new Media.ChevronTabbedPanel({'tab': {'title': UI.html`Media`, 'element': this._video_properties}});
    video.contentElement.classList.add('media-properties-view');
    video.show(this.contentElement);

    this._video_decoder_tab = new Media.ChevronTabbedPanel(
        {'tab': {'title': UI.html`Video Decoder`, 'element': this._video_decoder_properties}});
    this._video_decoder_tab.contentElement.classList.add('media-properties-view');
    this._video_decoder_tab.show(this.contentElement);

    this._audio_decoder_tab = new Media.ChevronTabbedPanel(
        {'tab': {'title': UI.html`Audio Decoder`, 'element': this._audio_decoder_properties}});
    this._audio_decoder_tab.contentElement.classList.add('media-properties-view');
    this._audio_decoder_tab.show(this.contentElement);
  }

  GetTabs(type) {
    if (type === 'audio') {
      return this._audio_decoder_tab;
    }
    if (type === 'video') {
      return this._video_decoder_tab;
    }
  }

  /**
   * @param {string} playerID
   * @param {!Array.<!Media.Event>} changes
   * @param {!Media.MediaModel.MediaChangeTypeKeys} change_type
   */
  renderChanges(playerID, changes, change_type) {
    for (const change of changes) {
      const renderer = this._attribute_map[change.name];
      if (renderer) {
        renderer.updateData(change.name, change.value);
      } else {
        // TODO(tmathmeyer) throw exception or log it in some way.
      }
    }
  }

  formatKbps(bitsPerSecond) {
    if (bitsPerSecond === '') {
      return '0 kbps';
    }
    return `${~~(bitsPerSecond / 1024)} kbps`;
  }

  formatTime(seconds) {
    if (seconds === '') {
      return '0:00';
    }
    const date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
  }

  formatFileSize(bytes) {
    if (bytes === '') {
      return '0 Bytes';
    }
    const power = Math.floor(Math.log(bytes) / Math.log(1024));
    const suffix = ['Bytes', 'KB', 'MB', 'GB', 'TB'][power];
    return `${(bytes / Math.pow(1024, power)).toFixed(2)} ${suffix}`;
  }

  populateAttributesAndElements() {
    // Lists of Media.PropertyRenderer
    this._media_elements = [];
    this._video_decoder_elements = [];
    this._audio_decoder_elements = [];

    // Map from incoming change_id => Media.PropertyRenderer
    this._attribute_map = {};

    /* Media properties */
    const resolution = new Media.PropertyRenderer('Resolution');
    this._media_elements.push(resolution);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kResolution] = resolution;

    const file_size = new Media.FormattedPropertyRenderer('File Size', this.formatFileSize);
    this._media_elements.push(file_size);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kTotalBytes] = file_size;

    const bitrate = new Media.FormattedPropertyRenderer('Bitrate', this.formatKbps);
    this._media_elements.push(bitrate);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kBitrate] = bitrate;

    const duration = new Media.FormattedPropertyRenderer('Duration', this.formatTime);
    this._media_elements.push(duration);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kMaxDuration] = duration;

    const start_time = new Media.PropertyRenderer('Start Time');
    this._media_elements.push(start_time);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kStartTime] = start_time;

    const streaming = new Media.PropertyRenderer('Streaming');
    this._media_elements.push(streaming);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsStreaming] = streaming;

    const frame_url = new Media.PropertyRenderer('Playback Frame URL');
    this._media_elements.push(frame_url);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kFrameUrl] = frame_url;

    const frame_title = new Media.PropertyRenderer('Playback Frame Title');
    this._media_elements.push(frame_title);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kFrameTitle] = frame_title;

    const single_origin = new Media.PropertyRenderer('Is Single Origin Playback');
    this._media_elements.push(single_origin);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsSingleOrigin] = single_origin;

    const range_headers = new Media.PropertyRenderer('Range Header Support');
    this._media_elements.push(range_headers);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsRangeHeaderSupported] = range_headers;

    /* Video Decoder Properties */
    const decoder_name = new Media.DefaultPropertyRenderer('Decoder Name', 'No Decoder');
    this._video_decoder_elements.push(decoder_name);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kVideoDecoderName] = decoder_name;

    const video_platform_decoder = new Media.PropertyRenderer('Hardware Decoder');
    this._video_decoder_elements.push(video_platform_decoder);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsPlatformVideoDecoder] = video_platform_decoder;

    const video_dds = new Media.PropertyRenderer('Decrypting Demuxer');
    this._video_decoder_elements.push(video_dds);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsVideoDecryptingDemuxerStream] = video_dds;

    const video_track_manager = new Media.VideoTrackManager(this);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kVideoTracks] = video_track_manager;

    /* Audio Decoder Properties */
    const audio_decoder = new Media.DefaultPropertyRenderer('Decoder Name', 'No Decoder');
    this._audio_decoder_elements.push(audio_decoder);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kAudioDecoderName] = audio_decoder;

    const audio_platform_decoder = new Media.PropertyRenderer('Hardware Decoder');
    this._audio_decoder_elements.push(audio_platform_decoder);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsPlatformAudioDecoder] = audio_platform_decoder;

    const audio_dds = new Media.PropertyRenderer('Decrypting Demuxer');
    this._audio_decoder_elements.push(audio_dds);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kIsAudioDecryptingDemuxerStream] = audio_dds;

    const audio_track_manager = new Media.AudioTrackManager(this);
    this._attribute_map[Media.PlayerPropertiesView.PlayerProperties.kAudioTracks] = audio_track_manager;
  }
};

/** @enum {string} */
Media.PlayerPropertiesView.PlayerProperties = {
  kResolution: 'kResolution',
  kTotalBytes: 'kTotalBytes',
  kBitrate: 'kBitrate',
  kMaxDuration: 'kMaxDuration',
  kStartTime: 'kStartTime',
  kIsVideoEncrypted: 'kIsVideoEncrypted',
  kIsStreaming: 'kIsStreaming',
  kFrameUrl: 'kFrameUrl',
  kFrameTitle: 'kFrameTitle',
  kIsSingleOrigin: 'kIsSingleOrigin',
  kIsRangeHeaderSupported: 'kIsRangeHeaderSupported',
  kVideoDecoderName: 'kVideoDecoderName',
  kAudioDecoderName: 'kAudioDecoderName',
  kIsPlatformVideoDecoder: 'kIsPlatformVideoDecoder',
  kIsPlatformAudioDecoder: 'kIsPlatformAudioDecoder',
  kIsVideoDecryptingDemuxerStream: 'kIsVideoDecryptingDemuxerStream',
  kIsAudioDecryptingDemuxerStream: 'kIsAudioDecryptingDemuxerStream',
  kAudioTracks: 'kAudioTracks',
  kVideoTracks: 'kVideoTracks',
};
