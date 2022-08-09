# An attribution trigger registration was ignored because the request was ineligible

This page tried to register a trigger using the Attribution Reporting API, but
the request was ineligible to do so, so the trigger registration was ignored.

The registrations, if any, that a request is eligible for are indicated in the
request's `Attribution-Reporting-Eligible` header, which contains a structured
dictionary.

If the dictionary contains `navigation-source` or `event-source`, the response
may register a source using the `Attribution-Reporting-Register-Source` header.

If the dictionary contains `trigger`, the response may register a trigger using
the `Attribution-Reporting-Register-Trigger` header.

Otherwise, neither a source nor a trigger may be registered.

The absence of the `Attribution-Reporting-Eligible` request header is
equivalent to it containing only `trigger`.

Additionally, a single HTTP redirect chain may contain only all sources or all
triggers, not a combination of both.
