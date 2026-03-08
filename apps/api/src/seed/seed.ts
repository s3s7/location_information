import "reflect-metadata";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import AppDataSource from "../database/data-source";

type CsvRow = {
  name: string;
  category: string;
  lat: string;
  long: string;
  address: string;
};

async function main() {
  await AppDataSource.initialize();

  const csvPath = path.join(process.cwd(), "seeds", "landit_coding_test_seed.csv");
  const csv = fs.readFileSync(csvPath, "utf-8");

  const records: CsvRow[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // このCSVには一意IDがないため、seedを何度流しても重複しないように全削除して入れ直す
  await AppDataSource.query(`TRUNCATE TABLE spots;`);

  for (const row of records) {
    const name = row.name?.trim();
    const address = row.address?.trim() || null;
    const latitude = Number(row.lat);
    const longitude = Number(row.long);

    if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      continue;
    }

    await AppDataSource.query(
      `
      INSERT INTO spots (
        name,
        address,
        latitude,
        longitude,
        location,
        raw
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography,
        $5::jsonb
      )
      `,
      [
        name,
        address,
        latitude,
        longitude,
        JSON.stringify({
          name: row.name,
          category: row.category,
          lat: row.lat,
          long: row.long,
          address: row.address,
        }),
      ],
    );
  }

  await AppDataSource.destroy();
  console.log("seed completed");
}

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
