# Trusted Type policy creation blocked by Content Security Policy

Your site tries to create a Trusted Type policy that has not been allowed in the Content Security Policy. The Content Security Policy may restrict the set of valid names for Trusted Type policies, and forbid more than one policy of each name.

To solve this, make sure that the names of the policies listed below are declared in the `trusted-types` CSP directive. To allow redefining policies add the `allow-duplicates` keyword. If you would like to be allowed to define any policy, remove the `trusted-types` directive.
