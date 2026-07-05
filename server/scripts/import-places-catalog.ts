import { db } from "../db";
import { upsertPlacesCatalog } from "../places-catalog-upsert";
import { closeImportConnection, configureBulkImportEnv } from "./import-runtime";

export async function importPlacesCatalog(): Promise<void> {
  const realDb = db;
  const total = await upsertPlacesCatalog(realDb, {
    resilient: true,
    onProgress: (done, all) => console.log(`places catalog: upserted ${done}/${all}`),
  });
  console.log(`[import-places-catalog] Done — ${total} places.`);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("import-places-catalog.ts");

if (isDirectRun) {
  configureBulkImportEnv();
  importPlacesCatalog()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => closeImportConnection());
}
