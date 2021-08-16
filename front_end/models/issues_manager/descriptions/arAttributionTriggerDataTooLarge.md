# Ensure the "trigger-data" query parameter for an attribution redirect only uses 3-bit

The data associated with an attribution was truncated to the lowest 3-bits.
Note that even if a valid integer in the 3-bit range is provided, there is still a 5%
chance that the value will be noised.
