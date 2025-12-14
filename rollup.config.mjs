import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/ecomax810p-diagram-card.ts",
  output: {
    file: "dist/ecomax810p-diagram-card.js",
    format: "es"
  },
  plugins: [
    resolve(),
    terser({
      format: { comments: false }
    })
  ]
};


