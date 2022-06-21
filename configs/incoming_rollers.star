# Copyright 2022 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

excluded_deps = [
    "third_party/esbuild:infra/3pp/tools/esbuild/${platform}",
]

incoming_roller_definitions = [
    # Trusted versions (from chromium/src)
    # ...the rolled version is trusted by chromium/src and therefore trusted
    #    by devtools-frontend
    {
        "skip_untrusted_origins": True,
        "builders": [
            {
                "name": "Auto-roll - trusted-versions highly-privileged",
                "subject": "Update DevTools DEPS (versions are trusted)",
                "excludes": excluded_deps,
            },
        ],
    },

    # Trusted origins (manually defined in the 'includes' section)
    # ...the origin project is BCID L3 compliant, and therefore all versions
    {
        "skip_chromium_deps": True,
        "builders": [
            # Not used yet. Intentionally left empty.
        ],
    },

    # Untrusted - rolled dependencies are reviewed by a human
    {
        "skip_chromium_deps": True,
        "disable_bot_commit": True,
        "builders": [
            {
                "name": "Roll - untrusted",
                "subject": "Update DevTools DEPS (untrusted)",
                "excludes": excluded_deps,
            },
        ],
    },
]
