import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createRootLogger } from "./config/logger.js";

const env = loadEnv();
const logger = createRootLogger(env);
const app = createApp(env);

const port = env.PORT;
app.listen(port, () => {
  logger.info({ port, request_id: "boot", tenant_id: "pre_auth" }, "backend listening");
});
