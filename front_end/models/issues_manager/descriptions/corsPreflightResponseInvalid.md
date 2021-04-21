# Ensure preflight responses are valid

A cross-origin resource sharing (CORS) request was blocked because the associated [preflight request](issueCorsPreflightRequest) was responded with an invalid response code and/or was a redirect.

To fix this issue, ensure all CORS preflight `OPTION` requests are answered with HTTP status code 200 (OK) and do not redirect.
