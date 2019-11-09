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
    return this._updateData(propname, propvalue);
  }

  _updateData(propname, propvalue) {
    if (propvalue === null) {
      this.changeContents(null);
    } else if (this._value === propvalue) {
      return;  // Don't rebuild element!
    } else {
      this._value = propvalue;
      this.changeContents(document.createTextNode(propvalue));
    }
  }

  changeContents(element) {
    if (element === null) {
      this.contentElement.classList.add('media-property-renderer-hidden');
      if (this._pseudo_color_protection_element === null) {
        this._pseudo_color_protection_element = document.createElement('div');
        this._pseudo_color_protection_element.classList.add('media-property-renderer');
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
      this._contents.appendChild(element);
    }
  }
};

Media.FormattedPropertyRenderer = class extends Media.PropertyRenderer {
  constructor(title, formatfunction) {
    super(Common.UIString(title));
    this._formatfunction = formatfunction;
  }

  _updateData(propname, propvalue) {
    if (propvalue === null) {
      this.changeContents(null);
    } else {
      this.changeContents(document.createTextNode(this._formatfunction(propvalue)));
    }
  }
};

/**
 * @unrestricted
 */
Media.DefaultPropertyRenderer = class extends Media.PropertyRenderer {
  constructor(title, default_text) {
    super(Common.UIString(title));
    this.changeContents(UI.html`${default_text}`);
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
      this.changeContents(UI.html`${this._width}x${this._height}`);
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

/**
 * @unrestricted
 */
Media.PlayerPropertiesView = class extends UI.VBox {
  constructor() {
    super();
    this.contentElement.classList.add('media-properties-frame');
    this.registerRequiredCSS('media/playerPropertiesView.css');
    this.populateAttributesAndElements();
    this._video_properties = new Media.AttributesView(this._video_elements);
    this._origin_properties = new Media.AttributesView(this._origin_elements);
    this._video_decoder_properties = new Media.AttributesView(this._video_decoder_elements);
    this._audio_decoder_properties = new Media.AttributesView(this._audio_decoder_elements);

    const video = new Media.ChevronTabbedPanel({'tab': {'title': UI.html`Video`, 'element': this._video_properties}});
    video.contentElement.classList.add('media-properties-view');
    video.show(this.contentElement);

    const origin =
        new Media.ChevronTabbedPanel({'tab': {'title': UI.html`Origin`, 'element': this._origin_properties}});
    origin.contentElement.classList.add('media-properties-view');
    origin.show(this.contentElement);

    const video_decoder = new Media.ChevronTabbedPanel(
        {'tab': {'title': UI.html`Video Decoder`, 'element': this._video_decoder_properties}});
    video_decoder.contentElement.classList.add('media-properties-view');
    video_decoder.show(this.contentElement);

    const audio_decoder = new Media.ChevronTabbedPanel(
        {'tab': {'title': UI.html`Audio Decoder`, 'element': this._audio_decoder_properties}});
    audio_decoder.contentElement.classList.add('media-properties-view');
    audio_decoder.show(this.contentElement);
  }

  /**
   * @param {string} playerID
   * @param {!Array.<!Media.Event>} changes
   * @param {!Media.MediaModel.MediaChangeTypeKeys} change_type
   */
  renderChanges(playerID, changes, change_type) {
    for (const change of changes) {
      const renderer = this._attribute_map[change['name']];
      if (renderer) {
        renderer.updateData(change['name'], change['value']);
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
    this._video_elements = [];
    this._origin_elements = [];
    this._video_decoder_elements = [];
    this._audio_decoder_elements = [];

    // Map from incoming change_id => Media.PropertyRenderer
    this._attribute_map = {};

    /* Video properties */
    const resolution = new Media.DimensionPropertyRenderer('Resolution');
    this._video_elements.push(resolution);
    this._attribute_map['kWidth'] = resolution;
    this._attribute_map['kHeight'] = resolution;

    const file_size = new Media.FormattedPropertyRenderer('File Size', this.formatFileSize);
    this._video_elements.push(file_size);
    this._attribute_map['kTotalBytes'] = file_size;

    const bitrate = new Media.FormattedPropertyRenderer('Bitrate', this.formatKbps);
    this._video_elements.push(bitrate);
    this._attribute_map['kBitrate'] = bitrate;

    const duration = new Media.FormattedPropertyRenderer('Duration', this.formatTime);
    this._video_elements.push(duration);
    this._attribute_map['kMaxDuration'] = duration;

    const start_time = new Media.PropertyRenderer('Start Time');
    this._video_elements.push(start_time);
    this._attribute_map['kStartTime'] = start_time;

    // TODO(tmathmeyer): add encoding renderer
    const video_encoding = new Media.PropertyRenderer('Video Codec');
    this._video_elements.push(video_encoding);
    this._attribute_map['kVideoCodecName'] = video_encoding;

    const encrypted = new Media.PropertyRenderer('Video Contents Encrypted');
    this._video_elements.push(encrypted);
    this._attribute_map['kIsVideoEncrypted'] = encrypted;

    const streaming = new Media.PropertyRenderer('Streaming');
    this._video_elements.push(streaming);
    this._attribute_map['kIsStreaming'] = streaming;

    /* Frame properties */
    const frame_url = new Media.PropertyRenderer('Playback Frame URL');
    this._origin_elements.push(frame_url);
    this._attribute_map['kFrameUrl'] = frame_url;

    const frame_title = new Media.PropertyRenderer('Playback Frame Title');
    this._origin_elements.push(frame_title);
    this._attribute_map['kFrameTitle'] = frame_title;

    const single_origin = new Media.PropertyRenderer('Is Single Origin Playback');
    this._origin_elements.push(single_origin);
    this._attribute_map['kIsSingleOrigin'] = single_origin;

    /* Video Decoder Properties */
    const has_video = new Media.DefaultPropertyRenderer('Has Video', 'false');
    this._video_decoder_elements.push(has_video);
    this._attribute_map['kHasFoundVideoStream'] = has_video;

    const decoder_name = new Media.PropertyRenderer('Decoder Name');
    this._video_decoder_elements.push(decoder_name);
    this._attribute_map['kVideoDecoderName'] = decoder_name;

    const video_platform_decoder = new Media.PropertyRenderer('Hardware Decoder');
    this._video_decoder_elements.push(video_platform_decoder);
    this._attribute_map['kIsPlatformVideoDecoder'] = video_platform_decoder;

    const suspended_start = new Media.PropertyRenderer('Suspended Start');
    this._video_decoder_elements.push(suspended_start);
    this._attribute_map['kIsForSuspendedStart'] = suspended_start;

    const range_headers = new Media.PropertyRenderer('Range Header Support');
    this._video_decoder_elements.push(range_headers);
    this._attribute_map['kIsRangeHeaderSupported'] = range_headers;

    const surface_layer_mode = new Media.PropertyRenderer('Surface Layer Mode');
    this._video_decoder_elements.push(surface_layer_mode);
    this._attribute_map['kSurfaceLayerMode'] = surface_layer_mode;

    const time_base = new Media.PropertyRenderer('Time Base');
    this._video_decoder_elements.push(time_base);
    this._attribute_map['kTimeBase'] = time_base;

    const video_dds = new Media.PropertyRenderer('Decrypting Demuxer');
    this._video_decoder_elements.push(video_dds);
    this._attribute_map['kIsVideoDDS'] = video_dds;

    /* Audio Decoder Properties */
    const has_audio = new Media.DefaultPropertyRenderer('Has Audio', 'false');
    this._audio_decoder_elements.push(has_audio);
    this._attribute_map['kHasFoundAudioStream'] = has_audio;

    const audio_decoder = new Media.PropertyRenderer('Decoder Name');
    this._audio_decoder_elements.push(audio_decoder);
    this._attribute_map['kAudioDecoderName'] = audio_decoder;

    const audio_platform_decoder = new Media.PropertyRenderer('Hardware Decoder');
    this._video_decoder_elements.push(audio_platform_decoder);
    this._attribute_map['kIsPlatformAudioDecoder'] = audio_platform_decoder;

    const audio_codec_name = new Media.PropertyRenderer('Codec');
    this._audio_decoder_elements.push(audio_codec_name);
    this._attribute_map['kAudioCodecName'] = audio_codec_name;

    const audio_channels = new Media.PropertyRenderer('Channels');
    this._audio_decoder_elements.push(audio_channels);
    this._attribute_map['kAudioChannelsCount'] = audio_channels;

    const audio_dds = new Media.PropertyRenderer('Decrypting Demuxer');
    this._audio_decoder_elements.push(audio_dds);
    this._attribute_map['kIsAudioDDS'] = audio_dds;

    const audio_sample_format = new Media.PropertyRenderer('Sample Format');
    this._audio_decoder_elements.push(audio_sample_format);
    this._attribute_map['kAudioSampleFormat'] = audio_sample_format;

    const audio_samples_per_second = new Media.PropertyRenderer('Samples Per Second');
    this._audio_decoder_elements.push(audio_samples_per_second);
    this._attribute_map['kAudioSamplesPerSecond'] = audio_samples_per_second;
  }
};
