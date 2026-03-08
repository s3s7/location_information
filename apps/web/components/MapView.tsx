"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { GeoJSONSource, Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Center, Spot } from "@/lib/types";

type Props = {
  initialCenter: Center;
  currentCenter: Center;
  radiusKm: number;
  spots: Spot[];
  onCenterChange: (center: Center) => void;
  onCenterCommit: (center: Center) => void;
};

function createCircleGeoJSON(center: Center, radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  const earthRadiusKm = 6371;

  for (let i = 0; i <= points; i += 1) {
    const bearing = (i * 360) / points;
    const bearingRad = (bearing * Math.PI) / 180;
    const latRad = (center.lat * Math.PI) / 180;
    const lngRad = (center.lng * Math.PI) / 180;
    const angularDistance = radiusKm / earthRadiusKm;

    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad),
    );

    const newLng =
      lngRad +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLat),
      );

    coords.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [coords],
        },
        properties: {},
      },
    ],
  };
}

function createSpotsGeoJSON(spots: Spot[]) {
  return {
    type: "FeatureCollection" as const,
    features: spots.map((spot) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [spot.longitude, spot.latitude] as [number, number],
      },
      properties: {
        id: spot.id,
        name: spot.name,
        address: spot.address ?? "",
      },
    })),
  };
}

export default function MapView({
  initialCenter,
  currentCenter,
  radiusKm,
  spots,
  onCenterChange,
  onCenterCommit,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const spotsGeoJSON = useMemo(() => createSpotsGeoJSON(spots), [spots]);
  const circleGeoJSON = useMemo(
    () => createCircleGeoJSON(currentCenter, radiusKm),
    [currentCenter, radiusKm],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
        "https://demotiles.maplibre.org/style.json",
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 12,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("spots-source", {
        type: "geojson",
        data: spotsGeoJSON,
      });

      map.addLayer({
        id: "spots-layer",
        type: "circle",
        source: "spots-source",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource("radius-source", {
        type: "geojson",
        data: circleGeoJSON,
      });

      map.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius-source",
        paint: {
          "fill-color": "#2563eb",
          "fill-opacity": 0.08,
        },
      });

      map.addLayer({
        id: "radius-line",
        type: "line",
        source: "radius-source",
        paint: {
          "line-color": "#2563eb",
          "line-width": 2,
        },
      });
    });

    map.on("move", () => {
      const center = map.getCenter();
      onCenterChange({
        lat: center.lat,
        lng: center.lng,
      });
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      const nextCenter = {
        lat: center.lat,
        lng: center.lng,
      };
      onCenterChange(nextCenter);
      onCenterCommit(nextCenter);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter.lat, initialCenter.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("spots-source") as GeoJSONSource | undefined;
    if (source) {
      source.setData(spotsGeoJSON);
    }
  }, [spotsGeoJSON]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("radius-source") as GeoJSONSource | undefined;
    if (source) {
      source.setData(circleGeoJSON);
    }
  }, [circleGeoJSON]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <div className="absolute h-8 w-[2px] bg-red-500/80" />
        <div className="absolute h-[2px] w-8 bg-red-500/80" />
        <div className="h-2 w-2 rounded-full border border-red-500 bg-white" />
      </div>
    </div>
  );
}
