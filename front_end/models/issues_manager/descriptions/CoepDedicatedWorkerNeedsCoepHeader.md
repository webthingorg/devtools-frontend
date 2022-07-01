# Specify a Cross-Origin Embedder Policy to prevent this DedicatedWorker from being blocked

Because your site has Cross-Origin Embedder Policy (COEP) enabled, each
DedicatedWorker must also specify this policy. This behavior protects private
data from being exposed to untrusted third party sites.

To solve this, add one of following to the embedded DedicatedWorker’s HTML
response header:
* `Cross-Origin-Embedder-Policy: require-corp`
* `Cross-Origin-Embedder-Policy: credentialless` (Chrome > 96)
