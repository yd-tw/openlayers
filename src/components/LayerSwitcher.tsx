"use client";

interface Layer {
  get: (key: string) => any;
  getVisible: () => boolean;
  setVisible: (visible: boolean) => void;
}

interface LayerSwitcherProps {
  layers: Record<string, Layer>;
  toggleLayer: (layerName: string) => void;
}

export default function LayerSwitcher({
  layers,
  toggleLayer,
}: LayerSwitcherProps) {
  return (
    <div className="absolute top-2.5 right-2.5 z-[1000] rounded-md bg-white p-2.5 shadow-lg">
      <h4 className="mb-2 text-base font-semibold">圖層控制</h4>
      <div className="space-y-2">
        {Object.keys(layers).map((layerName) => (
          <div key={layerName} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`layer-${layerName}`}
              checked={layers[layerName]?.getVisible() ?? true}
              onChange={() => toggleLayer(layerName)}
              className="h-4 w-4 cursor-pointer accent-blue-600"
            />
            <label
              htmlFor={`layer-${layerName}`}
              className="cursor-pointer text-sm select-none"
            >
              {layers[layerName]?.get("displayName") || layerName}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
