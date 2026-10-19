import React from 'react';
import { X, Sparkles, AlertCircle, Trash2, Ban } from 'lucide-react';
import { GridTile } from '../types/game';

interface TileInspectDrawerProps {
  tile: GridTile | null;
  onClose: () => void;
  onModifyTile: (updatedTile: GridTile) => void;
}

export const TileInspectDrawer: React.FC<TileInspectDrawerProps> = ({
  tile,
  onClose,
  onModifyTile,
}) => {
  if (!tile) return null;

  const handleAddDirt = () => {
    onModifyTile({
      ...tile,
      dirtLevel: Math.min(5, tile.dirtLevel + 2),
      dirtType: tile.dirtType || 'crumbs',
      isCleaned: false,
    });
  };

  const handleCleanTile = () => {
    onModifyTile({
      ...tile,
      dirtLevel: 0,
      isCleaned: true,
    });
  };

  const handleToggleWall = () => {
    if (tile.type === 'dock') return; // Cannot turn dock to wall
    const newType = tile.type === 'wall' ? 'floor' : 'wall';
    onModifyTile({
      ...tile,
      type: newType,
    });
  };

  return (
    <div className="absolute top-18 right-6 z-40 w-72 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-4 text-xs font-mono text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="font-bold text-slate-100 uppercase">
            Tile State ({tile.x}, {tile.y})
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-slate-500">Zone / Room:</span>
          <span className="text-slate-200 font-semibold uppercase">{tile.room}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Surface Type:</span>
          <span className="text-slate-200 uppercase">{tile.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Friction Multiplier:</span>
          <span className="text-sky-400">{tile.costMultiplier}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Dirt Severity:</span>
          <span className={tile.dirtLevel > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
            {tile.dirtLevel > 0 ? `Level ${tile.dirtLevel} (${tile.dirtType || 'dust'})` : 'Pristine Clean'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleAddDirt}
          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>+ Add Dirt</span>
        </button>

        <button
          onClick={handleCleanTile}
          className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Spot Clean</span>
        </button>

        <button
          onClick={handleToggleWall}
          disabled={tile.type === 'dock'}
          className="col-span-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          <Ban className="w-3.5 h-3.5" />
          <span>{tile.type === 'wall' ? 'Remove Wall' : 'Place Obstacle Wall'}</span>
        </button>
      </div>
    </div>
  );
};
