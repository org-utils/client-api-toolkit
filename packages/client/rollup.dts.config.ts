import { dts } from "rollup-plugin-dts";
const config = (input: string, output: string) => ({
  input,

  output: {
    file: output,
    format: "es",
  },

  plugins: [
    dts({
      tsconfig: "./tsconfig.json",
      includeExternal: ["client-api-types"],
    }),
  ],
});
export default [
  config("src/index.ts", "dist/index.d.ts"),
  config("src/react/index.ts", "dist/react.d.ts"),
  config("src/server/index.ts", "dist/server.d.ts"),
];
