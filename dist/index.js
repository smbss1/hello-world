// @bun
// node_modules/@autokestra/plugin-sdk/dist/index.js
var store$4;
function getGlobalConfig(config$1) {
  return {
    lang: config$1?.lang ?? store$4?.lang,
    message: config$1?.message,
    abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
    abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
  };
}
function safeParse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}
function defineAction(handler) {
  return handler;
}
function definePlugin(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("Invalid plugin definition: expected object");
  }
  const { metadata, actions } = definition;
  if (!metadata?.name || !metadata?.version || !metadata?.namespace) {
    throw new Error("Invalid plugin definition: metadata.name, metadata.version, and metadata.namespace are required");
  }
  if (!actions || typeof actions !== "object" || Object.keys(actions).length === 0) {
    throw new Error("Invalid plugin definition: at least one action is required");
  }
  return definition;
}
async function runPluginProcess(plugin, options) {
  const io = options?.io ?? {
    readStdin: () => Bun.stdin.text(),
    writeStdout: (value) => process.stdout.write(value),
    writeStderr: (value) => process.stderr.write(value)
  };
  const request = parsePluginProcessRequest(await io.readStdin());
  const action = plugin.actions[request.action];
  if (!action) {
    throw new Error(`Unsupported action: ${request.action}`);
  }
  const context = options?.contextFactory?.(request.action) ?? {
    log: createProcessLogger(`[${plugin.metadata.namespace}/${plugin.metadata.name}.${request.action}]`, io.writeStderr)
  };
  const parsedInput = parseActionInput(request.action, action, request.input);
  const result = await action.execute(parsedInput, context);
  io.writeStdout(JSON.stringify(result));
}
function parseActionInput(actionName, action, input) {
  if (!action.inputSchema) {
    return input;
  }
  const parsed = safeParse(action.inputSchema, input);
  if (parsed.success) {
    return parsed.output;
  }
  const firstIssue = parsed.issues[0];
  const issuePath = toPathString(firstIssue?.path);
  const message = firstIssue?.message ?? "Unknown validation error";
  throw new Error(`Invalid input for action '${actionName}'${issuePath ? ` at ${issuePath}` : ""}: ${message}`);
}
function toPathString(path) {
  if (!path || path.length === 0)
    return "";
  let result = "";
  for (const segment of path) {
    const key = segment?.key;
    if (typeof key === "number") {
      result += `[${key}]`;
    } else if (typeof key === "string") {
      result += result ? `.${key}` : key;
    }
  }
  return result;
}
function parsePluginProcessRequest(raw) {
  if (!raw || !raw.trim()) {
    throw new Error("Invalid request: expected JSON payload on stdin");
  }
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || typeof parsed.action !== "string" || parsed.action.trim().length === 0) {
    throw new Error("Invalid request: expected { action: string, input: unknown }");
  }
  return {
    action: parsed.action,
    input: parsed.input
  };
}
function createProcessLogger(prefix, writeStderr = (value) => process.stderr.write(value)) {
  const emit = (level, message, args) => {
    const payload = {
      timestamp: Date.now(),
      level,
      message: `${prefix} ${formatLog(message, args)}`
    };
    writeStderr(`${JSON.stringify(payload)}
`);
  };
  return {
    info: (message, ...args) => emit("INFO", message, args),
    warn: (message, ...args) => emit("WARN", message, args),
    error: (message, ...args) => emit("ERROR", message, args),
    debug: (message, ...args) => emit("DEBUG", message, args)
  };
}
function formatLog(message, args) {
  if (!args?.length)
    return message;
  const extra = args.map((arg) => {
    if (typeof arg === "string")
      return arg;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(" ");
  return `${message} ${extra}`;
}

// index.ts
var runAction = defineAction({
  description: "Return a hello-world message",
  async execute(input, context) {
    const rawName = typeof input?.name === "string" ? input.name.trim() : "";
    const target = rawName.length > 0 ? rawName : "world";
    const message = `Hello, ${target}!`;
    context.log.info(message);
    return {
      message,
      plugin: "demo/hello-world"
    };
  }
});
var plugin = definePlugin({
  metadata: {
    namespace: "demo",
    name: "hello-world",
    version: "0.1.0",
    description: "Simple hello world plugin example for CLI install tests",
    runtime: {
      entrypoint: "dist/index.js"
    }
  },
  actions: {
    run: runAction
  }
});
if (import.meta.main) {
  runPluginProcess(plugin).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}
`);
    process.exit(1);
  });
}
