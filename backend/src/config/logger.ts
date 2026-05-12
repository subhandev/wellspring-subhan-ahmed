import pino from "pino";
import type { Env } from "./env.js";

export function createRootLogger(env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">) {
  return pino({
    level: env.LOG_LEVEL,
    base: undefined,
    formatters: {
      level(label) {
        return { level: label };
      }
    }
  });
}
