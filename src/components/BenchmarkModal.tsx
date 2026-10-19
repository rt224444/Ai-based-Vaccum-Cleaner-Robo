import React, { useMemo } from 'react';
import { X, Award, Zap, Compass, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { BenchmarkMetrics, GridTile, Point } from '../types/game';
import { runAlgorithmBenchmark } from '../lib/agents';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: GridTile[][];
  dock: Point;
  onSelectAlgorithmAndRun: (algo: any) => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  grid,
  dock,
  onSelectAlgorithmAndRun,
}) => {
  if (!isOpen) return null;

  // Extract all dirty spots
  const targets: Point[] = useMemo(() => {
    const list: Point[] = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x].dirtLevel > 0) {
          list.push({ x, y });
        }
      }
    }
    return list;
  }, [grid]);

  // Run benchmark across all 7 algorithms
  const benchmarkData: BenchmarkMetrics[] = useMemo(() => {
    return runAlgorithmBenchmark(grid, dock, targets, dock);
  }, [grid, dock, targets]);

  // Find optimal metric values for highlights
  const minNodes = Math.min(...benchmarkData.map((d) => d.nodesExplored));
  const minPath = Math.min(...benchmarkData.map((d) => d.pathLength));
  const minCost = Math.min(...benchmarkData.map((d) => d.totalCost));
  const minBattery = Math.min(...benchmarkData.map((d) => d.batteryConsumed));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Autonomous Search &amp; Agent Benchmark Arena</h2>
              <p className="text-xs text-slate-400 font-mono">
                Comparative analysis of uninformed search, informed search, and intelligent agent techniques
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

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Insights Overview Cards (anti-pill clean design) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Search Efficiency</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-200">
                A* vs BFS: {Math.round(((benchmarkData.find(d => d.algorithm === 'bfs')?.nodesExplored || 1) / Math.max(1, minNodes)) * 10) / 10}x
              </div>
              <p className="text-xs text-slate-400 mt-1">
                A* heuristic prunes unpromising search branches, exploring significantly fewer nodes than uninformed BFS.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Battery &amp; Terrain Cost</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                UCS &amp; A* Terrain Aware
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Uniform Cost Search &amp; A* account for carpet friction and spills, avoiding high-resistance terrain.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Intelligent Agents</span>
              </div>
              <div className="text-xl font-bold font-mono text-amber-300">
                Multi-Factor Utility
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Utility agent prioritizes kitchen/bath hygiene and dirt density while preventing battery stranding.
              </p>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3 px-4">Algorithm / Agent</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Nodes Explored</th>
                    <th className="py-3 px-3">Path Length</th>
                    <th className="py-3 px-3">Path Cost</th>
                    <th className="py-3 px-3">Battery</th>
                    <th className="py-3 px-3">Compute (ms)</th>
                    <th className="py-3 px-3">Optimality</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {benchmarkData.map((row) => {
                    const isBestNodes = row.nodesExplored === minNodes;
                    const isBestPath = row.pathLength === minPath;

                    return (
                      <tr key={row.algorithm} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-sans font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            {row.success ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span>{row.displayName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-400">
                          <span className="text-[11px]">{row.category}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`tabular-nums font-semibold ${isBestNodes ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {row.nodesExplored}
                          </span>
                          {isBestNodes && <span className="ml-1 text-[10px] text-emerald-400">★ min</span>}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`tabular-nums ${isBestPath ? 'text-sky-400 font-semibold' : 'text-slate-300'}`}>
                            {row.pathLength} tiles
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-300 tabular-nums">
                          {row.totalCost}
                        </td>

                        <td className="py-3 px-3 text-amber-400 tabular-nums">
                          ~{row.batteryConsumed}%
                        </td>

                        <td className="py-3 px-3 text-slate-400 tabular-nums">
                          {row.executionTimeMs} ms
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">
                          {row.optimalityRating}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              onSelectAlgorithmAndRun(row.algorithm);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 transition-colors cursor-pointer text-xs"
                          >
                            <span>Run</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Explanation of Search & Agent Mechanisms */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300 font-sans">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <span>Scientific Evaluation of Search &amp; Agent Behavior</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 pt-1">
              <div>
                <strong className="text-slate-200">Uninformed Search (BFS, DFS, UCS):</strong> BFS guarantees the minimum number of steps on unweighted grids, but blindly expands every node in a widening circle. DFS plunges deep along one corridor, often leading to tortuous, non-optimal paths. UCS prioritizes path cost $g(n)$, avoiding sticky mud and thick carpet.
              </div>
              <div>
                <strong className="text-slate-200">Informed &amp; Intelligent Agents (A*, Utility):</strong> A* integrates real accumulated cost $g(n)$ plus admissible Manhattan distance $h(n)$ to guarantee optimal paths with minimal explored nodes. The Utility Agent balances dirt concentration, distance, and charging station security to continuously maximize overall cleaning utility.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-semibold transition-colors cursor-pointer font-mono"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
