import React, { useEffect, useRef, useState } from 'react';
import { GridTile, Point, RobotState, SearchAlgorithmType, SearchResult, DynamicHazard } from '../types/game';
import { executeSearch, isWalkable } from '../lib/algorithms';
import { decideGoalBasedTarget, decideUtilityBasedTarget } from '../lib/agents';
import { sound } from '../lib/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  type: 'dust' | 'sparkle' | 'spark' | 'ring';
}

interface GameCanvasProps {
  grid: GridTile[][];
  onGridChange: (newGrid: GridTile[][]) => void;
  dock: Point;
  algorithm: SearchAlgorithmType;
  gameMode: 'autonomous' | 'manual';
  simulationSpeed: number; // 1, 2, 5, 10
  isPaused: boolean;
  onTelemetryUpdate: (stats: {
    battery: number;
    dustbin: number;
    dirtCleaned: number;
    totalDirt: number;
    nodesExplored: number;
    distanceTravelled: number;
    status: RobotState['status'];
    activeTarget: Point | null;
    actionReason: string;
  }) => void;
  showFrontier: boolean;
  showHeatmap: boolean;
  virtualInput?: { up: boolean; down: boolean; left: boolean; right: boolean; turbo: boolean };
  spotCleanCount?: number;
  dockCount?: number;
  onManualDrive?: () => void;
  onTileClick?: (tile: GridTile) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  grid,
  onGridChange,
  dock,
  algorithm,
  gameMode,
  simulationSpeed,
  isPaused,
  onTelemetryUpdate,
  showFrontier,
  showHeatmap,
  virtualInput,
  spotCleanCount = 0,
  dockCount = 0,
  onTileClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent simulation state in refs to guarantee 60fps without React re-render lag
  const gridRef = useRef<GridTile[][]>(grid);
  const dockRef = useRef<Point>(dock);
  const algorithmRef = useRef<SearchAlgorithmType>(algorithm);
  const gameModeRef = useRef<'autonomous' | 'manual'>(gameMode);
  const speedRef = useRef<number>(simulationSpeed);
  const isPausedRef = useRef<boolean>(isPaused);
  const virtualInputRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean; turbo: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
    turbo: false,
  });

  // Sync refs when props change
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    dockRef.current = dock;
  }, [dock]);

  useEffect(() => {
    algorithmRef.current = algorithm;
  }, [algorithm]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    speedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (virtualInput) {
      virtualInputRef.current = virtualInput;
    }
  }, [virtualInput]);

  const lastSpotCleanRef = useRef(spotCleanCount);
  useEffect(() => {
    if (spotCleanCount > lastSpotCleanRef.current) {
      lastSpotCleanRef.current = spotCleanCount;
      const curGrid = gridRef.current;
      const robot = robotRef.current;
      const tile = curGrid[robot.gridY]?.[robot.gridX];
      if (tile && tile.dirtLevel > 0) {
        tile.dirtLevel = 0;
        tile.isCleaned = true;
        dirtCleanedRef.current += 1;
        robot.dustbin = Math.min(100, robot.dustbin + 10);
        sound.playDirtPickup(3);
      }
    }
  }, [spotCleanCount]);

  const lastDockRef = useRef(dockCount);
  useEffect(() => {
    if (dockCount > lastDockRef.current) {
      lastDockRef.current = dockCount;
      const curGrid = gridRef.current;
      const robot = robotRef.current;
      const currentPos: Point = { x: robot.gridX, y: robot.gridY };
      const search = executeSearch('astar', curGrid, currentPos, dockRef.current);
      searchResultRef.current = search;
      activePathRef.current = search.foundPath;
      pathIndexRef.current = 1;
      currentTargetRef.current = dockRef.current;
      robot.status = 'returning_to_dock';
      actionReasonRef.current = 'Emergency user command: Returning to charging dock.';
    }
  }, [dockCount]);

  // Robot state
  const robotRef = useRef<RobotState>({
    x: dock.x + 0.5,
    y: dock.y + 0.5,
    gridX: dock.x,
    gridY: dock.y,
    heading: 0,
    battery: 100,
    maxBattery: 100,
    dustbin: 0,
    dustbinCapacity: 100,
    speed: 3.2,
    isMoving: false,
    isCleaning: false,
    isDocked: true,
    status: 'idle',
    brushAngle: 0,
  });

  // Current path and search state
  const searchResultRef = useRef<SearchResult | null>(null);
  const activePathRef = useRef<Point[]>([]);
  const pathIndexRef = useRef<number>(0);
  const currentTargetRef = useRef<Point | null>(null);
  const actionReasonRef = useRef<string>('System initialized. Ready at docking station.');
  const distanceTravelledRef = useRef<number>(0);
  const dirtCleanedRef = useRef<number>(0);
  const nodesExploredCountRef = useRef<number>(0);

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Dynamic Hazard (Pet cat)
  const petRef = useRef<DynamicHazard>({
    id: 'pet_cat',
    type: 'cat',
    x: dock.x + 5,
    y: dock.y + 2,
    targetX: dock.x + 5,
    targetY: dock.y + 2,
    speed: 1.8,
    pauseTimer: 2.0,
    color: '#f97316',
  });

  // Manual control keys
  const keysDownRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
    };
    const handleBlur = () => {
      keysDownRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main 60fps simulation and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let tickAccumulator = 0;
    let telemetryThrottleTimer = 0;

    const spawnParticles = (x: number, y: number, type: 'dust' | 'sparkle' | 'spark' | 'ring', count: number = 5) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        let color = '#94a3b8';
        if (type === 'sparkle') color = '#38bdf8';
        if (type === 'spark') color = '#10b981';
        if (type === 'dust') color = '#cbd5e1';

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1.0,
          size: type === 'ring' ? 8 : 2 + Math.random() * 3,
          color,
          type,
        });
      }
    };

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // Clamp delta time to avoid huge teleport jumps on lag spike
      const dt = Math.min(rawDt, 0.05);

      const width = canvas.width;
      const height = canvas.height;
      const currentGrid = gridRef.current;
      const gridH = currentGrid.length;
      const gridW = currentGrid[0]?.length || 1;

      // Fit scale
      const tileSize = Math.min((width - 40) / gridW, (height - 40) / gridH);
      const offsetX = (width - gridW * tileSize) / 2;
      const offsetY = (height - gridH * tileSize) / 2;

      // SIMULATION UPDATE (when not paused)
      if (!isPausedRef.current) {
        const effectiveDt = dt * speedRef.current;
        tickAccumulator += effectiveDt;

        const robot = robotRef.current;

        // Animate side brushes
        robot.brushAngle += effectiveDt * 18;

        // UPDATE DYNAMIC HAZARD (Playful Pet)
        const pet = petRef.current;
        pet.pauseTimer -= effectiveDt;
        if (pet.pauseTimer <= 0) {
          // Pick new random walkable room tile
          const candidates: Point[] = [];
          for (let py = 1; py < gridH - 1; py++) {
            for (let px = 1; px < gridW - 1; px++) {
              if (isWalkable(currentGrid[py][px])) candidates.push({ x: px + 0.5, y: py + 0.5 });
            }
          }
          if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            pet.targetX = pick.x;
            pet.targetY = pick.y;
            pet.pauseTimer = 3.5 + Math.random() * 4.0;
          }
        }
        // Move pet toward target
        const petDx = pet.targetX - pet.x;
        const petDy = pet.targetY - pet.y;
        const petDist = Math.hypot(petDx, petDy);
        if (petDist > 0.05) {
          const moveStep = Math.min(pet.speed * effectiveDt, petDist);
          pet.x += (petDx / petDist) * moveStep;
          pet.y += (petDy / petDist) * moveStep;
        }

        // --- MANUAL DRIVE MODE ---
        if (gameModeRef.current === 'manual') {
          const keys = keysDownRef.current;
          const vInput = virtualInputRef.current;
          let moveX = 0;
          let moveY = 0;
          if (keys['w'] || keys['arrowup'] || vInput.up) moveY -= 1;
          if (keys['s'] || keys['arrowdown'] || vInput.down) moveY += 1;
          if (keys['a'] || keys['arrowleft'] || vInput.left) moveX -= 1;
          if (keys['d'] || keys['arrowright'] || vInput.right) moveX += 1;

          if (moveX !== 0 || moveY !== 0) {
            const length = Math.hypot(moveX, moveY);
            const normX = moveX / length;
            const normY = moveY / length;
            robot.heading = Math.atan2(normY, normX);

            const isTurbo = keys['shift'] || vInput.turbo;
            const driveSpeed = isTurbo ? robot.speed * 1.85 : robot.speed;
            const stepDist = driveSpeed * effectiveDt;
            const nextX = robot.x + normX * stepDist;
            const nextY = robot.y + normY * stepDist;

            // Check collision with walls / furniture
            const nextGridX = Math.floor(nextX);
            const nextGridY = Math.floor(nextY);

            if (isWalkable(currentGrid[nextGridY]?.[nextGridX])) {
              robot.x = nextX;
              robot.y = nextY;
              robot.gridX = nextGridX;
              robot.gridY = nextGridY;
              robot.isMoving = true;
              distanceTravelledRef.current += stepDist;

              // Battery consumption
              const terrainMult = currentGrid[nextGridY]?.[nextGridX]?.costMultiplier || 1.0;
              robot.battery = Math.max(0, robot.battery - 0.4 * terrainMult * effectiveDt);

              // Auto-clean current tile
              const curTile = currentGrid[nextGridY]?.[nextGridX];
              if (curTile && curTile.dirtLevel > 0) {
                curTile.dirtLevel = Math.max(0, curTile.dirtLevel - effectiveDt * 3.5);
                if (curTile.dirtLevel === 0 && !curTile.isCleaned) {
                  curTile.isCleaned = true;
                  dirtCleanedRef.current += 1;
                  robot.dustbin = Math.min(100, robot.dustbin + 5);
                  sound.playDirtPickup(1);
                  spawnParticles((nextGridX + 0.5) * tileSize + offsetX, (nextGridY + 0.5) * tileSize + offsetY, 'sparkle', 6);
                }
              }
            } else {
              sound.playBump();
            }
          } else {
            robot.isMoving = false;
          }

          // Dock check
          if (Math.hypot(robot.x - (dockRef.current.x + 0.5), robot.y - (dockRef.current.y + 0.5)) < 0.6) {
            robot.isDocked = true;
            robot.battery = Math.min(100, robot.battery + 20 * effectiveDt);
            robot.status = 'recharging';
            if (robot.battery >= 99.8) {
              robot.status = 'idle';
              robot.dustbin = 0; // auto-empty dustbin on full charge
            }
          } else {
            robot.isDocked = false;
            robot.status = robot.battery <= 15 ? 'out_of_battery' : 'cleaning';
          }
        }

        // --- AUTONOMOUS AGENT MODE ---
        else {
          // If out of battery, shut down
          if (robot.battery <= 0.05) {
            robot.status = 'out_of_battery';
            robot.isMoving = false;
            actionReasonRef.current = 'Emergency: Battery Depleted! Robot stranded.';
          }
          // If docked and charging
          else if (robot.isDocked && robot.battery < 99.5) {
            robot.status = 'recharging';
            robot.battery = Math.min(100, robot.battery + 18 * effectiveDt);
            actionReasonRef.current = `Recharging at dock station (${robot.battery.toFixed(0)}%)...`;
            spawnParticles((dockRef.current.x + 0.5) * tileSize + offsetX, (dockRef.current.y + 0.5) * tileSize + offsetY, 'spark', 1);

            if (robot.battery >= 99.5) {
              sound.playDockingChime();
              robot.dustbin = 0; // Empty bin
              actionReasonRef.current = 'Battery fully recharged (100%). Ready to resume cleaning.';
            }
          }
          // Autonomous Path Following or Re-planning
          else {
            // Check if we need a new target or path
            if (!currentTargetRef.current || activePathRef.current.length === 0 || pathIndexRef.current >= activePathRef.current.length) {
              const currentPos: Point = { x: robot.gridX, y: robot.gridY };
              let decision;

              if (algorithmRef.current === 'utility_agent') {
                decision = decideUtilityBasedTarget(currentGrid, currentPos, dockRef.current, robot.battery);
              } else {
                // Goal-based or standard search algorithms
                decision = decideGoalBasedTarget(currentGrid, currentPos, dockRef.current, robot.battery);
              }

              actionReasonRef.current = decision.reason;

              if (decision.nextTarget) {
                currentTargetRef.current = decision.nextTarget;
                // Plan path using selected algorithm
                const search = executeSearch(
                  algorithmRef.current,
                  currentGrid,
                  currentPos,
                  decision.nextTarget
                );

                searchResultRef.current = search;
                nodesExploredCountRef.current += search.nodesExplored;
                activePathRef.current = search.foundPath;
                pathIndexRef.current = 1; // start from first next step

                if (search.success) {
                  robot.status = decision.isEmergencyDocking ? 'returning_to_dock' : 'cleaning';
                  sound.playNodeStep();
                } else {
                  robot.status = 'stuck';
                  actionReasonRef.current = `Pathfinding failed to reach target (${decision.nextTarget.x}, ${decision.nextTarget.y}). Blocked.`;
                }
              } else {
                robot.status = 'mission_complete';
                actionReasonRef.current = 'Mission Accomplished! All reachable rooms pristine clean.';
              }
            }

            // Follow active path nodes
            if (activePathRef.current.length > 0 && pathIndexRef.current < activePathRef.current.length) {
              const nextWaypoint = activePathRef.current[pathIndexRef.current];
              const targetPixelX = nextWaypoint.x + 0.5;
              const targetPixelY = nextWaypoint.y + 0.5;

              const dx = targetPixelX - robot.x;
              const dy = targetPixelY - robot.y;
              const dist = Math.hypot(dx, dy);

              // Check if path is currently blocked by pet
              const petDist = Math.hypot(pet.x - targetPixelX, pet.y - targetPixelY);
              if (petDist < 0.6) {
                // Dynamic obstacle detected! Reroute!
                actionReasonRef.current = 'Pet hazard blocking path! Recalculating path around obstacle...';
                const currentPos: Point = { x: robot.gridX, y: robot.gridY };
                if (currentTargetRef.current) {
                  const rerouted = executeSearch(algorithmRef.current, currentGrid, currentPos, currentTargetRef.current);
                  searchResultRef.current = rerouted;
                  activePathRef.current = rerouted.foundPath;
                  pathIndexRef.current = 1;
                }
              }

              if (dist < 0.08) {
                // Arrived at waypoint
                robot.x = targetPixelX;
                robot.y = targetPixelY;
                robot.gridX = nextWaypoint.x;
                robot.gridY = nextWaypoint.y;
                pathIndexRef.current += 1;

                // Clean tile if dirty
                const tile = currentGrid[nextWaypoint.y]?.[nextWaypoint.x];
                if (tile && tile.dirtLevel > 0) {
                  tile.dirtLevel = Math.max(0, tile.dirtLevel - 1.5);
                  if (tile.dirtLevel === 0 && !tile.isCleaned) {
                    tile.isCleaned = true;
                    dirtCleanedRef.current += 1;
                    robot.dustbin = Math.min(100, robot.dustbin + 4);
                    sound.playDirtPickup(tile.dirtLevel);
                    spawnParticles(targetPixelX * tileSize + offsetX, targetPixelY * tileSize + offsetY, 'sparkle', 8);
                  }
                }

                // Check if arrived at dock
                if (nextWaypoint.x === dockRef.current.x && nextWaypoint.y === dockRef.current.y) {
                  robot.isDocked = true;
                  sound.playDockingChime();
                  currentTargetRef.current = null;
                } else {
                  robot.isDocked = false;
                }
              } else {
                // Move toward waypoint
                const normX = dx / dist;
                const normY = dy / dist;
                robot.heading = Math.atan2(normY, normX);

                const step = Math.min(robot.speed * effectiveDt, dist);
                robot.x += normX * step;
                robot.y += normY * step;
                robot.isMoving = true;
                distanceTravelledRef.current += step;

                // Battery drainage
                const tile = currentGrid[robot.gridY]?.[robot.gridX];
                const terrainCost = tile?.costMultiplier || 1.0;
                robot.battery = Math.max(0, robot.battery - (0.45 * terrainCost * effectiveDt));

                // Spawn vacuum suction dust trail
                if (Math.random() < 0.25) {
                  spawnParticles(robot.x * tileSize + offsetX, robot.y * tileSize + offsetY, 'dust', 1);
                }
              }
            }
          }
        }

        // UPDATE PARTICLES
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= effectiveDt * 2.2;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Throttle Telemetry update to React (every 100ms)
        telemetryThrottleTimer += dt;
        if (telemetryThrottleTimer > 0.1) {
          telemetryThrottleTimer = 0;
          let totalDirtCount = 0;
          for (const row of currentGrid) {
            for (const t of row) {
              if (t.dirtLevel > 0) totalDirtCount++;
            }
          }

          onTelemetryUpdate({
            battery: Math.round(robot.battery),
            dustbin: Math.round(robot.dustbin),
            dirtCleaned: dirtCleanedRef.current,
            totalDirt: totalDirtCount,
            nodesExplored: nodesExploredCountRef.current,
            distanceTravelled: parseFloat(distanceTravelledRef.current.toFixed(1)),
            status: robot.status,
            activeTarget: currentTargetRef.current,
            actionReason: actionReasonRef.current,
          });
        }
      }

      // -------------------------------------------------------------
      // RENDERING CANVAS (High visual polish, blueprint floorplan)
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // Floor background (clean slate dark/charcoal design)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Render House Grid Tiles
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          const tile = currentGrid[y][x];
          const px = offsetX + x * tileSize;
          const py = offsetY + y * tileSize;

          // Base tile colors depending on room & type
          if (tile.type === 'wall') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, tileSize, tileSize);
            // Wall inner bevel border
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
          } else if (tile.type === 'door') {
            // Doorway
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, tileSize, tileSize);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
          } else {
            // Floor tiles by type
            if (tile.type === 'carpet') {
              ctx.fillStyle = '#1e1b4b'; // soft indigo carpet
              ctx.fillRect(px, py, tileSize, tileSize);
              // subtle carpet weave
              ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + tileSize, py + tileSize);
              ctx.stroke();
            } else if (tile.type === 'tile') {
              ctx.fillStyle = '#0f2937'; // kitchen/bath ceramic tile
              ctx.fillRect(px, py, tileSize, tileSize);
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, tileSize, tileSize);
            } else if (tile.type === 'puddle') {
              ctx.fillStyle = '#0c4a6e'; // liquid puddle
              ctx.fillRect(px, py, tileSize, tileSize);
              ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
              ctx.beginPath();
              ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.38, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Standard hardwood floor
              ctx.fillStyle = '#111827';
              ctx.fillRect(px, py, tileSize, tileSize);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
              ctx.strokeRect(px, py, tileSize, tileSize);
            }

            // Furniture rendering
            if (tile.type === 'furniture') {
              ctx.fillStyle = '#334155';
              ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

              // Furniture Icon / Glyph
              ctx.fillStyle = '#94a3b8';
              ctx.font = `${Math.floor(tileSize * 0.32)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              let glyph = '🛋️';
              if (tile.furnitureType === 'bed') glyph = '🛏️';
              if (tile.furnitureType === 'table') glyph = '🪑';
              if (tile.furnitureType === 'plant') glyph = '🪴';
              if (tile.furnitureType === 'tv_stand') glyph = '📺';
              ctx.fillText(glyph, px + tileSize / 2, py + tileSize / 2);
            }

            // Charging Dock rendering
            if (tile.type === 'dock') {
              ctx.fillStyle = '#064e3b';
              ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2;
              ctx.strokeRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

              // Pulsing power pad
              ctx.fillStyle = '#34d399';
              ctx.beginPath();
              ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.28, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${Math.floor(tileSize * 0.35)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('⚡', px + tileSize / 2, py + tileSize / 2);
            }

            // Dirt rendering (crumbs, dust bunnies, spills)
            if (tile.dirtLevel > 0) {
              const dirtRatio = tile.dirtLevel / 5;
              ctx.save();
              if (tile.dirtType === 'spill') {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.35 * dirtRatio, 0, Math.PI * 2);
                ctx.fill();
              } else if (tile.dirtType === 'mud') {
                ctx.fillStyle = 'rgba(180, 83, 9, 0.55)';
                ctx.beginPath();
                ctx.ellipse(px + tileSize / 2, py + tileSize / 2, tileSize * 0.3, tileSize * 0.2, 0.3, 0, Math.PI * 2);
                ctx.fill();
              } else {
                // Specks of crumbs/dust
                ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
                const speckCount = Math.floor(tile.dirtLevel * 3);
                for (let s = 0; s < speckCount; s++) {
                  const sx = px + tileSize * (0.2 + ((s * 27) % 60) / 100);
                  const sy = py + tileSize * (0.2 + ((s * 39) % 60) / 100);
                  ctx.beginPath();
                  ctx.arc(sx, sy, 1.5 + (s % 2), 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              ctx.restore();
            }
          }
        }
      }

      // -------------------------------------------------------------
      // FRONTIER & EXPLORED SEARCH NODES OVERLAY
      // -------------------------------------------------------------
      if (showFrontier && searchResultRef.current) {
        const result = searchResultRef.current;
        // Explored nodes
        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        for (const pt of result.exploredOrder) {
          const px = offsetX + pt.x * tileSize;
          const py = offsetY + pt.y * tileSize;
          ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        }

        // Draw Computed Planned Path
        if (result.foundPath.length > 1) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          result.foundPath.forEach((pt, idx) => {
            const px = offsetX + (pt.x + 0.5) * tileSize;
            const py = offsetY + (pt.y + 0.5) * tileSize;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Target marker
        if (currentTargetRef.current) {
          const tx = offsetX + (currentTargetRef.current.x + 0.5) * tileSize;
          const ty = offsetY + (currentTargetRef.current.y + 0.5) * tileSize;
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(tx, ty, tileSize * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // RENDER DYNAMIC HAZARD (PET CAT)
      // -------------------------------------------------------------
      const pet = petRef.current;
      const petPx = offsetX + pet.x * tileSize;
      const petPy = offsetY + pet.y * tileSize;

      ctx.save();
      ctx.translate(petPx, petPy);
      // Cat shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 4, tileSize * 0.28, tileSize * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cat body
      ctx.fillStyle = pet.color;
      ctx.beginPath();
      ctx.arc(0, 0, tileSize * 0.26, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(-tileSize * 0.2, -tileSize * 0.2);
      ctx.lineTo(-tileSize * 0.1, -tileSize * 0.38);
      ctx.lineTo(0, -tileSize * 0.2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -tileSize * 0.2);
      ctx.lineTo(tileSize * 0.1, -tileSize * 0.38);
      ctx.lineTo(tileSize * 0.2, -tileSize * 0.2);
      ctx.fill();

      // Cute eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-tileSize * 0.08, -tileSize * 0.04, 2.5, 0, Math.PI * 2);
      ctx.arc(tileSize * 0.08, -tileSize * 0.04, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-tileSize * 0.08, -tileSize * 0.04, 1.2, 0, Math.PI * 2);
      ctx.arc(tileSize * 0.08, -tileSize * 0.04, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // -------------------------------------------------------------
      // RENDER ROBOT VACUUM CLEANER
      // -------------------------------------------------------------
      const robot = robotRef.current;
      const rPx = offsetX + robot.x * tileSize;
      const rPy = offsetY + robot.y * tileSize;
      const rRadius = tileSize * 0.42;

      ctx.save();
      ctx.translate(rPx, rPy);
      ctx.rotate(robot.heading);

      // Dropped chassis shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.arc(2, 3, rRadius, 0, Math.PI * 2);
      ctx.fill();

      // Spinning Side Sweeper Brushes (left and right)
      [-rRadius * 0.85, rRadius * 0.85].forEach((yOffset) => {
        ctx.save();
        ctx.translate(rRadius * 0.5, yOffset);
        ctx.rotate(robot.brushAngle * (yOffset > 0 ? 1 : -1));
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        for (let b = 0; b < 3; b++) {
          const bAngle = (b * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(bAngle) * (tileSize * 0.25), Math.sin(bAngle) * (tileSize * 0.25));
          ctx.stroke();
        }
        ctx.restore();
      });

      // Main circular chassis
      const chassisGrad = ctx.createRadialGradient(0, 0, rRadius * 0.2, 0, 0, rRadius);
      chassisGrad.addColorStop(0, '#334155');
      chassisGrad.addColorStop(0.85, '#1e293b');
      chassisGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = chassisGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Bumper Ring
      ctx.strokeStyle = robot.isDocked ? '#10b981' : robot.battery < 20 ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Front directional laser LiDAR turret
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(rRadius * 0.35, 0, rRadius * 0.24, 0, Math.PI * 2);
      ctx.fill();

      // Heading arrow on front
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(rRadius * 0.7, 0);
      ctx.lineTo(rRadius * 0.45, -4);
      ctx.lineTo(rRadius * 0.45, 4);
      ctx.closePath();
      ctx.fill();

      // Status LED indicator dot
      ctx.fillStyle = robot.isDocked ? '#34d399' : robot.battery < 20 ? '#ef4444' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(-rRadius * 0.2, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // LiDAR scanning cone effect in front of robot
      if (robot.isMoving && !robot.isDocked) {
        ctx.save();
        ctx.translate(rPx, rPy);
        ctx.rotate(robot.heading);
        const coneGrad = ctx.createRadialGradient(0, 0, rRadius, 0, 0, tileSize * 2);
        coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
        coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, tileSize * 2, -Math.PI / 6, Math.PI / 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // RENDER PARTICLES
      // -------------------------------------------------------------
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Handle canvas clicks (inspect tile, trigger spot clean, or toggle wall in manual mode)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const currentGrid = gridRef.current;
    const gridH = currentGrid.length;
    const gridW = currentGrid[0]?.length || 1;

    const tileSize = Math.min((width - 40) / gridW, (height - 40) / gridH);
    const offsetX = (width - gridW * tileSize) / 2;
    const offsetY = (height - gridH * tileSize) / 2;

    const gx = Math.floor((clickX - offsetX) / tileSize);
    const gy = Math.floor((clickY - offsetY) / tileSize);

    if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
      const tile = currentGrid[gy][gx];
      if (onTileClick) {
        onTileClick(tile);
      }
      if (isWalkable(tile)) {
        const currentPos: Point = { x: robotRef.current.gridX, y: robotRef.current.gridY };
        const search = executeSearch(algorithmRef.current, currentGrid, currentPos, { x: gx, y: gy });
        if (search.success) {
          currentTargetRef.current = { x: gx, y: gy };
          searchResultRef.current = search;
          activePathRef.current = search.foundPath;
          pathIndexRef.current = 1;
          robotRef.current.status = tile.type === 'dock' ? 'returning_to_dock' : 'cleaning';
          actionReasonRef.current = `User targeted (${gx}, ${gy}) via ${algorithmRef.current.toUpperCase()}.`;
          sound.playNodeStep();
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1280}
        height={760}
        onClick={handleCanvasClick}
        className="max-w-full max-h-full object-contain cursor-crosshair rounded-lg shadow-2xl"
      />
    </div>
  );
};
