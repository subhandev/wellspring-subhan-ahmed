import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env"), quiet: true });

/** Ensure auth and tests have a stable JWT secret before modules load. */
process.env.JWT_SECRET ||= "test-jwt-secret-that-is-long-enough-for-hs256";
