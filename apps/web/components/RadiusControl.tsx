"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export default function RadiusControl({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <label>検索半径</label>
        <span>{value} km</span>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>0.5 km</span>
        <span>100 km</span>
      </div>
    </div>
  );
}
