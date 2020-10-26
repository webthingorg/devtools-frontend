# Trusted Type policy creation blocked by Content Security Policy

Your site tries to create a Trusted Type policy that has not been allowed in the Content Security Policy.

To solve this, make sure that all the policies listed below are declared in the `trusted-types` CSP directive. To allow redefining policies add the `allow-duplicates` keyword. If you would like to be allowed to define any policy, remove the `trusted-types` directive.
