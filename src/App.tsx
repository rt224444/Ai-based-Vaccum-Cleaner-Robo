import React, { useState, useCallback, useEffect } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { OnScreenController } from './components/OnScreenController';
import { BenchmarkModal } from './components/BenchmarkModal';
import { MapSelectorModal } from './components/MapSelectorModal';
import { TileInspectDrawer } from './components/TileInspectDrawer';
import { getSuburbanResidence } from './lib/defaultMaps';
import { GridTile, HouseFloorPlan, RobotState, SearchAlgorithmType, VirtualControllerState } from './types/game';
import { sound } from './lib/sound';

export default function App() {
  // Shell view state: 'title' | 'playing'
  const [viewState, setViewState] = useState<'title' | 'playing'>('title');

  // Active Floor Plan & Grid State
  const [activeFloorplan, setActiveFloorplan] = useState<HouseFloorPlan>(() => getSuburbanResidence());
  const [grid, setGrid] = useState<GridTile[][]>(() => activeFloorplan.tiles);

  // Algorithm & Mode selection
  const [algorithm, setAlgorithm] = useState<SearchAlgorithmType>('astar');
  const [gameMode, setGameMode] = useState<'autonomous' | 'manual'>('autonomous');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Virtual on-screen controller inputs & actions
  const [virtualInput, setVirtualInput] = useState<VirtualControllerState>({
    up: false,
    down: false,
    left: false,
    right: false,
    turbo: false,
  });
  const [spotCleanCount, setSpotCleanCount] = useState<number>(0);
  const [dockCount, setDockCount] = useState<number>(0);

  // Overlays
  const [showFrontier, setShowFrontier] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isMapSelectOpen, setIsMapSelectOpen] = useState<boolean>(false);
  const [inspectedTile, setInspectedTile] = useState<GridTile | null>(null);

  // Telemetry updated continuously by 60fps canvas engine
  const [telemetry, setTelemetry] = useState({
    battery: 100,
    dustbin: 0,
    dirtCleaned: 0,
    totalDirt: 13,
    nodesExplored: 0,
    distanceTravelled: 0,
    status: 'idle' as RobotState['status'],
    activeTarget: null as { x: number; y: number } | null,
    actionReason: 'System initialized at docking station. Awaiting command.',
  });

  // Start game from title screen
  const handleStartGame = useCallback((chosenAlgo: SearchAlgorithmType, chosenMode: 'autonomous' | 'manual') => {
    setAlgorithm(chosenAlgo);
    setGameMode(chosenMode);
    setViewState('playing');
    setIsPaused(false);
  }, []);

  // Floor plan change
  const handleSelectMap = useCallback((newMap: HouseFloorPlan) => {
    setActiveFloorplan(newMap);
    // Deep clone tiles array
    const cloned = newMap.tiles.map((row) => row.map((t) => ({ ...t })));
    setGrid(cloned);
    setInspectedTile(null);
  }, []);

  // Reset current floorplan state
  const handleReset = useCallback(() => {
    const fresh = activeFloorplan.id === 'modern_studio'
      ? getSuburbanResidence() // or re-fetch active floorplan
      : getSuburbanResidence();
    const cloned = fresh.tiles.map((row) => row.map((t) => ({ ...t })));
    setGrid(cloned);
    setInspectedTile(null);
  }, [activeFloorplan]);

  // Add random dynamic coffee spill / pet tracks to test dynamic replanning
  const handleAddDynamicSpill = useCallback(() => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((t) => ({ ...t })));
      // Find a random walkable floor tile
      const validTiles: { x: number; y: number }[] = [];
      for (let y = 1; y < newGrid.length - 1; y++) {
        for (let x = 1; x < newGrid[0].length - 1; x++) {
          if (newGrid[y][x].type === 'floor' || newGrid[y][x].type === 'tile') {
            validTiles.push({ x, y });
          }
        }
      }

      if (validTiles.length > 0) {
        const pick = validTiles[Math.floor(Math.random() * validTiles.length)];
        newGrid[pick.y][pick.x].dirtLevel = 5;
        newGrid[pick.y][pick.x].dirtType = 'spill';
        newGrid[pick.y][pick.x].costMultiplier = 2.2;
        newGrid[pick.y][pick.x].isCleaned = false;
        sound.playBump();
      }
      return newGrid;
    });
  }, []);

  // Update specific tile from inspector drawer
  const handleModifyTile = useCallback((updated: GridTile) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((t) => ({ ...t })));
      next[updated.y][updated.x] = updated;
      return next;
    });
    setInspectedTile(updated);
  }, []);

  // Controller Handlers
  const handleVirtualInputChange = useCallback((partial: Partial<VirtualControllerState>) => {
    setVirtualInput((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleTriggerSpotClean = useCallback(() => {
    setSpotCleanCount((c) => c + 1);
  }, []);

  const handleTriggerDock = useCallback(() => {
    setDockCount((c) => c + 1);
  }, []);

  const handleToggleGameMode = useCallback(() => {
    setGameMode((m) => (m === 'autonomous' ? 'manual' : 'autonomous'));
  }, []);

  // Global key bindings
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isBenchmarkOpen) {
          setIsBenchmarkOpen(false);
        } else if (isMapSelectOpen) {
          setIsMapSelectOpen(false);
        } else if (inspectedTile) {
          setInspectedTile(null);
        } else if (viewState === 'playing') {
          setIsPaused((p) => !p);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [viewState, isBenchmarkOpen, isMapSelectOpen, inspectedTile]);

  return (
    <div className="w-screen h-screen bg-[#070b14] overflow-hidden select-none font-sans text-slate-100">
      {viewState === 'title' ? (
        <TitleScreen
          onStart={handleStartGame}
          onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        />
      ) : (
        <div className="relative w-full h-full">
          {/* Main 60fps Game Canvas */}
          <GameCanvas
            grid={grid}
            onGridChange={setGrid}
            dock={activeFloorplan.dock}
            algorithm={algorithm}
            gameMode={gameMode}
            simulationSpeed={simulationSpeed}
            isPaused={isPaused}
            onTelemetryUpdate={setTelemetry}
            showFrontier={showFrontier}
            showHeatmap={showHeatmap}
            virtualInput={virtualInput}
            spotCleanCount={spotCleanCount}
            dockCount={dockCount}
            onTileClick={(tile) => setInspectedTile(tile)}
          />

          {/* Low-Occlusion HUD Overlay */}
          <GameHUD
            algorithm={algorithm}
            onAlgorithmChange={setAlgorithm}
            gameMode={gameMode}
            onGameModeChange={setGameMode}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
            simulationSpeed={simulationSpeed}
            onSpeedChange={setSimulationSpeed}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(sound.toggleMute())}
            onReset={handleReset}
            onOpenBenchmark={() => setIsBenchmarkOpen(true)}
            onOpenMapSelect={() => setIsMapSelectOpen(true)}
            onAddSpill={handleAddDynamicSpill}
            showFrontier={showFrontier}
            onToggleFrontier={() => setShowFrontier((f) => !f)}
            telemetry={telemetry}
          />

          {/* Interactive On-Screen D-Pad Controller */}
          <OnScreenController
            virtualInput={virtualInput}
            onInputChange={handleVirtualInputChange}
            gameMode={gameMode}
            onToggleGameMode={handleToggleGameMode}
            onReturnToDock={handleTriggerDock}
            onSpotClean={handleTriggerSpotClean}
          />

          {/* Tile Inspection Drawer */}
          <TileInspectDrawer
            tile={inspectedTile}
            onClose={() => setInspectedTile(null)}
            onModifyTile={handleModifyTile}
          />
        </div>
      )}

      {/* Benchmark Analysis Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        grid={grid}
        dock={activeFloorplan.dock}
        onSelectAlgorithmAndRun={(selectedAlgo) => {
          setAlgorithm(selectedAlgo);
          if (viewState === 'title') {
            setViewState('playing');
          }
          setIsPaused(false);
        }}
      />

      {/* Map Selector Modal */}
      <MapSelectorModal
        isOpen={isMapSelectOpen}
        onClose={() => setIsMapSelectOpen(false)}
        activeMapId={activeFloorplan.id}
        onSelectMap={handleSelectMap}
      />
    </div>
  );
}
