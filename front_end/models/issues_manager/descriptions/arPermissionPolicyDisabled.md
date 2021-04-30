# Ensure the "attribution-reporting" Permission Policy is enabled when using AR API

A usage of the Attribution Reporting API (AR API) was aborted early, because the `attribution-reporting`
Permission Policy was not enabled.

The AR API is enabled by default in the top-level context and in same-origin child frames, but must
be explicitly opted-in for cross-origin frames.
