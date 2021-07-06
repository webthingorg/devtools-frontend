#!/bin/sh
rm -rf $HOME/tmp/* $HOME/tmp/.?*
tools/mb/mb.py gen -m bar -b 'foo' --config-file=infra/mb/mb_config.pyl --isolate-map-file=infra/mb/gn_isolate_map.pyl --swarming-targets-file=targets //out/Release
echo '__________________________'
ninja -C out/Release -j80 test/e2e:e2e test:test
echo '__________________________'
isolate remap -i out/Release/unittests.isolate -outdir=$HOME/tmp -verbose
cd $HOME/tmp
echo '__________________________'
python scripts/test/run_unittests.py --target=Release --expanded-reporting
cd -