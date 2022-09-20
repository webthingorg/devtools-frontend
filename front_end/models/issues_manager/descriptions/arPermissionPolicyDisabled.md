# Ensure that the `attribution-reporting` permission policy is enabled

This page tried to use the Attribution Reporting API but failed because the
`attribution-reporting` permission policy is not enabled.

This API is enabled by default in the top-level context and in same-origin
child frames, but should be explicitly opted-in for cross-origin frames. Add the
permission policy as follows:
`<iframe src="..." allow="attribution-reporting">`.

Note: for the initial testing of the Attribution Reporting API, it is not
required to opt-in cross-origin frames, but will become necessary when the API
matures.
