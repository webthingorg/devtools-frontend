add_executable(DWARFSymbolsPlugin
  Interface.cc
  )

target_link_libraries(DWARFSymbolsPlugin DWARFSymbols)
target_include_directories(DWARFSymbolsPlugin PUBLIC
  ${PROJECT_SOURCE_DIR}/third_party/emscripten/system/include)
set(EM_OPTIONS -s ASSERTIONS=1   --bind -g0 )
target_compile_options(DWARFSymbolsPlugin PRIVATE ${EM_OPTIONS})
target_link_libraries(DWARFSymbolsPlugin "-s EXPORT_ALL=1")
target_link_libraries(DWARFSymbolsPlugin "-s ASSERTIONS=1")
target_link_libraries(DWARFSymbolsPlugin "--bind")
#target_link_libraries(DWARFSymbolsPlugin "-DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES")
target_link_libraries(DWARFSymbolsPlugin "-g2")
target_link_libraries(DWARFSymbolsPlugin "-s ERROR_ON_UNDEFINED_SYMBOLS=0")
