const tsconfig = require("./tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");

console.log("Executing paths.js");

const baseUrl = "./build";
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: tsconfig.compilerOptions.paths,
});

console.log("Paths registered:", tsconfig.compilerOptions.paths);
