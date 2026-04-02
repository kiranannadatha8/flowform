import { resolve } from "node:path";

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import { demoFormDefinition } from "../src/lib/formflow/defaults";
import { formDefinitionSchema } from "../src/lib/formflow/schema";

// `npm run db:seed` runs tsx directly — no Prisma CLI, so load env like prisma.config.ts
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.form.findUnique({ where: { slug: "demo-contact" } });
  if (existing) {
    return;
  }

  const row = await prisma.form.create({
    data: {
      slug: "demo-contact",
      title: demoFormDefinition.title,
      status: "PUBLISHED",
      definition: { _placeholder: true } as object,
    },
  });

  const def = {
    ...demoFormDefinition,
    id: row.id,
  };
  formDefinitionSchema.parse(def);
  await prisma.form.update({
    where: { id: row.id },
    data: { definition: def as object },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
