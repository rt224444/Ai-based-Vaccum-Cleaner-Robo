import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  Gamepad2,
  Minimize2,
  Maximize2,
  Compass,
} from 'lucide-react';
import { VirtualControllerState, GameMode } from '../types/game';

interface OnScreenControllerProps {
  virtualInput: VirtualControllerState;
  onInputChange: (input: Partial<VirtualControllerState>) => void;
  gameMode: GameMode;
  onToggleGameMode: () => void;
  onReturnToDock: () => void;
  onSpotClean: () => void;
}

export const OnScreenController: React.FC<OnScreenControllerProps> = ({
  virtualInput,
  onInputChange,
  gameMode,
  onToggleGameMode,
  onReturnToDock,
  onSpotClean,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Helper for press and release
  const handlePress = (direction: keyof VirtualControllerState) => {
    // If in autonomous mode, automatically switch to manual drive so the robot responds immediately
    if (gameMode !== 'manual') {
      onToggleGameMode();
    }
    onInputChange({ [direction]: true });
  };

  const handleRelease = (direction: keyof VirtualControllerState) => {
    onInputChange({ [direction]: false });
  };

  return (
    <div className="pointer-events-auto fixed bottom-20 left-4 sm:left-6 z-30 select-none font-mono">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-sky-400 hover:text-sky-300 text-xs shadow-xl backdrop-blur-md cursor-pointer transition-all"
          title="Show On-Screen Controller"
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="font-semibold">Controls</span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      ) : (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 max-w-[260px] sm:max-w-[280px]">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 text-slate-300 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold tracking-wider text-slate-200 uppercase">Drive Controller</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleGameMode}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  gameMode === 'manual'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Manual Drive / Auto AI"
              >
                {gameMode === 'manual' ? 'MANUAL' : 'AUTO AI'}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Minimize controller"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* D-Pad & Action Buttons Grid */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* 4-Way D-Pad */}
            <div className="relative w-28 h-28 bg-slate-950/80 rounded-full border border-slate-800 p-1 flex items-center justify-center shadow-inner">
              {/* UP */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePress('up');
                }}
                onPointerUp={() => handleRelease('up')}
                onPointerLeave={() => handleRelease('up')}
                onPointerCancel={() => handleRelease('up')}
                className={`absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-t-lg rounded-b-sm flex items-center justify-center transition-all cursor-pointer ${
                  virtualInput.up
                    ? 'bg-sky-500 text-slate-950 scale-95 shadow-md shadow-sky-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                }`}
                aria-label="Move Up (W)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* DOWN */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePress('down');
                }}
                onPointerUp={() => handleRelease('down')}
                onPointerLeave={() => handleRelease('down')}
                onPointerCancel={() => handleRelease('down')}
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-b-lg rounded-t-sm flex items-center justify-center transition-all cursor-pointer ${
                  virtualInput.down
                    ? 'bg-sky-500 text-slate-950 scale-95 shadow-md shadow-sky-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                }`}
                aria-label="Move Down (S)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>

              {/* LEFT */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePress('left');
                }}
                onPointerUp={() => handleRelease('left')}
                onPointerLeave={() => handleRelease('left')}
                onPointerCancel={() => handleRelease('left')}
                className={`absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-l-lg rounded-r-sm flex items-center justify-center transition-all cursor-pointer ${
                  virtualInput.left
                    ? 'bg-sky-500 text-slate-950 scale-95 shadow-md shadow-sky-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                }`}
                aria-label="Move Left (A)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* RIGHT */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePress('right');
                }}
                onPointerUp={() => handleRelease('right')}
                onPointerLeave={() => handleRelease('right')}
                onPointerCancel={() => handleRelease('right')}
                className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-r-lg rounded-l-sm flex items-center justify-center transition-all cursor-pointer ${
                  virtualInput.right
                    ? 'bg-sky-500 text-slate-950 scale-95 shadow-md shadow-sky-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                }`}
                aria-label="Move Right (D)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Center Pivot Indicator */}
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center pointer-events-none">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-1.5 flex-1">
              {/* Turbo Boost */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onInputChange({ turbo: true });
                }}
                onPointerUp={() => onInputChange({ turbo: false })}
                onPointerLeave={() => onInputChange({ turbo: false })}
                onPointerCancel={() => onInputChange({ turbo: false })}
                className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  virtualInput.turbo
                    ? 'bg-amber-400 text-slate-950 scale-95 shadow-lg shadow-amber-400/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20'
                }`}
                title="Hold for Turbo Boost (1.8x speed)"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Turbo</span>
              </button>

              {/* Spot Clean Vortex */}
              <button
                onClick={onSpotClean}
                className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold bg-sky-500/10 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Instantly vacuum current tile with maximum suction"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spot Clean</span>
              </button>

              {/* Emergency Return to Dock */}
              <button
                onClick={onReturnToDock}
                className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Navigate directly to charging station"
              >
                <span>⚡ Dock</span>
              </button>
            </div>
          </div>

          {/* Quick instructions hint */}
          <div className="text-[10px] text-slate-400 text-center border-t border-slate-800/80 pt-1.5">
            <span>D-Pad / WASD to steer</span>
            <span className="mx-1 text-slate-600">·</span>
            <span>Click floor to target</span>
          </div>
        </div>
      )}
    </div>
  );
};
