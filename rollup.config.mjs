import { readFileSync } from "node:fs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));

export default {
  input: "src/ecomax810p-diagram-card.ts",
  output: {
    file: "ecomax810p-diagram-card.js",
    format: "es"
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: "./tsconfig.build.json" }),
    replace({
      preventAssignment: true,
      values: { __CARD_VERSION__: JSON.stringify(pkg.version) }
    }),
    terser({
      format: { comments: false }
    })
  ]
};


