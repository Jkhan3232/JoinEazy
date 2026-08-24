const app = require("./app");
const { env } = require("./src/config/env");
const prisma = require("./src/config/prisma");

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

app.listen(env.port, async () => {
  console.log(`Backend server listening on port ${env.port}`);
  await checkDatabaseConnection();
});
