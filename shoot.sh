#!/bin/sh
rm -rf /home/machenbach/tmp/.* /home/machenbach/tmp/*
tools/mb/mb.py gen -m bar -b 'foo' --config-file=infra/mb/mb_config.pyl --isolate-map-file=infra/mb/gn_isolate_map.pyl --swarming-targets-file=targets //out/Release
isolate remap -isolate=out/Release/unittests.isolate -outdir=/home/machenbach/tmp
cd /home/machenbach/tmp
python scripts/test/run_unittests.py --target=Release --expanded-reporting
