import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { GeocodeService } from "./geocode.service";

@Controller("geocode")
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get("reverse")
  async reverse(@Query("lat") lat: string, @Query("lng") lng: string) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      throw new BadRequestException("lat and lng must be numbers");
    }

    return this.geocodeService.reverse(parsedLat, parsedLng);
  }
}
