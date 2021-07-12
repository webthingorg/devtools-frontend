# Mark SameParty cookies as Secure and do not use SameParty in conjunction with SameSite=Strict

Cookies marked with `SameParty` must also be marked with `Secure`. In addition, cookies marked
with `SameParty` can not use `SameSite=Strict` simultanously.

Resolve this issue by updating the attributes of the cookie:
  * Remove `SameParty` if the cookie should only be used by the same site but not the same first party set
  * Remove `SameSite=Strict` or specify `Secure` if the cookie should be available to all sites of the same first party set
