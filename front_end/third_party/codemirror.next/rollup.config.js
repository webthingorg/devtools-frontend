import {nodeResolve} from "@rollup/plugin-node-resolve"
import dts from "rollup-plugin-dts"
import {terser} from "rollup-plugin-terser"

export default [{
  input: "./bundle.js",
  output: {
    format: "es",
    file: "./codemirror.next.js",
    externalLiveBindings: false
  },
  plugins: [
    nodeResolve(),
    terser()
  ]
}, {
  input: "./bundle.d.ts",
  output: {
    file: "./codemirror.next.d.ts",
    format: "es"
  },
  plugins: [
    dts({respectExternal: true}),
    {
      name: "delete-trailing-whitespace",
      generateBundle(options, bundle) {
        for (let file of Object.values(bundle)) {
          if (file.code) file.code = file.code.replace(/[ \t]+(\n|$)/g, "$1")
        }
      }
    }
  ]
}]
