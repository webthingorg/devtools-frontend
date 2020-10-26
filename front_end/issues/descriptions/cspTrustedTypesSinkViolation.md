# Trusted Type expected, but String received

Your site tries to assign a plain string to an element that expects a Trusted Type.  Requiring Trusted Types for DOM modifications helps to prevent cross-site scripting attacks.

To solve this, make sure that all assignments listed below contain a Trusted Type. You can convert a string into a Trusted Type by:

* defining a policy and using its corresponding `createHTML`, `createScript`, `createScriptURL` function.
* defining a policy named `default` which will be automatically called.