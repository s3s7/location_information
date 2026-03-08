"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const radiusOptions = [1, 3, 5, 10, 20];

export default function RadiusControl({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-500">検索半径</label>
      <select
        className="w-full rounded-lg border border-gray-300 bg-white p-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {radiusOptions.map((radius) => (
          <option key={radius} value={radius}>
            {radius} km
          </option>
        ))}
      </select>
    </div>
  );
}
