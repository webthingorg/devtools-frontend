# Trusted Type policy should be enabled in the HTTP Response header

Your site tries to use a Trusted Type policy that has not been enabled in the HTTP Response header.

To solve this, make sure that all the policies listed below are declared in the `trusted-types` directive. To allow redefining policies add the `allow-duplicates` directive. If you would like to be allowed to define any policy remove the `trusted-types` directive.

