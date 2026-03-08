import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

type GoogleGeocodeResponse = {
  results?: Array<{ formatted_address?: string }>;
  status?: string;
};

@Injectable()
export class GeocodeService {
  constructor(private readonly dataSource: DataSource) {}

  async reverse(lat: number, lng: number) {
    const latRounded = Number(lat.toFixed(4));
    const lngRounded = Number(lng.toFixed(4));
    const key = `${latRounded}:${lngRounded}`;

    const cached = await this.dataSource.query(
      `SELECT address FROM reverse_geocode_cache WHERE key = $1 LIMIT 1`,
      [key],
    );

    if (cached.length > 0) {
      return {
        address: cached[0].address,
        cached: true,
      };
    }

    const address = await this.fetchAddress(latRounded, lngRounded);

    await this.dataSource.query(
      `
      INSERT INTO reverse_geocode_cache (key, lat_rounded, lng_rounded, address, provider)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (key)
      DO UPDATE SET address = EXCLUDED.address
      `,
      [
        key,
        latRounded,
        lngRounded,
        address,
        process.env.GEOCODING_PROVIDER || "google",
      ],
    );

    return {
      address,
      cached: false,
    };
  }

  private async fetchAddress(lat: number, lng: number): Promise<string> {
    const apiKey = process.env.GEOCODING_API_KEY;

    if (!apiKey) {
      return `緯度 ${lat}, 経度 ${lng}`;
    }

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("latlng", `${lat},${lng}`);
      url.searchParams.set("language", "ja");
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      const data = (await response.json()) as GoogleGeocodeResponse;

      const address = data.results?.[0]?.formatted_address;

      if (!address) {
        return `緯度 ${lat}, 経度 ${lng}`;
      }

      return address;
    } catch {
      return `緯度 ${lat}, 経度 ${lng}`;
    }
  }
}
