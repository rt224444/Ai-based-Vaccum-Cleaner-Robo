import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  Zap,
  Sparkles,
  Home,
  BarChart2,
  Sliders,
  Layers,
  MapPin,
  Compass,
} from 'lucide-react';
import { SearchAlgorithmType, RobotState } from '../types/game';

interface GameHUDProps {
  algorithm: SearchAlgorithmType;
  onAlgorithmChange: (algo: SearchAlgorithmType) => void;
  gameMode: 'autonomous' | 'manual';
  onGameModeChange: (mode: 'autonomous' | 'manual') => void;
  isPaused: boolean;
  onTogglePause: () => void;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  onOpenBenchmark: () => void;
  onOpenMapSelect: () => void;
  onAddSpill: () => void;
  showFrontier: boolean;
  onToggleFrontier: () => void;
  telemetry: {
    battery: number;
    dustbin: number;
    dirtCleaned: number;
    totalDirt: number;
    nodesExplored: number;
    distanceTravelled: number;
    status: RobotState['status'];
    actionReason: string;
  };
}

const ALGORITHMS: Array<{ id: SearchAlgorithmType; label: string; group: string }> = [
  { id: 'astar', label: 'A* Search', group: 'Informed' },
  { id: 'utility_agent', label: 'Utility Agent', group: 'Agent' },
  { id: 'goal_agent', label: 'Goal Agent', group: 'Agent' },
  { id: 'greedy', label: 'Greedy Best-First', group: 'Informed' },
  { id: 'ucs', label: 'Uniform Cost (UCS)', group: 'Uninformed' },
  { id: 'bfs', label: 'BFS (Breadth-First)', group: 'Uninformed' },
  { id: 'dfs', label: 'DFS (Depth-First)', group: 'Uninformed' },
];

export const GameHUD: React.FC<GameHUDProps> = ({
  algorithm,
  onAlgorithmChange,
  gameMode,
  onGameModeChange,
  isPaused,
  onTogglePause,
  simulationSpeed,
  onSpeedChange,
  isMuted,
  onToggleMute,
  onReset,
  onOpenBenchmark,
  onOpenMapSelect,
  onAddSpill,
  showFrontier,
  onToggleFrontier,
  telemetry,
}) => {
  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-emerald-400';
    if (level > 20) return 'text-amber-400';
    return 'text-rose-500 animate-pulse';
  };

  const cleanPercentage =
    telemetry.dirtCleaned + telemetry.totalDirt > 0
      ? Math.round(
          (telemetry.dirtCleaned / (telemetry.dirtCleaned + telemetry.totalDirt)) * 100
        )
      : 100;

  return (
    // Outer overlay wrapper with pointer-events: none (per game craft rule: >=85% unobstructed)
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* ----------------------------------------------------------------- */}
      {/* TOP PERIMETER CLUSTER */}
      {/* ----------------------------------------------------------------- */}
      <header className="flex items-center justify-between gap-4 w-full">
        {/* Left: System Status & Live Reason Text */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3 text-xs shadow-lg max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.status === 'cleaning'
                  ? 'bg-sky-400 animate-ping'
                  : telemetry.status === 'recharging'
                  ? 'bg-emerald-400 animate-pulse'
                  : telemetry.status === 'returning_to_dock'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-mono font-semibold text-slate-200 uppercase tracking-wider">
              {telemetry.status.replace(/_/g, ' ')}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <span className="font-mono text-slate-400 truncate max-w-sm" title={telemetry.actionReason}>
            {telemetry.actionReason}
          </span>
        </div>

        {/* Right: Telemetry Metrics Cluster (Perimeter low-occlusion with tabular-nums) */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-5 text-xs shadow-lg font-mono">
          {/* Battery */}
          <div className="flex items-center gap-2">
            {telemetry.status === 'recharging' ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-bounce" />
            ) : (
              <Battery className={`w-4 h-4 ${getBatteryColor(telemetry.battery)}`} />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Power</span>
              <span className={`font-bold tabular-nums ${getBatteryColor(telemetry.battery)}`}>
                {telemetry.battery}%
              </span>
            </div>
          </div>

          {/* Cleaned Progress */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Cleaned</span>
              <span className="font-bold tabular-nums text-slate-200">{cleanPercentage}%</span>
            </div>
          </div>

          {/* Nodes Explored */}
          <div className="hidden md:flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Explored Nodes</span>
              <span className="font-bold tabular-nums text-slate-200">{telemetry.nodesExplored}</span>
            </div>
          </div>

          {/* Distance */}
          <div className="hidden lg:flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Distance</span>
              <span className="font-bold tabular-nums text-slate-200">{telemetry.distanceTravelled}m</span>
            </div>
          </div>

          {/* Audio Mute & Pause */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePause}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* BOTTOM CONTROL PERIMETER BAR */}
      {/* ----------------------------------------------------------------- */}
      <footer className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left: Mode & Algorithm Selector */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 text-xs shadow-lg">
          {/* Autonomous vs Manual Mode Segmented Control */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 font-mono">
            <button
              onClick={() => onGameModeChange('autonomous')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                gameMode === 'autonomous'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto AI Agent
            </button>
            <button
              onClick={() => onGameModeChange('manual')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                gameMode === 'manual'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual Drive (WASD)
            </button>
          </div>

          {/* Algorithm Dropdown */}
          {gameMode === 'autonomous' && (
            <div className="flex items-center gap-1.5 pl-2 font-mono">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Search:</span>
              <select
                value={algorithm}
                onChange={(e) => onAlgorithmChange(e.target.value as SearchAlgorithmType)}
                className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs outline-none focus:border-sky-500 cursor-pointer font-medium"
              >
                <optgroup label="Intelligent Agents">
                  <option value="utility_agent">Utility-Based Intelligent Agent</option>
                  <option value="goal_agent">Goal-Based Intelligent Agent</option>
                </optgroup>
                <optgroup label="Informed Search (Heuristic)">
                  <option value="astar">A* Search (Optimal &amp; Heuristic)</option>
                  <option value="greedy">Greedy Best-First Search</option>
                </optgroup>
                <optgroup label="Uninformed Search">
                  <option value="bfs">Breadth-First Search (BFS)</option>
                  <option value="dfs">Depth-First Search (DFS)</option>
                  <option value="ucs">Uniform Cost Search (UCS / Dijkstra)</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Center: Interactive Simulation Triggers (Dynamic Spills, Speed, Frontier Overlay) */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 text-xs shadow-lg font-mono">
          {/* Frontier Overlay Toggle */}
          <button
            onClick={onToggleFrontier}
            className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              showFrontier
                ? 'bg-sky-950/70 border-sky-500 text-sky-300'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Visual Search Frontier & Explored Nodes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search Frontier</span>
          </button>

          {/* Trigger Dynamic Spill Obstacle */}
          <button
            onClick={onAddSpill}
            className="px-2.5 py-1 rounded border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Simulate dynamic coffee spill or pet dirt track"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Dynamic Spill</span>
          </button>

          {/* Speed Controls */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  simulationSpeed === spd
                    ? 'bg-slate-800 text-sky-400 border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Map Selector, Reset & Benchmark Arena */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 text-xs shadow-lg">
          <button
            onClick={onOpenMapSelect}
            className="px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer font-mono"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span>Floorplan</span>
          </button>

          <button
            onClick={onReset}
            className="px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer font-mono"
            title="Reset Floor & Vacuum State"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={onOpenBenchmark}
            className="px-3 py-1 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold rounded flex items-center gap-1.5 transition-all shadow-md cursor-pointer font-mono"
          >
            <BarChart2 className="w-3.5 h-3.5 fill-current" />
            <span>Benchmark Lab</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
