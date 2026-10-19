import React, { useEffect } from 'react';
import { Play, Sparkles, Cpu, Compass, Activity } from 'lucide-react';
import { SearchAlgorithmType } from '../types/game';

interface TitleScreenProps {
  onStart: (algorithm: SearchAlgorithmType, mode: 'autonomous' | 'manual') => void;
  onOpenBenchmark: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onOpenBenchmark }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart('astar', 'autonomous');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="relative w-screen h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-8 sm:p-12 overflow-hidden select-none">
      {/* Background Architectural Blueprint Grid Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Bar: Clean unboxed metadata (anti-pill compliance) */}
      <header className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-mono tracking-wider">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold uppercase">Autonomous Clean AI System</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>State-Space Search Engine</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>v2.4 Production</span>
        </div>

        <div className="flex items-center gap-3">
          <span>BFS / DFS / UCS / Greedy / A* / Goal / Utility Agents</span>
        </div>
      </header>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup & 35% Negative Space */}
      <main className="relative z-10 max-w-4xl mx-auto my-auto text-center flex flex-col items-center">
        {/* Animated Vacuum Icon Lockup */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border border-sky-500/30 bg-slate-900/80 flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.2)]">
            {/* Spinning radar sweep */}
            <div className="absolute inset-2 rounded-full border border-sky-400/20 border-t-sky-400 animate-spin" />
            <svg
              className="w-12 h-12 text-sky-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 3v3" />
              <path d="M12 18v3" />
              <path d="M3 12h3" />
              <path d="M18 12h3" />
              <circle cx="16" cy="8" r="1.5" fill="#38bdf8" />
            </svg>
          </div>
          {/* Sparkle badge */}
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-bounce" />
        </div>

        {/* Bespoke Inline SVG Title Lockup */}
        <div className="mb-4">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-sky-200 drop-shadow-sm">
            ROBO-VAC AI
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-400 font-mono font-medium tracking-wide">
            Intelligent Search &amp; Autonomous House Cleaning Simulation
          </p>
        </div>

        {/* Feature summary unboxed */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 mb-8 max-w-xl font-mono">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            7 Search &amp; Agent Algorithms
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Dynamic Pet &amp; Spill Obstacles
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Live Search Frontier Telemetry
          </span>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            onClick={() => onStart('astar', 'autonomous')}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm tracking-wide rounded-md transition-all shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Simulation (A* Optimal)</span>
          </button>

          <button
            onClick={() => onStart('astar', 'manual')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-900 text-slate-300 font-medium text-sm tracking-wide rounded-md transition-colors cursor-pointer"
          >
            <span>Manual Drive Mode</span>
          </button>
        </div>

        {/* Benchmark Arena Link */}
        <div className="mt-4">
          <button
            onClick={onOpenBenchmark}
            className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 font-mono transition-colors cursor-pointer"
          >
            Open Algorithm Benchmark Lab (BFS vs DFS vs UCS vs Greedy vs A* vs Utility)
          </button>
        </div>
      </main>

      {/* Flat Control-Hint Line (Per game craft guidelines) */}
      <footer className="relative z-10 text-center text-xs text-slate-500 font-mono tracking-wide py-2">
        <p>
          WASD / Arrows to Move <span className="text-slate-700 mx-2">·</span>
          Space to Launch / Suction <span className="text-slate-700 mx-2">·</span>
          Esc to Pause <span className="text-slate-700 mx-2">·</span>
          Click any Room Tile to Inspect or Set Target
        </p>
      </footer>
    </div>
  );
};
