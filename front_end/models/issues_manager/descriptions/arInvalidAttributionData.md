# Ensure the "data" query parameter for an attribution redirect is a valid number

The data associated with an attribution was defaulted to `0` because the provided `data`
query parameter in the `.well-known` redirect was not a valid number.

Note that even if a number is provided, only the lowest 3-bits of the `data` query parameter
are recorded with a 5% chance of the 3-bits being noised.
