"use client";

import { useState, useEffect } from "react";
import { useTownPass } from "@/lib/townpass/hooks/useTownPass";
import type { UserMode } from "@/types/townpass";

interface ModeSelectorProps {
  className?: string;
}

export default function MapModeSelector({ className = "" }: ModeSelectorProps) {
  const { isFlutter, state, setMode, loading } = useTownPass();
  const [currentMode, setCurrentMode] = useState<UserMode>("pedestrian");

  // 同步 Flutter 狀態
  useEffect(() => {
    if (state?.mode) {
      setCurrentMode(state.mode);
    }
  }, [state?.mode]);

  const modes: Array<{
    value: UserMode;
    label: string;
    icon: string;
    color: string;
  }> = [
    {
      value: "pedestrian",
      label: "行人",
      icon: "🚶",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      value: "bicycle",
      label: "自行車",
      icon: "🚴",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      value: "vehicle",
      label: "車輛",
      icon: "🚗",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const handleModeChange = async (mode: UserMode) => {
    if (!isFlutter) {
      // 非 Flutter 環境，僅更新本地狀態
      setCurrentMode(mode);
      return;
    }

    try {
      await setMode(mode);
    } catch (error) {
      console.error("Failed to change mode:", error);
    }
  };

  return (
    <div className={`rounded-md bg-white p-2.5 shadow-lg ${className}`}>
      <h4 className="mb-2 text-base font-semibold">模式選擇</h4>
      <div className="space-y-2">
        {modes.map((mode) => {
          const isActive = currentMode === mode.value;
          const isDisabled = loading;

          return (
            <div key={mode.value} className="flex items-center gap-2">
              <input
                type="radio"
                id={`mode-${mode.value}`}
                name="transport-mode"
                checked={isActive}
                onChange={() => handleModeChange(mode.value)}
                disabled={isDisabled}
                className="h-4 w-4 cursor-pointer accent-blue-600"
              />
              <label
                htmlFor={`mode-${mode.value}`}
                className={`flex cursor-pointer items-center gap-1.5 text-sm select-none ${
                  isDisabled ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </label>
            </div>
          );
        })}

        {!isFlutter && (
          <div className="mt-2 flex items-center gap-1 border-t border-gray-200 pt-2 text-xs text-yellow-700">
            <span>⚠️</span>
            <span>離線模式</span>
          </div>
        )}
      </div>
    </div>
  );
}
