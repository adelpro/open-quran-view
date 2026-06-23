const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so changes in src/ (e.g. the .rn.ts
// modules, the per-page TTF directory listings) are picked up.
config.watchFolders = [workspaceRoot];

// Map the bare-specifier `open-quran-view` to the workspace root.
// The package.json `link:../..` symlink handles normal imports, but
// this extraNodeModules entry ensures Metro can resolve subpath
// imports like `open-quran-view/view/rn` through the workspace tree.
config.resolver.extraNodeModules = {
  "open-quran-view": path.resolve(workspaceRoot),
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// `.rn.ts` / `.rn.tsx` are the platform-agnostic source files that
// are externalized in tsup but consumed raw by Metro here.
config.resolver.sourceExts = ["rn.ts", "rn.tsx", "ts", "tsx", "js", "jsx", "json"];

module.exports = config;