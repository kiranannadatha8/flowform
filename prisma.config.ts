import { resolve } from "node:path";

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js loads `.env.local`; Prisma CLI only auto-loads `.env`. Load both for parity.
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
