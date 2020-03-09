CXX=clang

INPUTS=$(wildcard *.c)

all: $(INPUTS:.c=.wasm)

%.wasm: %.c Makefile
	$(CXX) -gfull -O0 --target=wasm32 -nostdlib -fdebug-prefix-map=`pwd`=. \
	  -Wl,--no-entry,--allow-undefined,--export=Main -o $@ $(filter %.c,$^)
