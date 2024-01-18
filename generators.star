# Copyright 2024 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

SOM_BUILDERS = [
    "DevTools Linux",
    "DevTools Linux Fastbuild",
    "Stand-alone Linux",
    "Stand-alone Win",
    "Linux Compile Debug",
    "Linux Compile Debug Fastbuild",
    "Linux Compile Full Release",
    #"Stand-alone Mac",
    "Stand-alone Mac-arm64",
    "Linux Official",
]

def add_builders_to_som(ctx):
    """
    This callback adds the necessary properties to the builders than need to be
    registered with Seriff-0-Matic.
    """
    build_bucket = ctx.output["cr-buildbucket.cfg"]
    for bucket in build_bucket.buckets:
        if bucket.name == "ci":
            for builder in bucket.swarming.builders:
                if builder.name in SOM_BUILDERS:
                    properties = json.decode(builder.properties)
                    properties["sheriff_rotations"] = ["devtools_frontend"]
                    builder.properties = json.encode(properties)

lucicfg.generator(add_builders_to_som)
