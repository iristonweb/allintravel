import { configureBulkImportEnv, closeImportConnection } from "./import-runtime";

async function main() {
  configureBulkImportEnv();
  console.log("Bulk import: transaction pooler, PG_POOL_MAX=1");

  try {
    const { importPlacesCatalog } = await import("./import-places-catalog");
    console.log("\n=== Places catalog ===\n");
    await importPlacesCatalog();

    const { importGeoNames } = await import("./import-geonames");
    console.log("\n=== GeoNames countries + cities ===\n");
    await importGeoNames();

    console.log("\nAll imports finished.");
  } finally {
    await closeImportConnection();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
