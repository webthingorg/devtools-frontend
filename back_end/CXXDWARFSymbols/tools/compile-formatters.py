#!/usr/bin/env python3
# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import argparse
import os
import subprocess
import sys


def ParseArgs(Argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('clang')
    parser.add_argument('arguments', nargs='*')
    return parser.parse_args(Argv)


def ParseIncludes(Clang):
    ClangProc = subprocess.Popen([Clang, '-v', '-S', '-x', 'c++', '-', '-emit-llvm', '-o', '-'],
                                 stdin=subprocess.PIPE,
                                 stdout=subprocess.DEVNULL,
                                 stderr=subprocess.PIPE)
    _, StdErr = ClangProc.communicate(input='')
    Lines = StdErr.decode().split('\n')
    Begin = min(Lines.index('#include <...> search starts here:'), Lines.index('#include "..." search starts here:'))
    End = Lines.index('End of search list.')
    return (L.strip() for L in Lines[Begin:End] if not L.startswith('#include'))


def Compile(Clang, CompileArgs, IncludePaths):
    IncludeArgs = ('-I{0}'.format(I) for I in IncludePaths)
    CommandLine = [Clang, *IncludeArgs, *CompileArgs]
    sys.stdout.write("Compiling {0}\n".format(' '.join(CommandLine)))
    subprocess.check_call(CommandLine)


def CompileMain(Argv):
    options = ParseArgs(Argv)
    IncludePaths = filter(os.path.exists, ParseIncludes(options.clang))
    Compile(options.clang, options.arguments, IncludePaths)


if __name__ == '__main__':
    CompileMain(sys.argv[1:])

# vim: set sw=2:ts=2:softtab=2:expandtab
