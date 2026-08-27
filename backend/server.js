const app = require("./app");
const { env } = require("./src/config/env");
const prisma = require("./src/config/prisma");
const logger = require("./src/config/logger");

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connected");
  } catch (error) {
    logger.error("Database connection failed", { error });
  }
}

app.listen(env.port, async () => {
  logger.info("Backend server listening", {
    port: env.port,
    environment: env.nodeEnv,
  });
  await checkDatabaseConnection();
});
