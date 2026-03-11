"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import RadiusControl from "@/components/RadiusControl";
import SpotList from "@/components/SpotList";
import type { Center, Spot } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
      地図を読み込み中...
    </div>
  ),
});

const INITIAL_CENTER: Center = {
  lat: 35.681236,
  lng: 139.767125,
};

export default function HomePage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  const [currentCenter, setCurrentCenter] = useState<Center>(INITIAL_CENTER);
  const [searchCenter, setSearchCenter] = useState<Center>(INITIAL_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [address, setAddress] = useState<string>("");
  const [loadingSpots, setLoadingSpots] = useState<boolean>(false);
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [addressError, setAddressError] = useState<string>("");
  const [spotsError, setSpotsError] = useState<string>("");

  const resultCount = useMemo(() => spots.length, [spots]);

  const lastAddressFetchRef = useRef<number>(0);
  const currentCenterRef = useRef<Center>(currentCenter);
  currentCenterRef.current = currentCenter;
  const lastSearchCenterRef = useRef<Center | null>(null);
  const lastRadiusKmRef = useRef<number | null>(null);

  useEffect(() => {
    const THROTTLE_MS = 500;
    const elapsed = Date.now() - lastAddressFetchRef.current;
    const remaining = THROTTLE_MS - elapsed;

    const doFetch = async () => {
      const center = currentCenterRef.current;
      setLoadingAddress(true);
      setAddressError("");
      try {
        const response = await fetch(
          `${apiBaseUrl}/geocode/reverse?lat=${center.lat}&lng=${center.lng}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setAddress(data.address ?? "");
      } catch {
        setAddressError("住所の取得に失敗しました");
        setAddress("");
      } finally {
        setLoadingAddress(false);
      }
    };

    if (remaining <= 0) {
      lastAddressFetchRef.current = Date.now();
      void doFetch();
      return;
    }

    const timer = window.setTimeout(() => {
      lastAddressFetchRef.current = Date.now();
      void doFetch();
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [apiBaseUrl, currentCenter.lat, currentCenter.lng]);

  useEffect(() => {
    const radiusChanged = lastRadiusKmRef.current !== radiusKm;
    const SKIP_THRESHOLD_KM = 0.2;
    const prev = lastSearchCenterRef.current;
    if (!radiusChanged && prev) {
      const dLat = ((searchCenter.lat - prev.lat) * Math.PI) / 180;
      const dLng = ((searchCenter.lng - prev.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((searchCenter.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distKm < SKIP_THRESHOLD_KM) return;
    }
    lastSearchCenterRef.current = searchCenter;
    lastRadiusKmRef.current = radiusKm;

    const fetchSpots = async () => {
      setLoadingSpots(true);
      setSpotsError("");

      try {
        const response = await fetch(
          `${apiBaseUrl}/spots/search?lat=${searchCenter.lat}&lng=${searchCenter.lng}&radiusKm=${radiusKm}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setSpots(data.items ?? []);
      } catch {
        setSpotsError("スポット検索に失敗しました");
        setSpots([]);
      } finally {
        setLoadingSpots(false);
      }
    };

    fetchSpots();
  }, [apiBaseUrl, searchCenter, radiusKm]);

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl bg-white p-4 shadow">
          <h1 className="mb-4 text-xl font-bold">位置情報探索アプリ</h1>

          <div className="mb-4 rounded-xl border border-gray-200 p-3">
            <div className="mb-1 text-sm text-gray-500">現在の地図中心</div>
            <div className="text-sm font-medium">
              {loadingAddress ? "住所を取得中..." : address || "住所未取得"}
            </div>
            {addressError ? (
              <div className="mt-2 text-xs text-red-500">{addressError}</div>
            ) : null}
            <div className="mt-2 text-xs text-gray-400">
              lat: {currentCenter.lat.toFixed(6)}, lng:{" "}
              {currentCenter.lng.toFixed(6)}
            </div>
          </div>

          <div className="mb-4">
            <RadiusControl value={radiusKm} onChange={setRadiusKm} />
          </div>

          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">検索結果</span>
            <span className="font-semibold">{resultCount}件</span>
          </div>

          {spotsError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {spotsError}
            </div>
          ) : null}

          <SpotList items={spots} loading={loadingSpots} />
        </aside>

        <section className="h-[70vh] rounded-2xl bg-white p-3 shadow md:h-[85vh]">
          <MapView
            initialCenter={INITIAL_CENTER}
            currentCenter={currentCenter}
            radiusKm={radiusKm}
            spots={spots}
            onCenterChange={setCurrentCenter}
            onCenterCommit={setSearchCenter}
          />
        </section>
      </div>
    </main>
  );
}
