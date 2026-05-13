import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createRootLogger } from "./config/logger.js";

const env = loadEnv();
const logger = createRootLogger(env);
const app = createApp(env);

const port = env.PORT;
/** Bind all interfaces so container healthchecks (Railway, Docker) can reach the server. */
const listenHost = "0.0.0.0";
const server = app.listen(port, listenHost, () => {
  logger.info(
    { port, host: listenHost, request_id: "boot", tenant_id: "pre_auth" },
    "backend listening"
  );
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.fatal(
      { port, request_id: "boot", tenant_id: "pre_auth", err: err.message },
      `port ${port} in use — stop the other process or set PORT=4001 and NEXT_PUBLIC_API_URL`
    );
    process.exit(1);
    return;
  }
  logger.fatal(
    { port, request_id: "boot", tenant_id: "pre_auth", err: err.message },
    "server listen error"
  );
  process.exit(1);
});
