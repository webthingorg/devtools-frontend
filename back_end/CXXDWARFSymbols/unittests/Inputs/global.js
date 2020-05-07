const importObj = {
  env: {
    memory: new WebAssembly.Memory({initial: 1, maximum: 1}),
    __memory_base: 1024,
    table: new WebAssembly.Table({
      initial: 2,
      maximum: 2,
      element: 'anyfunc',
    }),
    printf: function(s) {
      console.log(s);
    },
    printfI: function(s) {
      console.log(s);
    }
  }
};

const modulename = 'global.wasm';

WebAssembly.instantiateStreaming(fetch('http://localhost:8001/' + modulename), importObj)
    .then(m => console.log(JSON.stringify(m)));
