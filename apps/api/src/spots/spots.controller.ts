import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { SpotsService } from "./spots.service";

@Controller("spots")
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get("search")
  async search(
    @Query("lat") lat: string,
    @Query("lng") lng: string,
    @Query("radiusKm") radiusKm: string,
  ) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedRadiusKm = Number(radiusKm || 5);

    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      Number.isNaN(parsedRadiusKm)
    ) {
      throw new BadRequestException("lat, lng, radiusKm must be numbers");
    }

    return this.spotsService.search(parsedLat, parsedLng, parsedRadiusKm);
  }
}
