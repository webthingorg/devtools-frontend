# Copyright 2020 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

# This makefile is used to (re-)generate the input wasm modules for the e2e tests.
# Known to work with clang 11 ToT

CXX=clang

INPUTS=$(wildcard *.c)

all: $(INPUTS:.c=.wasm)

%.wasm: %.c Makefile
	$(CXX) -gfull -O0 --target=wasm32 -nostdlib -fdebug-prefix-map=`pwd`=. \
	  -Wl,--no-entry,--allow-undefined,--export=Main -o $@ $(filter %.c,$^)
