"use client";

import { useEffect, useState } from "react";

export default function DeviceOrientationDemo() {
  const [orientation, setOrientation] = useState({
    absolute: null,
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  useEffect(() => {
    const handleOrientation = (event) => {
      setOrientation({
        absolute: event.absolute, // 是否為絕對方向（相對地理北）
        alpha: event.alpha?.toFixed(2) ?? 0,
        beta: event.beta?.toFixed(2) ?? 0,
        gamma: event.gamma?.toFixed(2) ?? 0,
      });
    };

    // 現在大部分瀏覽器支援 deviceorientationabsolute
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS 需要先請求權限
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === "granted") {
              window.addEventListener("deviceorientationabsolute", handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientationabsolute", handleOrientation);
      }
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl mb-4">裝置方向資訊</h1>
      <p className="mb-2">Absolute: {orientation.absolute ? "true" : "false"}</p>
      <p className="mb-2">Alpha (Z軸旋轉): {orientation.alpha}°</p>
      <p className="mb-2">Beta (X軸傾斜): {orientation.beta}°</p>
      <p className="mb-2">Gamma (Y軸傾斜): {orientation.gamma}°</p>
    </div>
  );
}
