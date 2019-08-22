/*
 * Copyright (C) 2014 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @implements {PerfUI.FlameChartDataProvider}
 * @unrestricted
 */
Timeline.UiDevtoolsFlameChartDataProvider = class extends Timeline.TimelineFlameChartDataProvider {
  _processGenericTrace() {
    this._appendFrames();
    const processGroupStyle = this._buildGroupStyle({shareHeaderLine: false});
    const threadGroupStyle = this._buildGroupStyle({padding: 2, nestingLevel: 1, shareHeaderLine: false});
    const eventEntryType = Timeline.TimelineFlameChartDataProvider.EntryType.Event;
    /** @type {!Multimap<!SDK.TracingModel.Process, !TimelineModel.TimelineModel.Track>} */
    const tracksByProcess = new Multimap();
    for (const track of this._model.tracks()) {
      if (track.thread !== null) {
        tracksByProcess.set(track.thread.process(), track);
      } else {
        // The Timings track can reach this point, so we should probably do something more useful.
        console.error('Failed to process track');
      }
    }
    for (const process of tracksByProcess.keysArray()) {
      if (tracksByProcess.size > 1) {
        const name = `${process.name()} ${process.id()}`;
        this._appendHeader(name, processGroupStyle, false /* selectable */);
      }
      for (const track of tracksByProcess.get(process)) {
        const group = this._appendSyncEvents(
            track, track.events, track.name, threadGroupStyle, eventEntryType, true /* selectable */);
        if (!this._timelineData.selectedGroup || track.name === TimelineModel.TimelineModel.BrowserMainThreadName)
          this._timelineData.selectedGroup = group;
      }
    }
  }

  /**
   * @override
   * @param {number} entryIndex
   * @return {string}
   */
  entryColor(entryIndex) {
    // This is not annotated due to closure compiler failure to properly infer cache container's template type.
    function patchColorAndCache(cache, key, lookupColor) {
      let color = cache.get(key);
      if (color)
        return color;
      const parsedColor = Common.Color.parse(lookupColor(key));
      color = parsedColor.setAlpha(0.7).asString(Common.Color.Format.RGBA) || '';
      cache.set(key, color);
      return color;
    }

    const entryTypes = Timeline.TimelineFlameChartDataProvider.EntryType;
    const type = this._entryType(entryIndex);
    if (type === entryTypes.Event) {
      const event = /** @type {!SDK.TracingModel.Event} */ (this._entryData[entryIndex]);
      if (this._model.isGenericTrace() && !TimelineModel.UiDevtoolsCommon.IsUiDevTools())
        return this._genericTraceEventColor(event);
      if (this._performanceModel.timelineModel().isMarkerEvent(event))
        return Timeline.TimelineUIUtils.markerStyleForEvent(event).color;
      if (!SDK.TracingModel.isAsyncPhase(event.phase))
        return this._colorForEvent(event);
      if (event.hasCategory(TimelineModel.TimelineModel.Category.Console) ||
          event.hasCategory(TimelineModel.TimelineModel.Category.UserTiming))
        return this._consoleColorGenerator.colorForID(event.name);
      if (event.hasCategory(TimelineModel.TimelineModel.Category.LatencyInfo)) {
        const phase =
            TimelineModel.TimelineIRModel.phaseForEvent(event) || TimelineModel.TimelineIRModel.Phases.Uncategorized;
        return patchColorAndCache(
            this._asyncColorByInteractionPhase, phase, Timeline.TimelineUIUtils.interactionPhaseColor);
      }
      const category = Timeline.TimelineUIUtils.eventStyle(event).category;
      return patchColorAndCache(this._asyncColorByCategory, category, () => category.color);
    }
    if (type === entryTypes.Frame)
      return 'white';
    if (type === entryTypes.InteractionRecord)
      return 'transparent';
    if (type === entryTypes.ExtensionEvent) {
      const event = /** @type {!SDK.TracingModel.Event} */ (this._entryData[entryIndex]);
      return this._extensionColorGenerator.colorForID(event.name);
    }
    return '';
  }
};