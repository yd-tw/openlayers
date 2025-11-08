"use client";

interface Layer {
  getVisible: () => boolean;
  setVisible: (visible: boolean) => void;
}

interface LayerSwitcherProps {
  layers: Record<string, Layer>;
  toggleLayer: (layerName: string) => void;
}

export default function LayerSwitcher({ layers, toggleLayer }: LayerSwitcherProps) {
  return (
    <div className="absolute top-2.5 right-2.5 bg-white p-2.5 rounded-md shadow-lg z-[1000]">
      <h4 className="text-base font-semibold mb-2">圖層控制</h4>
      <div className="space-y-2">
        {Object.keys(layers).map((layerName) => (
          <div key={layerName} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`layer-${layerName}`}
              checked={layers[layerName]?.getVisible() ?? true}
              onChange={() => toggleLayer(layerName)}
              className="w-4 h-4 cursor-pointer accent-blue-600"
            />
            <label 
              htmlFor={`layer-${layerName}`}
              className="text-sm cursor-pointer select-none"
            >
              {layerName}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}