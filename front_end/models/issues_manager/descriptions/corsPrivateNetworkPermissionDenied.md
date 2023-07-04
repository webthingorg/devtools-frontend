# Ensure private network requests made from secure context to plaintext resources can gain access from user permission

A site requeted a resource from a network that it could only access beacuase of its users' privileged network position.
These requests expose devices and servers to the internet, increasing the risk of a cross-site request forgery (CSRF) attack, and/or information leakage.

To mitigate these risks, Chrome deprecates requests to non-public subresources when initiated from non-secure contexts, and will start blocking them in Chrome 120 (January 2024).

To fix this issue, migrate the website that needs to access local resources to HTTPS. If the target resource is not served on localhost, it can set a `targetAddressSpace` fetch option to `local` or `private` to avoid mixed-content issues. The user permission should be obtained to allow this request.

Ensure that response to the [preflight request](issueCorsPreflightRequest) for the private network resource has the `Private-Network-Access-Id` and `Private-Network-Access-Name` header properly set. `Private-Network-Access-Id` should be the device's MAC address and `Private-Network-Access-Name` should be a human-friendly device name.

Administrators can make use of the `InsecurePrivateNetworkRequestsAllowed` and `InsecurePrivateNetworkRequestsAllowedForUrls` enterprise policies to temporarily disable this restriction on all or certain websites.
