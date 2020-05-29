set(WASM_WRAPPER ${CMAKE_CURRENT_SOURCE_DIR}/Extension/WasmWrapper.js)
set(NODE_EXPORTS ${CMAKE_CURRENT_SOURCE_DIR}/Extension/NodeExports.js)
set(EXTENSION_SOURCES
  Extension/DevToolsPlugin.html
  Extension/DevToolsPlugin.js
  Extension/manifest.json
  )

foreach(EXTENSION_SOURCE ${EXTENSION_SOURCES})
  configure_file(${EXTENSION_SOURCE} ${SYMBOL_SERVER_BINARY_DIR} COPYONLY)
endforeach(EXTENSION_SOURCE)

add_executable(DWARFSymbolsPlugin
  Interface.cc
  ${WASM_WRAPPER}
  ${NODE_EXPORTS}
  )

target_link_libraries(DWARFSymbolsPlugin PUBLIC DWARFSymbols)
target_include_directories(DWARFSymbolsPlugin PUBLIC
  ${PROJECT_SOURCE_DIR}/third_party/emscripten/system/include)
set(EM_OPTIONS -s ASSERTIONS=1 --bind)
target_compile_options(DWARFSymbolsPlugin PRIVATE ${EM_OPTIONS})
target_link_libraries(DWARFSymbolsPlugin PRIVATE "-s EXPORT_ALL=1")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "-s ASSERTIONS=1")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "--bind")
target_link_libraries(DWARFSymbolsPlugin PRIVATE
  "-s ERROR_ON_UNDEFINED_SYMBOLS=0")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "-O0 --pre-js ${WASM_WRAPPER}")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "--post-js ${NODE_EXPORTS}")

if (SYMBOL_SERVER_BUILD_FORMATTERS)
  add_dependencies(DWARFSymbolsPlugin SymbolServerRuntime)
  get_target_property(symbol_server_runtime_dir SymbolServerRuntime BINARY_DIR)
  target_link_libraries(DWARFSymbolsPlugin PRIVATE
    "--embed-file ${symbol_server_runtime_dir}/formatters.bc@/lib/formatters.bc")
endif()
