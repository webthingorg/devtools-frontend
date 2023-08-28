Sync Tracks show synchronous events happening on threads detected on a profile. A track is created for each thread in a profile, which could be for example each main thread of each frame in a website trace, or the single thread in a Node.js profile.

## Browser Traces
Threads are extracted and exported by the RendererHandler. To assemble the data of a thread, the renderer handler uses two distinct types of data: trace events and CPU samples. Trace events are dispatched by processes in the browser and denote activity happening in the browser and their content includes a timestamp and an optional duration. If no duration is present, it is assumed that the event is an instant.

CPU samples, on the other hand, are gathered by V8 and denote JS functions execution. Unlike trace events, samples don't have a duration. Instead, they carry information about the state of the JS stack at different points in time, separated by a [predefined interval](https://source.chromium.org/chromium/chromium/src/+/1fab167b80daecb09e388ac021861eecd60340f8:v8/src/profiler/tracing-cpu-profiler.cc;l=90;bpv=1;bpt=0). This means that the duration of each function executed during a profile (AKA profile call) is only implicit, and needs to be calculated by the client.

Browser data from trace events and JS execution data from samples are combined in the Performance panel so that they are shown together in the timeline. That way, developers are able to know not only what was happening on the browser/renderer level but also what JS code was being executed at any given point in time. Because of the inherent incompleteness of the sampled JS data (information gaps between each sample), this combination is not trivial and requires us to use heuristics to approximate what the whole picture looked like. More details on this below.

### Building profile calls
Profile calls are the result of processing CPU profile data to determine the execution timings of JS functions in a profile. They contain a call frame, a timestamp and a duration. The term "JS Frame" is also used interchangeably. CPU profiles contain the parent-child relationships between functions, from which calls stacks are derived, and the sample data itself, which records what was at the top of the stack at each sampled time. Using these two pieces of information, the JS flame chart can be easily built (see usages of the `forEachFrame` function in [CPUProfileDataModel](../../models/cpu_profile/CPUProfileDataModel.ts) for examples of this). What is not so trivial is combining this data

### Combining trace events and JS (CPU) profiles


