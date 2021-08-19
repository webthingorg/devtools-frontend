import {nodeResolve} from "@rollup/plugin-node-resolve"
import dts from "rollup-plugin-dts"
import {terser} from "rollup-plugin-terser"

export default [{
  input: "./bundle.js",
  output: {
    format: "es",
    file: "./codemirror.js",
    externalLiveBindings: false
  },
  plugins: [
    nodeResolve(),
    terser()
  ]
}, {
  input: "./bundle.d.ts",
  output: {
    file: "./codemirror.d.ts",
    format: "es"
  },
  plugins: [
    dts({respectExternal: true})
  ]
}]
