import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";

import { cities, countries } from "@shared/schema";
import { sql } from "drizzle-orm";

import { db } from "../db";
import { withRetry } from "../bulk-import";
import { closeImportConnection, configureBulkImportEnv } from "./import-runtime";

const DATA_DIR = path.join(process.cwd(), ".local", "geonames");
const COUNTRY_BATCH_SIZE = 25;
const CITY_BATCH_SIZE = 100;

const URL_COUNTRY_INFO = "https://download.geonames.org/export/dump/countryInfo.txt";
const URL_CITIES_5000_ZIP = "https://download.geonames.org/export/dump/cities5000.zip";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function downloadIfMissing(url: string, filePath: string) {
  if (fs.existsSync(filePath)) return;
  const res = await fetch(url, {
    headers: { "User-Agent": "All-in-travel/1.0 (GeoNames importer)" },
  });
  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status} ${url}`);
  const nodeStream = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  await pipeline(nodeStream, fs.createWriteStream(filePath));
}

async function unzipSingleFile(zipPath: string, outPath: string) {
  if (fs.existsSync(outPath)) return;
  await pipeline(fs.createReadStream(zipPath), unzipper.ParseOne(), fs.createWriteStream(outPath));
}

function parseIntSafe(v: string): number | null {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatSafe(v: string): string | null {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n.toString() : null;
}

type CountryRow = {
  code: string;
  name: string;
  capitalName: string | null;
  continent: string | null;
  currency: string | null;
  phone: string | null;
};

async function flushCountries(batch: CountryRow[]) {
  if (batch.length === 0) return;
  const values = batch.splice(0, batch.length);
  await withRetry(`countries batch (${values.length})`, () =>
    db
      .insert(countries)
      .values(values)
      .onConflictDoUpdate({
        target: countries.code,
        set: {
          name: sql`excluded.name`,
          capitalName: sql`excluded.capital_name`,
          continent: sql`excluded.continent`,
          currency: sql`excluded.currency`,
          phone: sql`excluded.phone`,
        },
      }),
  );
}

async function importCountries(countryInfoPath: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(countryInfoPath),
    crlfDelay: Infinity,
  });
  const batch: CountryRow[] = [];
  let count = 0;

  for await (const line of rl) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    const code = (cols[0] || "").trim();
    const name = (cols[4] || "").trim();
    if (!code || !name || code.length !== 2) continue;

    batch.push({
      code,
      name,
      capitalName: (cols[5] || "").trim() || null,
      continent: (cols[8] || "").trim() || null,
      currency: (cols[10] || "").trim() || null,
      phone: (cols[12] || "").trim() || null,
    });
    count += 1;

    if (batch.length >= COUNTRY_BATCH_SIZE) {
      await flushCountries(batch);
      console.log(`countries: upserted ${count}`);
    }
  }

  await flushCountries(batch);
  console.log(`countries: done (${count})`);
}

type CityRow = {
  geonameId: number;
  name: string;
  asciiName: string | null;
  countryCode: string;
  admin1: string | null;
  latitude: string;
  longitude: string;
  population: number;
  featureClass: string | null;
  featureCode: string | null;
};

async function flushCities(batch: CityRow[]) {
  if (batch.length === 0) return;
  const values = batch.splice(0, batch.length);
  await withRetry(`cities batch (${values.length})`, () =>
    db
      .insert(cities)
      .values(values)
      .onConflictDoUpdate({
        target: cities.geonameId,
        set: {
          name: sql`excluded.name`,
          asciiName: sql`excluded.ascii_name`,
          countryCode: sql`excluded.country_code`,
          admin1: sql`excluded.admin1`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          population: sql`excluded.population`,
          featureClass: sql`excluded.feature_class`,
          featureCode: sql`excluded.feature_code`,
        },
      }),
  );
}

async function importCities(citiesPath: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(citiesPath),
    crlfDelay: Infinity,
  });
  const batch: CityRow[] = [];
  let total = 0;

  for await (const line of rl) {
    if (!line) continue;
    const cols = line.split("\t");
    const geonameId = parseIntSafe(cols[0] || "");
    const name = (cols[1] || "").trim();
    const asciiName = (cols[2] || "").trim() || null;
    const latitude = parseFloatSafe(cols[4] || "");
    const longitude = parseFloatSafe(cols[5] || "");
    const featureClass = (cols[6] || "").trim() || null;
    const featureCode = (cols[7] || "").trim() || null;
    const countryCode = (cols[8] || "").trim();
    const admin1 = (cols[10] || "").trim() || null;
    const population = parseIntSafe(cols[14] || "") ?? 0;

    if (!geonameId || !name || !countryCode || !latitude || !longitude) continue;

    batch.push({
      geonameId,
      name,
      asciiName,
      countryCode,
      admin1,
      latitude,
      longitude,
      population,
      featureClass,
      featureCode,
    });
    total += 1;

    if (batch.length >= CITY_BATCH_SIZE) {
      await flushCities(batch);
      console.log(`cities: upserted ${total}`);
    }
  }

  await flushCities(batch);
  console.log(`cities: done (${total})`);
}

export async function importGeoNames(): Promise<void> {
  ensureDir(DATA_DIR);

  const countryInfoPath = path.join(DATA_DIR, "countryInfo.txt");
  const citiesZipPath = path.join(DATA_DIR, "cities5000.zip");
  const citiesTxtPath = path.join(DATA_DIR, "cities5000.txt");

  console.log("Downloading GeoNames...");
  await downloadIfMissing(URL_COUNTRY_INFO, countryInfoPath);
  await downloadIfMissing(URL_CITIES_5000_ZIP, citiesZipPath);

  console.log("Unzipping cities5000...");
  await unzipSingleFile(citiesZipPath, citiesTxtPath);

  console.log("Importing countries...");
  await importCountries(countryInfoPath);

  console.log("Importing cities...");
  await importCities(citiesTxtPath);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("import-geonames.ts");

if (isDirectRun) {
  configureBulkImportEnv();
  importGeoNames()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => closeImportConnection());
}
