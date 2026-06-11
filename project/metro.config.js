const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .wasm to asset extensions for WebAssembly support
config.resolver.assetExts.push('wasm');

// Add .wasm to source extensions as well
config.resolver.sourceExts.push('wasm');

// Add custom resolver to handle wa-sqlite WASM file path
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle the specific case where expo-sqlite is looking for wa-sqlite.wasm
  if (moduleName === './wa-sqlite/wa-sqlite.wasm' && 
      context.originModulePath.includes('expo-sqlite/web/worker.ts')) {
    return {
      filePath: require.resolve('wa-sqlite/dist/wa-sqlite.wasm'),
      type: 'sourceFile',
    };
  }
  
  // Fall back to the default resolver for all other cases
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;