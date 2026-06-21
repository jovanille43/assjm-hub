// Bascule le datasource Prisma de SQLite vers PostgreSQL pour le build de
// production (Netlify). Le schéma source reste en SQLite pour le dev local
// zéro-config : ce script ne s'exécute QUE dans le build prod (via build:netlify).
// Idempotent : sans effet si déjà en postgresql.
import { readFile, writeFile } from "node:fs/promises";

const schemaUrl = new URL("../prisma/schema.prisma", import.meta.url);
const schema = await readFile(schemaUrl, "utf8");

if (schema.includes('provider = "postgresql"')) {
  console.log("use-postgres : déjà en postgresql, rien à faire.");
  process.exit(0);
}
if (!schema.includes('provider = "sqlite"')) {
  console.error("use-postgres : `provider = \"sqlite\"` introuvable — abandon.");
  process.exit(1);
}

await writeFile(schemaUrl, schema.replace('provider = "sqlite"', 'provider = "postgresql"'));
console.log("use-postgres : datasource Prisma → postgresql (build prod).");
