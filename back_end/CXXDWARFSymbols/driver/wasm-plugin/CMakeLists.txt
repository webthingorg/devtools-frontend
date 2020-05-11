add_executable(DWARFSymbolsPlugin
  Interface.cc
  )

target_link_libraries(DWARFSymbolsPlugin PUBLIC DWARFSymbols)
target_include_directories(DWARFSymbolsPlugin PUBLIC
  ${PROJECT_SOURCE_DIR}/third_party/emscripten/system/include)
set(EM_OPTIONS -s ASSERTIONS=1   --bind -g0 )
target_compile_options(DWARFSymbolsPlugin PRIVATE ${EM_OPTIONS})
target_link_libraries(DWARFSymbolsPlugin PRIVATE "-s EXPORT_ALL=1")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "-s ASSERTIONS=1")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "--bind")
target_link_libraries(DWARFSymbolsPlugin PRIVATE
  "-s ERROR_ON_UNDEFINED_SYMBOLS=0")
target_link_libraries(DWARFSymbolsPlugin PRIVATE "-s SINGLE_FILE=1")
