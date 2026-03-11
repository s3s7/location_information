"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Center, Spot } from "@/lib/types";

type Props = {
  initialCenter: Center;
  currentCenter: Center;
  radiusKm: number;
  spots: Spot[];
  onCenterChange: (center: Center) => void;
  onCenterCommit: (center: Center) => void;
};

export default function MapView({
  initialCenter,
  currentCenter,
  radiusKm,
  spots,
  onCenterChange,
  onCenterCommit,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  // 非同期ロード完了時に最新値を参照するための ref
  const spotsRef = useRef<Spot[]>(spots);
  spotsRef.current = spots;
  const radiusKmRef = useRef<number>(radiusKm);
  radiusKmRef.current = radiusKm;

  // 地図の初期化（マウント時のみ）
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      version: "weekly",
    });

    let isMounted = true;

    loader.load().then(() => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: initialCenter.lat, lng: initialCenter.lng },
        zoom: 12,
      });
      mapRef.current = map;

      // 半径サークルの初期配置
      circleRef.current = new google.maps.Circle({
        map,
        center: { lat: initialCenter.lat, lng: initialCenter.lng },
        radius: radiusKmRef.current * 1000,
        fillColor: "#2563eb",
        fillOpacity: 0.08,
        strokeColor: "#2563eb",
        strokeWeight: 2,
      });

      // スポットマーカーの初期配置（ロード完了時点の最新 spots を使用）
      markersRef.current = spotsRef.current.map(
        (spot) =>
          new google.maps.Marker({
            map,
            position: { lat: spot.latitude, lng: spot.longitude },
            title: spot.name,
          }),
      );

      // ドラッグ中: 住所表示を更新
      map.addListener("center_changed", () => {
        const center = map.getCenter();
        if (!center) return;
        onCenterChange({ lat: center.lat(), lng: center.lng() });
      });

      // ドラッグ完了: スポット検索をトリガー
      map.addListener("idle", () => {
        const center = map.getCenter();
        if (!center) return;
        const next = { lat: center.lat(), lng: center.lng() };
        onCenterChange(next);
        onCenterCommit(next);
      });
    });

    return () => {
      isMounted = false;
      circleRef.current?.setMap(null);
      circleRef.current = null;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCenter.lat, initialCenter.lng]);

  // スポット変化時にマーカーを更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = spots.map(
      (spot) =>
        new google.maps.Marker({
          map,
          position: { lat: spot.latitude, lng: spot.longitude },
          title: spot.name,
        }),
    );
  }, [spots]);

  // 地図中心・半径変化時にサークルを更新
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    circle.setCenter({ lat: currentCenter.lat, lng: currentCenter.lng });
    circle.setRadius(radiusKm * 1000);
  }, [currentCenter, radiusKm]);

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
