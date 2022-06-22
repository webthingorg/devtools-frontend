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
        "skip_chromium_deps": False,
        "skip_untrusted_origins": True,
        "disable_bot_commit": False,
        "builders": [
            {
                "name": "Auto-roll - trusted-versions highly-privileged",
                "subject": "Update DevTools DEPS (trusted-versions)",
                "excludes": excluded_deps,
            },
        ],
    },

    # Trusted origins (manually defined in the 'includes' section)
    # ...the origin project is BCID L3 compliant, and therefore all code is (and
    #    all new versions are) trusted.
    {
        "skip_chromium_deps": True,
        "skip_untrusted_origins": False,
        "disable_bot_commit": False,
        "builders": [
            # Not used yet. Intentionally left empty.
        ],
    },

    # Untrusted - rolled dependencies are reviewed by a human
    {
        "skip_chromium_deps": True,
        "skip_untrusted_origins": False,
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
