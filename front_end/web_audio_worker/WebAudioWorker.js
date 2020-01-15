/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// TODO: this is a problem because dagre.js is an old module and not compatible
// with ESM.
import * as dagre from '../dagre_layout/dagre.js';

self.onmessage = function(event) {
  WebAudioWorker.layout(event.data);
};

/**
 * @param {string} graphJSON - Stringified JSON of the graph data.
 */
WebAudioWorker.layout = graphJSON => {
  // Restore the graph from serialized string
  const glGraph = dagre.graphlib.json.read(graphJSON);
  dagre.layout(glGraph);

  // Serialize the graph as string and send it back
  postMessage(dagre.graphlib.json.write(glGraph));
};

/* Legacy exported object */
self.WebAudioWorker = self.WebAudioWorker || {};

/* Legacy exported object */
WebAudioWorker = WebAudioWorker || {};
