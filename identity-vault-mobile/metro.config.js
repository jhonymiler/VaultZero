const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configurar porta padrão para 8081
config.server = {
    ...config.server,
    port: 8081,
};

// Configurar polyfills para crypto e Node.js modules
config.resolver = {
    ...config.resolver,
    alias: {
        'crypto': 'crypto-browserify',
        'buffer': 'buffer',
        'stream': 'stream-browserify',
        'readable-stream': 'readable-stream',
        'path': 'path-browserify',
        'fs': false,
        'net': false,
        'tls': false,
        'http': false,
        'https': false,
        'url': false,
        'assert': false,
        'util': false,
        'os': false,
    },
    // Resolver explicitamente módulos problemáticos
    fallback: {
        'crypto': 'crypto-browserify',
        'stream': 'stream-browserify',
        'buffer': 'buffer',
        'path': 'path-browserify',
    }
};

module.exports = config;
