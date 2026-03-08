import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1700000000000 implements MigrationInterface {
  name = "Init1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS spots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id TEXT UNIQUE,
        name TEXT NOT NULL,
        address TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_spots_location_gist
      ON spots
      USING GIST (location);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reverse_geocode_cache (
        key TEXT PRIMARY KEY,
        lat_rounded DOUBLE PRECISION NOT NULL,
        lng_rounded DOUBLE PRECISION NOT NULL,
        address TEXT NOT NULL,
        provider TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reverse_geocode_cache;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_spots_location_gist;`);
    await queryRunner.query(`DROP TABLE IF EXISTS spots;`);
  }
}
