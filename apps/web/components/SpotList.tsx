"use client";

import { Spot } from "@/lib/types";

type Props = {
  items: Spot[];
  loading: boolean;
};

export default function SpotList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        検索中...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        この範囲にはスポットがありません
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((spot) => (
        <li
          key={spot.id}
          className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
        >
          <div className="font-semibold">{spot.name}</div>
          <div className="mt-1 text-sm text-gray-500">
            {spot.address || "住所なし"}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {(spot.distanceMeters / 1000).toFixed(2)} km
          </div>
        </li>
      ))}
    </ul>
  );
}
