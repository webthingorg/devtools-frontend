llvm_create_cross_target(DWARFSymbolsPlugin NATIVE ${CMAKE_SYSTEM_NAME} ${CMAKE_BUILD_TYPE})
add_executable(DWARFSymbolsPlugin
  Interface.cc
  )

target_link_libraries(DWARFSymbolsPlugin PUBLIC DWARFSymbols)
target_include_directories(DWARFSymbolsPlugin PUBLIC
  ${PROJECT_SOURCE_DIR}/third_party/emscripten/system/include)
set(EM_OPTIONS -s EXPORT_ALL=1 --bind)
target_compile_options(DWARFSymbolsPlugin PRIVATE ${EM_OPTIONS})
target_link_options(DWARFSymbolsPlugin PRIVATE ${EM_OPTIONS})
