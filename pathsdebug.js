// Load environment variables before anything else
require("dotenv").config();

const tsconfig = require("./tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");

const baseUrl = "./src";
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: tsconfig.compilerOptions.paths,
});
