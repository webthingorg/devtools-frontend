# Client Hint meta tag modified by javascript

Only accept-ch meta tags in the original HTML sent from the server
are respected. Any injected via javascript (or other means) are ignored.

NOTE: Only accept-ch meta tags before any content-security-policy meta tag
will be respected for now; this restriction may be lifted in the future.
