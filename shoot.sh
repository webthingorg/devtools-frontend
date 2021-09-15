#!/bin/sh
tools/mb/mb.py gen -m bar -b 'foo' --config-file=infra/mb/mb_config.pyl --isolate-map-file=infra/mb/gn_isolate_map.pyl --swarming-targets-file=targets //out/Release
