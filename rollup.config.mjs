import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/ecomax810p-diagram-card.ts",
  output: {
    file: "ecomax810p-diagram-card.js",
    format: "es"
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: "./tsconfig.build.json" }),
    terser({
      format: { comments: false }
    })
  ]
};


