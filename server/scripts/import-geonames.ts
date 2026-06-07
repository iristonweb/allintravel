import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";

import { db } from "../db";
import { cities, countries } from "@shared/schema";
import { sql } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), ".local", "geonames");

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
  // Node's fetch uses Web Streams; convert to Node stream for pipeline().
  const nodeStream = Readable.fromWeb(res.body as any);
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

async function importCountries(countryInfoPath: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(countryInfoPath),
    crlfDelay: Infinity,
  });
  let count = 0;

  for await (const line of rl) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    // GeoNames columns (subset):
    // 0 ISO, 4 Country, 5 Capital, 8 Continent, 10 CurrencyCode, 12 Phone
    const code = (cols[0] || "").trim();
    const name = (cols[4] || "").trim();
    if (!code || !name || code.length !== 2) continue;

    const capitalName = (cols[5] || "").trim() || null;
    const continent = (cols[8] || "").trim() || null;
    const currency = (cols[10] || "").trim() || null;
    const phone = (cols[12] || "").trim() || null;

    await db
      .insert(countries)
      .values({ code, name, capitalName, continent, currency, phone })
      .onConflictDoUpdate({
        target: countries.code,
        set: { name, capitalName, continent, currency, phone },
      });

    count += 1;
    if (count % 50 === 0) {
      console.log(`countries: upserted ${count}`);
    }
  }

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

async function importCities(citiesPath: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(citiesPath),
    crlfDelay: Infinity,
  });
  const batch: CityRow[] = [];
  let total = 0;

  async function flush() {
    if (batch.length === 0) return;
    const values = batch.splice(0, batch.length);
    await db
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
      });
  }

  for await (const line of rl) {
    if (!line) continue;
    const cols = line.split("\t");
    // cities5000 columns (subset):
    // 0 geonameid, 1 name, 2 asciiname, 4 lat, 5 lon, 6 feature class, 7 feature code
    // 8 country code, 10 admin1, 14 population
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

    if (batch.length >= 1000) {
      await flush();

      console.log(`cities: upserted ${total}`);
    }
  }

  await flush();

  console.log(`cities: done (${total})`);
}

async function main() {
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

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
