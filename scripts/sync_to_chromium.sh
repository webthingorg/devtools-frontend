#!/bin/bash
# -g: preserve group
# -h: output numbers in a human-readable format
# -p: preserve permissions
# -r: recurse into directories
# -t: preserve modification times
# -W: copy files whole (w/o delta-xfer algorithm)
# -v: verbose
# -l: copy symlinks

if [ -z "$2" ]
  then
    echo "Usage: sync_to_chromium.sh <path/to/devtools-frontend/> <path/to/chromium/src>"
    exit
fi

rsync -ghprtWvl \
  --exclude /v8 --exclude /.git --exclude-from $1/.gitignore \
  $1 $2/third_party/devtools-frontend/src
