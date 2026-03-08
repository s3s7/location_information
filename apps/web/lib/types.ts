export type Center = {
  lat: number;
  lng: number;
};

export type Spot = {
  id: string;
  externalId?: string | null;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};
