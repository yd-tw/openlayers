"use client";

import type { UserMode } from "@/types/townpass";

interface ModeSelectorProps {
  currentMode?: UserMode;
  onModeChange: (mode: UserMode) => void;
  disabled?: boolean;
}

export function ModeSelector({
  currentMode,
  onModeChange,
  disabled,
}: ModeSelectorProps) {
  const modes: { value: UserMode; label: string; icon: string }[] = [
    { value: "pedestrian", label: "行人", icon: "🚶" },
    { value: "bicycle", label: "自行車", icon: "🚴" },
    { value: "vehicle", label: "汽車", icon: "🚗" },
  ];

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">選擇模式</h2>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            disabled={disabled}
            className={`rounded-lg border-2 p-4 transition-all ${
              currentMode === mode.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-blue-300"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="mb-2 text-3xl">{mode.icon}</div>
            <div className="font-medium">{mode.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
