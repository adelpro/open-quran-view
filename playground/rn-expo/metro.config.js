const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so changes in src/ (e.g. the .rn.ts
// modules, the per-page TTF directory listings) are picked up.
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Map the bare-specifier `open-quran-view` to the workspace root.
// The package.json `link:../..` symlink handles normal imports, but
// this extraNodeModules entry ensures Metro can resolve subpath
// imports like `open-quran-view/view/rn` through the workspace tree.
config.resolver.extraNodeModules = {
  "open-quran-view": path.resolve(workspaceRoot),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "expo-font": path.resolve(projectRoot, "node_modules/expo-font"),
};

// Block workspaceRoot/node_modules of react, react-native, and expo-font
// to prevent Metro from resolving the root packages (duplicate copies).
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");
const blockedPackages = ["react", "react-native", "expo-font"];
const blockPatterns = blockedPackages.map((pkg) => {
  const fullPath = path.join(workspaceNodeModules, pkg);
  const escaped = fullPath
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\\|\\\//g, "[\\\\/]");
  return new RegExp("^" + escaped + "($|[\\\\/].*)");
});
const existingBlockList = config.resolver.blockList;
let newBlockList;
if (Array.isArray(existingBlockList)) {
  newBlockList = [...existingBlockList, ...blockPatterns];
} else if (existingBlockList instanceof RegExp) {
  newBlockList = [existingBlockList, ...blockPatterns];
} else if (existingBlockList) {
  newBlockList = [existingBlockList, ...blockPatterns];
} else {
  newBlockList = blockPatterns;
}
config.resolver.blockList = newBlockList;

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// `.rn.ts` / `.rn.tsx` are the platform-agnostic source files that
// are externalized in tsup but consumed raw by Metro here.
config.resolver.sourceExts = [...new Set(["rn.ts", "rn.tsx", ...config.resolver.sourceExts])];

module.exports = config;