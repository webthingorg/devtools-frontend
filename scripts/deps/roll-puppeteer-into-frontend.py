#!/usr/bin/env python
#
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import urllib
import tarfile
import os
import re
import sys
import subprocess

scripts_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(scripts_path)

import devtools_paths

url = 'https://registry.npmjs.org/puppeteer/-/puppeteer-5.4.0.tgz'

file = urllib.urlretrieve(url, filename=None)[0]
tar = tarfile.open(file, 'r:gz')
tar.extractall(path=devtools_paths.root_path() +
               '/front_end/third_party/puppeteer')


def getStartAndEndIndexForGNVariable(content, variable):
    startIndex = None
    endIndex = None
    startPattern = re.compile(r'\s*' + variable + '\s*=\s*\[\s*')
    endPattern = re.compile(r'\s*\]\s*')
    for i, line in enumerate(content):
        if startPattern.match(line):
            startIndex = i + 1
            break

    if startIndex is None:
        raise BaseException(variable + ' not found')

    for i, line in enumerate(content[startIndex:], start=startIndex):
        if endPattern.match(line):
            endIndex = i
            break

    return startIndex, endIndex


def readGNVariable(filename, variable):
    with open(filename) as f:
        content = f.readlines()
        startIndex, endIndex = getStartAndEndIndexForGNVariable(
            content, variable)
        return [x.strip(' \t",\'\n') for x in content[startIndex:endIndex]]


def updateGNVariable(file, variable, files):
    content = None
    with open(file) as f:
        content = f.readlines()

    files.sort()
    startIndex, endIndex = getStartAndEndIndexForGNVariable(content, variable)
    newContent = content[:startIndex] + ['    "' + x + '",\n'
                                         for x in files] + content[endIndex:]

    with open(file, 'w') as f:
        f.write(''.join(newContent))


updateGNVariable('./front_end/third_party/puppeteer/BUILD.gn', 'sources', [
    'puppeteer-tsconfig.json',
] + [
    name for name in tar.getnames()
    if name.startswith('package/lib/esm/') and name.endswith('.js')
])

prev = readGNVariable('./devtools_grd_files.gni', 'grd_files_debug_sources')
tmp = [
    'front_end/third_party/puppeteer/' + name for name in tar.getnames()
    if name.startswith('package/lib/esm/') and name.endswith('.js')
] + [
    name
    for name in prev if not name.startswith('front_end/third_party/puppeteer')
]

updateGNVariable('./devtools_grd_files.gni', 'grd_files_debug_sources', tmp)

prev = readGNVariable('./all_devtools_modules.gni',
                      'all_typescript_module_sources')
tmp = [
    'third_party/puppeteer/' + name for name in tar.getnames()
    if name.startswith('package/lib/esm/') and name.endswith('.js')
] + [
    name for name in prev
    if not name.startswith('third_party/puppeteer/package/lib/esm/')
]
updateGNVariable('./all_devtools_modules.gni', 'all_typescript_module_sources',
                 tmp)

tar.close()

subprocess.check_call(['git', 'cl', 'format', '--js'],
                      cwd=devtools_paths.root_path())
