"use client";

import { useEffect, useState } from "react";

export default function OrientationPage() {
  const [orientation, setOrientation] = useState({
    alpha: 0, // Z 軸旋轉（面向方向）
    beta: 0,  // X 軸旋轉（前後傾斜）
    gamma: 0, // Y 軸旋轉（左右傾斜）
  });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let sensor;

    if ("AbsoluteOrientationSensor" in window || "RelativeOrientationSensor" in window) {
      try {
        const SensorClass =
          window.AbsoluteOrientationSensor || window.RelativeOrientationSensor;
        sensor = new SensorClass({ frequency: 60 });

        sensor.addEventListener("reading", () => {
          const q = sensor.quaternion; // [x, y, z, w]
          setOrientation({
            alpha: (q[0] * 180).toFixed(2),
            beta: (q[1] * 180).toFixed(2),
            gamma: (q[2] * 180).toFixed(2),
          });
        });

        sensor.addEventListener("error", (e) => {
          console.error("Sensor error:", e.error);
          setSupported(false);
        });

        sensor.start();
      } catch (err) {
        console.error("OrientationSensor error:", err);
        setSupported(false);
      }
    } else if ("DeviceOrientationEvent" in window) {
      // 備援方案：使用傳統 DeviceOrientation API
      const handleOrientation = (e) => {
        setOrientation({
          alpha: e.alpha?.toFixed(2) ?? 0,
          beta: e.beta?.toFixed(2) ?? 0,
          gamma: e.gamma?.toFixed(2) ?? 0,
        });
      };
      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    } else {
      setSupported(false);
    }

    return () => {
      if (sensor) sensor.stop();
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl mb-6">裝置方向感測</h1>
      {supported ? (
        <div className="text-lg space-y-2">
          <p>Alpha（Z 軸旋轉）：{orientation.alpha}°</p>
          <p>Beta（X 軸傾斜）：{orientation.beta}°</p>
          <p>Gamma（Y 軸傾斜）：{orientation.gamma}°</p>
        </div>
      ) : (
        <p className="text-red-400 mt-4">此裝置或瀏覽器不支援 OrientationSensor。</p>
      )}
    </main>
  );
}
