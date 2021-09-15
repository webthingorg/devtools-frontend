#!/bin/sh
isolated_folder="$HOME/tmp$1"

rm -rf $isolated_folder/* $isolated_folder/.?*
rm unittests.*
tools/mb/mb.py gen -m bar -b 'foo' --config-file=infra/mb/mb_config.pyl --isolate-map-file=infra/mb/gn_isolate_map.pyl --swarming-targets-file=targets //out/Release
echo '__________________________'

ninja -C out/Release -j80 test/e2e:e2e test:test
echo '__________________________'


isolate remap -i out/Release/unittests.isolate -outdir=$isolated_folder
#isolate batcharchive --dump-json out.json -cas-instance projects/chromium-swarm/instances/default_instance -quiet out/Release/unittests.isolated.gen.json 

#cashash=`jq -r .unittests out.json`
#echo $cashash
#cas download -cas-instance projects/chromium-swarm/instances/default_instance -dir $isolated_folder -digest $cashash


echo '__________________________'

cd $isolated_folder
python scripts/test/run_unittests.py --target=Release --expanded-reporting
cd -