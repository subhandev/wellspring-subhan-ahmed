import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
const app = express();

app.use(pinoHttp({ logger }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  logger.info({ port }, "backend listening");
});
