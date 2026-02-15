import { defineAction, definePlugin, runPluginProcess } from '@autokestra/plugin-sdk';

const runAction = defineAction<{ name?: string }, { message: string; plugin: string }>({
  description: 'Return a hello-world message',
  async execute(input, context) {
    const rawName = typeof input?.name === 'string' ? input.name.trim() : '';
    const target = rawName.length > 0 ? rawName : 'world';
    const message = `Hello, ${target}!`;
    context.log.info(message);
    return {
      message,
      plugin: 'demo/hello-world',
    };
  },
});

const plugin = definePlugin({
  metadata: {
    namespace: 'demo',
    name: 'hello-world',
    version: '0.1.0',
    description: 'Simple hello world plugin example for CLI install tests',
    runtime: {
      entrypoint: 'dist/index.js',
    },
  },
  actions: {
    run: runAction,
  },
});

if (import.meta.main) {
  runPluginProcess(plugin).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
