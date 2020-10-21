# Trusted Type expected in assignment

Your site tries to assign a plain string to an element that expects a Trusted Type.

To solve this, make sure that all assignments listed below contain a Trusted Type. You can convert a string into a Trusted Type by:

* defining a policy and calling the corresponding `createHTML`, `createScript`, `createScriptURL`.
* defining a policy named `default` which will be automatically called.