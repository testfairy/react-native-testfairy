const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// The example consumes @saucelabs/mobile-beta-react-native from the repository
// root via a file: dependency (a symlink in node_modules). Metro 0.76 does not
// follow symlinks, so the root is added as a watch folder and module
// resolution is redirected explicitly:
//  - the package name resolves to the repository root (real path), and
//  - everything else (react, react-native, ...) resolves to the example's own
//    node_modules so only one copy of each dependency is ever bundled.
//
// Note: the `util` dependency in package.json is a resolution shim, not app
// code. @backtrace/sdk-core has an optional `require('util')` (Node builtin,
// guarded by try/catch), and when Metro 0.76 cannot resolve an optional
// dependency it drops the entry from the module's dependency map WITHOUT
// preserving the positions of later entries — the babel class-transform
// helpers after it shift onto the wrong modules and the module crashes at
// load ("Requiring unknown module undefined"). Installing the `util`
// polyfill makes the dependency resolvable so the map stays aligned.
const repositoryRoot = path.resolve(__dirname, '..');

/**
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [repositoryRoot],
  resolver: {
    // Keep Metro out of trees that must never be crawled or watched: the
    // repository root's own dev node_modules (jest/eslint/typescript — all
    // bare imports are redirected to the example's node_modules below) and
    // the local native binaries.
    blockList: [
      new RegExp(`${repositoryRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/node_modules/.*`),
      new RegExp(`${repositoryRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/local-native/.*`),
    ],
    extraNodeModules: new Proxy(
      {'@saucelabs/mobile-beta-react-native': repositoryRoot},
      {
        get(target, name) {
          const key = String(name);

          if (key in target) {
            return target[key];
          }

          return path.join(__dirname, 'node_modules', key);
        },
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
