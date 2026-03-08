import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class SpotsService {
  constructor(private readonly dataSource: DataSource) {}

  async search(lat: number, lng: number, radiusKm: number) {
    const rows = await this.dataSource.query(
      `
      SELECT
        id,
        external_id AS "externalId",
        name,
        address,
        latitude,
        longitude,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS "distanceMeters"
      FROM spots
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY "distanceMeters" ASC
      LIMIT 200
      `,
      [lng, lat, radiusKm * 1000],
    );

    return {
      center: { lat, lng },
      radiusKm,
      count: rows.length,
      items: rows.map((row: any) => ({
        ...row,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        distanceMeters: Number(row.distanceMeters),
      })),
    };
  }
}
