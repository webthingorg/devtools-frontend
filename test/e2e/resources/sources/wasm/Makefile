WASMC_FLAGS=--target=wasm32 -Wl,--no-entry,--allow-undefined,--export-all -nostdlib
WASMC_DBGFLAGS=-gfull -fdebug-prefix-map=`pwd`=test/e2e/resources/sources/wasm/
CLANG=../../../../../third_party/emscripten-releases/install/bin/clang
CLANGXX=../../../../../third_party/emscripten-releases/install/bin/clang++

%.wasm: %.cc Makefile
	${CLANGXX} ${WASMC_FLAGS} $(filter %.cc,$^) -o $@

%_with_dwarf.wasm: %_with_dwarf.ll Makefile
	${CLANG} ${WASMC_DBGFLAGS} ${WASMC_FLAGS} $(filter %.ll,$^) -o $@

%_with_dwarf.wasm: %_with_dwarf.c Makefile
	${CLANG} ${WASMC_DBGFLAGS} ${WASMC_FLAGS} $(filter %.c,$^) -o $@

%.wasm: %.c Makefile
	${CLANG} ${WASMC_FLAGS} $(filter %.c,$^) -o $@

%.wasm: %.ll Makefile
	${CLANG} ${WASMC_FLAGS} $(filter %.ll,$^) -o $@

wasm-with-sourcemap.wasm: with-sourcemap.ll Makefile
	${CLANG} ${WASM_CFLAGS} $(filter %.ll,$^) -o $@
