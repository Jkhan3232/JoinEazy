const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { env } = require("./src/config/env");
const routes = require("./src/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
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
