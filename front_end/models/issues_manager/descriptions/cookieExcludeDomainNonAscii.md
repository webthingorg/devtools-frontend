# Ensure cookie domain attribute values only contain ASCII characters

Domain attributes in cookies are restricted to the ASCII character set. Any
cookies that contain characters outside of the ASCII range will be ignored.

To resolve this issue, you need to remove all non-ASCII characters from the
domain attribute of the affected cookies.

If your site has an internationalized domain name (IDN), you should use
[punycode](punycodeReference) annotation for the domain attribute instead.
