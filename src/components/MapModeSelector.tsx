"use client";

import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useTownPass } from "@/lib/townpass/hooks/useTownPass";
import type { UserMode } from "@/types/townpass";

interface ModeSelectorProps {
  className?: string;
}

function WalkIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="20px"
      width="20px"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      <path d="M7 21l3 -4"></path>
      <path d="M16 21l-2 -4l-3 -3l1 -6"></path>
      <path d="M6 12l2 -3l4 -1l3 3l3 1"></path>
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="20px"
      width="20px"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
      <path d="M19 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
      <path d="M12 19l0 -4l-3 -3l5 -4l2 3l3 0"></path>
      <path d="M17 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
    </svg>
  );
}

function CarIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="20px"
      width="20px"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
      <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
      <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"></path>
    </svg>
  );
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
    icon: ReactElement;
    color: string;
  }> = [
    {
      value: "pedestrian",
      label: "行　人",
      icon: <WalkIcon />,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      value: "bicycle",
      label: "自行車",
      icon: <BikeIcon />,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      value: "vehicle",
      label: "車　輛",
      icon: <CarIcon />,
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
    <div className={`bg-[#5ab4c5] p-2.5 pb-4 shadow-lg ${className}`}>
      <div className="align-button flex justify-around">
        {modes.map((mode) => {
          const isActive = currentMode === mode.value;
          const isDisabled = loading;

          return (
            <div
              key={mode.value}
              className={`flex items-center rounded-sm px-3 py-2 shadow-sm ${
                isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } ${isActive ? `bg-gray-50/80 shadow-inner shadow-xs` : "bg-gray-50"}`}
            >
              <input
                type="radio"
                id={`mode-${mode.value}`}
                name="transport-mode"
                checked={isActive}
                onChange={() => handleModeChange(mode.value)}
                disabled={isDisabled}
                className="hidden h-4 w-4"
              />
              <label
                htmlFor={`mode-${mode.value}`}
                className={`flex items-center gap-1.5 text-sm select-none ${isDisabled ? "cursor-not-allowed" : ""}`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </label>
            </div>
          );
        })}

        {/* {!isFlutter && (
          <div className="mt-2 flex items-center gap-1 border-t border-gray-200 pt-2 text-xs text-yellow-700">
            <span>⚠️</span>
            <span>離線模式</span>
          </div>
        )} */}
      </div>
    </div>
  );
}
