#!/usr/bin/env python3
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import os
import shutil
import subprocess
import sys


def stage1(source_dir, OPTIONS):
    sys.stdout.write('Building Stage 1.\n')
    binary_dir = os.path.abspath(
        os.path.join(OPTIONS.build_dir, 'SymbolServer.stage1'))
    if not os.path.exists(binary_dir):
        os.makedirs(binary_dir)

    goma_args = []
    if OPTIONS.goma:
        goma_args.extend(
            ('-DCMAKE_CXX_COMPILER_LAUNCHER={}'.format(OPTIONS.goma),
             '-DCMAKE_C_COMPILER_LAUNCHER={}'.format(OPTIONS.goma)))
    if OPTIONS.cc:
        goma_args.append('-DCMAKE_C_COMPILER={}'.format(OPTIONS.cc))
    if OPTIONS.cxx:
        goma_args.append('-DCMAKE_CXX_COMPILER={}'.format(OPTIONS.cxx))
    subprocess.check_call([
        'cmake', source_dir, '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON', '-GNinja',
        *goma_args
    ],
                          cwd=binary_dir)
    if OPTIONS.check:
        subprocess.check_call(['autoninja', 'check-symbol-server'],
                              cwd=binary_dir)
    else:
        subprocess.check_call(['autoninja'], cwd=binary_dir)
    return binary_dir


def stage2(source_dir, stage1_dir, OPTIONS):
    sys.stdout.write('Building Stage 2.\n')
    llvm_tools_dir = os.path.join(stage1_dir, 'third_party', 'llvm', 'llvm',
                                  'bin')
    emcc = shutil.which('em++')
    if not emcc:
        raise RuntimeError('em++ not found')
    binary_dir = os.path.abspath(
        os.path.join(OPTIONS.build_dir, 'SymbolServer.stage2'))
    if not os.path.exists(binary_dir):
        os.makedirs(binary_dir)

    subprocess.check_call([
        'cmake', source_dir, '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON', '-GNinja',
        '-DCMAKE_BUILD_TYPE=Release', '-DCMAKE_TOOLCHAIN_FILE={}'.format(
            os.path.join(os.path.dirname(emcc), 'cmake', 'Modules', 'Platform',
                         'Emscripten.cmake')), '-DHAVE_POSIX_REGEX=0',
        '-DLLVM_TABLEGEN={}'.format(os.path.join(
            llvm_tools_dir, 'llvm-tblgen')), '-DCLANG_TABLEGEN={}'.format(
                os.path.join(llvm_tools_dir,
                             'clang-tblgen')), '-DLLDB_TABLEGEN={}'.format(
                                 os.path.join(llvm_tools_dir, 'lldb-tblgen'))
    ],
                          cwd=binary_dir)
    subprocess.check_call(['autoninja'], cwd=binary_dir)
    return binary_dir


def script_main(args):
    parser = argparse.ArgumentParser()
    parser.add_argument('-goma')
    parser.add_argument('-cc')
    parser.add_argument('-cxx')
    parser.add_argument('-check', action='store_true')
    parser.add_argument('build_dir')
    OPTIONS = parser.parse_args(args)
    print(OPTIONS)

    source_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    stage1_dir = stage1(source_dir, OPTIONS)
    stage2(source_dir, stage1_dir, OPTIONS)


if __name__ == '__main__':
    script_main(sys.argv[1:])
