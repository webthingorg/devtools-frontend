import {storybookPlugin} from '@web/dev-server-storybook';
import {esbuildPlugin} from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  // type can be 'web-components' or 'preact'
  plugins: [
    esbuildPlugin({ ts: true, target: "esnext" }),
    storybookPlugin({ type: "web-components" }),
  ],
};
