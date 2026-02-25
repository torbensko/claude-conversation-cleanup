import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Claude Conversations',
    executableName: 'claude-conversations',
    asar: false,
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin', 'win32', 'linux']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'electron/main.ts',
          config: 'vite.main.config.mjs',
        },
        {
          entry: 'electron/preload.ts',
          config: 'vite.preload.config.mjs',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
  ],
};

export default config;
