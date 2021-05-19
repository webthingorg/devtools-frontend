#!/usr/bin/env vpython
# -*- coding: UTF-8 -*-
#
# Copyright 2021 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Compresses a single input file and outputs the compressed version
to filename + '.compressed' and the hash of the input file has to filename + '.hash'.
"""

import sys
import subprocess
import shlex
import struct
from os import path
from devtools_file_hashes import calculate_file_hash
from modular_build import read_file, write_file

BROTLI_CONST = b'\x1e\x9b'


def brotli_file(src, dst):
    f_in = open(src, 'rb')
    src_data = f_in.read()
    f_in.close()

    brotli = subprocess.Popen(["brotli", "-", "-f"],
                              stdin=subprocess.PIPE,
                              stdout=subprocess.PIPE)
    data = brotli.communicate(src_data)[0]

    # The length of the uncompressed data as 8 bytes little-endian.
    size_bytes = struct.pack("<q", len(src_data))
    # BROTLI_CONST is prepended to brotli decompressed data in order to
    # easily check if a resource has been brotli compressed.
    # The length of the uncompressed data is also appended to the start,
    # truncated to 6 bytes, little-endian. size_bytes is 8 bytes,
    # need to truncate further to 6.
    formatter = b'%ds %dx %ds' % (6, 2, len(size_bytes) - 8)
    content = (BROTLI_CONST + b''.join(struct.unpack(formatter, size_bytes)) +
               data)

    with open(dst, 'wb+') as file:
        file.write(content)


def read_hash(input_file_name):
    hash_file_name = input_file_name + ".hash"
    if not path.exists(hash_file_name):
        return ''
    return str(read_file(hash_file_name))


def compress_file(input_file_name):
    curr_hash = str(calculate_file_hash(input_file_name))
    prev_hash = read_hash(input_file_name)

    if prev_hash != curr_hash:
        brotli_file(input_file_name, input_file_name + ".compressed")
        write_file(input_file_name + ".hash", str(curr_hash))


def main(argv):
    file_list_position = argv.index('--file_list')
    file_list = argv[file_list_position + 1]
    file_list_file = open(file_list, 'r')
    file_list_contents = file_list_file.read()
    for filename in shlex.split(file_list_contents):
        compress_file(filename)


if __name__ == '__main__':
    sys.exit(main(sys.argv))
