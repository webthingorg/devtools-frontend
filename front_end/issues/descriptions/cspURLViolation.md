# Content Security Policy of your site blocks some resources

Some resources are blocked because their origin is not listed in your site's Content Security Policy (CSP). Your site's CSP is allowlist-based, so resources must be listed in the allowlist in order to be accessed.

To fix this issue:

* (Recommended) If you're using an allowlist for `'script-src'`, consider switching from an allowlist CSP to a strict CSP, because strict CSPs are [more robust against XSS](issuesCSPWhyStrictOverAllowlist). [See how to set a strict CSP](issuesCSPSetStrict).
* Or carefully check that all of the blocked resources are trustworthy. If they are, include their sources in your site's CSP. ⚠️ Never add a source you don't trust to your site's CSP. If you don't trust the source, consider hosting resources on your own site instead.

Note: you can find and edit your site's CSP either in a HTTP header (recommended) or in a meta HTML tag.