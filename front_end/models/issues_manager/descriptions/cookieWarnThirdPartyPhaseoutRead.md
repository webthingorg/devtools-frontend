# Reading cookie in cross-site context will be blocked in future Chrome versions

Cookies with the attributes `SameSite=None; Secure` and not `Partitioned` that are accessed in cross-site contexts are considered third-party cookies.
In a future version of the browser, reading third-party cookies will be blocked.
This behavior protects user data from cross-site tracking.

Please refer to the article linked to learn more about preparing your site to avoid potential breakage.
