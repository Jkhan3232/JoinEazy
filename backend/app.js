const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./src/config/env");
const logger = require("./src/config/logger");
const routes = require("./src/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(helmet());
app.use(express.json());
app.use(
  morgan(
    (tokens, req, res) =>
      JSON.stringify({
        method: tokens.method(req, res),
        path: tokens.url(req, res),
        statusCode: Number(tokens.status(req, res)),
        durationMs: Number(tokens["response-time"](req, res)),
      }),
    {
      stream: {
        write: (message) => logger.info("HTTP request", JSON.parse(message)),
      },
    },
  ),
);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/v1", routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
