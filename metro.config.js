const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  blockList: [
    ...(Array.isArray(config.resolver?.blockList) ? config.resolver.blockList : config.resolver?.blockList ? [config.resolver.blockList] : []),
    /\.local\/state\/workflow-logs\/.*/,
  ],
};

module.exports = config;
