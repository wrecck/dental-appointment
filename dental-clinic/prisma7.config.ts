import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon pooled URL for the app; DIRECT_URL (non-pooled) for migrations
    url: env("DATABASE_URL"),
    ...(process.env.DIRECT_URL
      ? { directUrl: process.env.DIRECT_URL }
      : {}),
  },
});
