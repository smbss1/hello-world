# Hello World Plugin (CLI install test)

This example plugin uses `@autokestra/plugin-sdk` from npmjs and follows the published artifact layout:

- `plugin.yaml`
- `dist/index.js`

## Build and package

From repo root:

```bash
cd examples/plugins/hello-world
bun install
bun run package
```

This creates `hello-world-0.1.0.tgz`.

## Compute checksum

```bash
sha256sum hello-world-0.1.0.tgz
```

Convert to expected format:

- `sha256:<hex>`

## Install with CLI (direct URL source)

```bash
workflow plugin install "url:file://$PWD/hello-world-0.1.0.tgz" \
  --checksum "sha256:<hex>" \
  --server http://127.0.0.1:7233 \
  --api-key <your-api-key>
```

Then verify:

```bash
workflow plugin list --server http://127.0.0.1:7233 --api-key <your-api-key>
```
