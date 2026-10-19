import React from 'react';
import { X, Home, Check } from 'lucide-react';
import { HouseFloorPlan } from '../types/game';
import { PRESET_MAPS } from '../lib/defaultMaps';

interface MapSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMapId: string;
  onSelectMap: (map: HouseFloorPlan) => void;
}

export const MapSelectorModal: React.FC<MapSelectorModalProps> = ({
  isOpen,
  onClose,
  activeMapId,
  onSelectMap,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Select House Floorplan</h2>
              <p className="text-xs text-slate-400 font-mono">
                Choose a room environment to simulate vacuum navigation and search
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of preset maps */}
        <div className="p-6 space-y-3">
          {PRESET_MAPS.map((floorplan) => {
            const isSelected = floorplan.id === activeMapId;
            return (
              <div
                key={floorplan.id}
                onClick={() => {
                  onSelectMap(floorplan);
                  onClose();
                }}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isSelected
                    ? 'bg-sky-950/30 border-sky-500/80 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100 text-sm">{floorplan.name}</h3>
                    {isSelected && (
                      <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{floorplan.description}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-2">
                    <span>Grid: {floorplan.width} × {floorplan.height}</span>
                    <span>·</span>
                    <span>Dock at ({floorplan.dock.x}, {floorplan.dock.y})</span>
                  </div>
                </div>

                <button
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950'
                      : 'border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Loaded' : 'Load Map'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-mono transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
