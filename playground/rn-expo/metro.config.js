const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Configure Metro to resolve modules in the monorepo correctly
config.watchFolders = [workspaceRoot];

// Add the workspace root and project root to the module resolution paths
config.resolver.extraNodeModules = {
    "open-quran-view": path.resolve(workspaceRoot),
};

// Enable resolving from the workspace root
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
];

// Platform-specific module resolution for .rn.ts and .rn.tsx files
config.resolver.sourceExts = ["rn.ts", "rn.tsx", "ts", "tsx", "js", "jsx", "json"];

module.exports = config;