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
  config("src/middleware/express.ts", "dist/middleware/express.d.ts"),
  config("src/middleware/fastify.ts", "dist/middleware/fastify.d.ts"),
  config("src/middleware/hono.ts", "dist/middleware/hono.d.ts"),
  config("src/integrations/fastify-validation.ts", "dist/integrations/fastify-validation.d.ts"),
];
