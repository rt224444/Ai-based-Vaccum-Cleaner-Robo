import { GridTile, Point, SearchAlgorithmType, BenchmarkMetrics } from '../types/game';
import { runAStar, manhattanDistance, isWalkable, runBFS, runDFS, runUCS, runGreedyBestFirst } from './algorithms';

export interface AgentDecision {
  nextTarget: Point | null;
  reason: string;
  isEmergencyDocking: boolean;
  targetUtilityScore?: number;
}

// Room priority weights for utility agent
export const ROOM_PRIORITY_WEIGHTS: Record<string, number> = {
  kitchen: 1.4, // Kitchen has food/crumb hygiene priority
  living: 1.2,
  bedroom: 1.0,
  hallway: 0.9,
  bathroom: 1.3,
  office: 0.8,
};

// Check if a point is reachable using BFS connectivity
export function isReachable(grid: GridTile[][], start: Point, target: Point): boolean {
  if (!isWalkable(grid[target.y]?.[target.x])) return false;
  const res = runBFS(grid, start, target);
  return res.success;
}

// 1. Goal-Based Intelligent Agent
// - Maintains goal hierarchy:
//   Goal 1: If battery <= safeReturnThreshold (distance to dock + margin), goal = DOCK.
//   Goal 2: Clean nearest uncleaned reachable dirt tile.
//   Goal 3: When all reachable dirt is clean, goal = RETURN TO DOCK & COMPLETE.
export function decideGoalBasedTarget(
  grid: GridTile[][],
  currentPos: Point,
  dockPos: Point,
  battery: number,
  batteryCapacity: number = 100
): AgentDecision {
  // 1. Calculate path and cost to dock
  const pathToDock = runAStar(grid, currentPos, dockPos);
  const dockDist = pathToDock.success ? pathToDock.pathLength : manhattanDistance(currentPos, dockPos);
  const batteryNeededForDock = (dockDist * 0.9) + 8; // 8% safety margin

  // Low battery safety return
  if (battery <= batteryNeededForDock && !(currentPos.x === dockPos.x && currentPos.y === dockPos.y)) {
    return {
      nextTarget: dockPos,
      reason: `Low Battery Emergency (${battery.toFixed(0)}% remaining). Need ${batteryNeededForDock.toFixed(0)}% to reach Dock. Returning to recharge.`,
      isEmergencyDocking: true,
    };
  }

  // 2. Scan all dirty tiles in the house
  const dirtyTiles: Array<{ pos: Point; dirt: number; dist: number }> = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const tile = grid[y][x];
      if (tile.dirtLevel > 0 && !tile.isCleaned && isWalkable(tile)) {
        dirtyTiles.push({
          pos: { x, y },
          dirt: tile.dirtLevel,
          dist: manhattanDistance(currentPos, { x, y }),
        });
      }
    }
  }

  if (dirtyTiles.length === 0) {
    // Mission completed: return to dock
    return {
      nextTarget: dockPos,
      reason: 'All dirty areas successfully cleaned! Returning to charging dock.',
      isEmergencyDocking: false,
    };
  }

  // Sort dirty tiles by distance (Goal-based selects nearest dirty reachable target)
  dirtyTiles.sort((a, b) => a.dist - b.dist);

  for (const candidate of dirtyTiles) {
    // Check if path to candidate exists
    const path = runAStar(grid, currentPos, candidate.pos);
    if (path.success) {
      // Check if candidate leaves enough battery to also reach dock afterwards
      const pathToDockFromCand = runAStar(grid, candidate.pos, dockPos);
      const neededAfter = path.batteryEstimatedCost + pathToDockFromCand.batteryEstimatedCost + 6;
      if (battery >= neededAfter || battery >= batteryCapacity * 0.7) {
        return {
          nextTarget: candidate.pos,
          reason: `Targeting nearest dirty spot at (${candidate.pos.x}, ${candidate.pos.y}) [Dirt Lvl ${candidate.dirt}].`,
          isEmergencyDocking: false,
        };
      }
    }
  }

  // If no safe dirt tile is reachable within battery limits, return to dock
  return {
    nextTarget: dockPos,
    reason: 'Cannot safely clean remaining dirt with current battery budget. Docking to recharge first.',
    isEmergencyDocking: true,
  };
}

// 2. Utility-Based Intelligent Agent
// - Calculates multi-attribute utility score U(Target) =
//   + w_dirt * (dirtLevel * dirtTypeMultiplier)
//   - w_dist * pathCost
//   + w_room * roomHygieneWeight
//   - w_battery * (batteryDrain / currentBattery)
//   - w_risk * riskOfStrandingNearDock
export function decideUtilityBasedTarget(
  grid: GridTile[][],
  currentPos: Point,
  dockPos: Point,
  battery: number
): AgentDecision {
  // Emergency dock threshold
  const pathToDock = runAStar(grid, currentPos, dockPos);
  const batteryToDock = pathToDock.success ? pathToDock.batteryEstimatedCost : manhattanDistance(currentPos, dockPos) * 1.0;
  const safetyReserve = 10;

  if (battery <= batteryToDock + safetyReserve && !(currentPos.x === dockPos.x && currentPos.y === dockPos.y)) {
    return {
      nextTarget: dockPos,
      reason: `Utility warning: High risk of stranding! Battery ${battery.toFixed(0)}% <= reserve ${Math.round(batteryToDock + safetyReserve)}%. Docking immediately.`,
      isEmergencyDocking: true,
      targetUtilityScore: 1000,
    };
  }

  // Candidate evaluation
  const candidates: Array<{ pos: Point; score: number; reason: string }> = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const tile = grid[y][x];
      if (tile.dirtLevel > 0 && !tile.isCleaned && isWalkable(tile)) {
        const path = runAStar(grid, currentPos, { x, y });
        if (!path.success) continue;

        // Check return ability from that point to dock
        const returnPath = runAStar(grid, { x, y }, dockPos);
        const totalTripBattery = path.batteryEstimatedCost + (returnPath.success ? returnPath.batteryEstimatedCost : 20);

        if (battery < totalTripBattery + 4) {
          // Dangerous to visit
          continue;
        }

        // Compute Utility Attributes
        const dirtWeight = tile.dirtLevel * 18; // higher dirt = higher reward
        const dirtTypeBonus = tile.dirtType === 'spill' ? 12 : tile.dirtType === 'mud' ? 10 : 0;
        const roomPriority = (ROOM_PRIORITY_WEIGHTS[tile.room] || 1.0) * 15;
        const travelPenalty = path.pathCost * 2.8;
        const batteryPenalty = (path.batteryEstimatedCost / Math.max(battery, 1)) * 40;

        const utility = dirtWeight + dirtTypeBonus + roomPriority - travelPenalty - batteryPenalty;

        candidates.push({
          pos: { x, y },
          score: utility,
          reason: `High utility (${utility.toFixed(1)}): ${tile.room.toUpperCase()} dirt lvl ${tile.dirtLevel}, cost ${path.pathCost.toFixed(1)}`,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return {
      nextTarget: dockPos,
      reason: 'No remaining reachable dirty areas. Returning to dock with mission accomplished.',
      isEmergencyDocking: false,
      targetUtilityScore: 0,
    };
  }

  // Pick highest utility score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    nextTarget: best.pos,
    reason: best.reason,
    isEmergencyDocking: false,
    targetUtilityScore: best.score,
  };
}

// 3. Algorithm & Agent Benchmark Suite
export function runAlgorithmBenchmark(
  grid: GridTile[][],
  start: Point,
  targets: Point[],
  dock: Point
): BenchmarkMetrics[] {
  if (targets.length === 0) return [];
  const primaryTarget = targets[0];

  const algorithmsToTest: Array<{
    type: SearchAlgorithmType;
    name: string;
    category: 'Uninformed Search' | 'Informed Search' | 'Intelligent Agent';
  }> = [
    { type: 'bfs', name: 'Breadth-First Search (BFS)', category: 'Uninformed Search' },
    { type: 'dfs', name: 'Depth-First Search (DFS)', category: 'Uninformed Search' },
    { type: 'ucs', name: 'Uniform Cost Search (UCS)', category: 'Uninformed Search' },
    { type: 'greedy', name: 'Greedy Best-First Search', category: 'Informed Search' },
    { type: 'astar', name: 'A* Search (A-Star)', category: 'Informed Search' },
    { type: 'goal_agent', name: 'Goal-Based Intelligent Agent', category: 'Intelligent Agent' },
    { type: 'utility_agent', name: 'Utility-Based Intelligent Agent', category: 'Intelligent Agent' },
  ];

  const results: BenchmarkMetrics[] = [];

  for (const algo of algorithmsToTest) {
    let result;
    if (algo.type === 'bfs') result = runBFS(grid, start, primaryTarget);
    else if (algo.type === 'dfs') result = runDFS(grid, start, primaryTarget);
    else if (algo.type === 'ucs') result = runUCS(grid, start, primaryTarget);
    else if (algo.type === 'greedy') result = runGreedyBestFirst(grid, start, primaryTarget);
    else result = runAStar(grid, start, primaryTarget);

    let optimality = 'Optimal';
    if (algo.type === 'dfs') optimality = 'Suboptimal (Deep bias)';
    else if (algo.type === 'greedy') optimality = 'Heuristic Greedy (Non-optimal)';
    else if (algo.type === 'bfs') optimality = 'Hop-Optimal (ignores terrain cost)';
    else if (algo.type === 'ucs') optimality = 'Cost-Optimal (terrain weighted)';
    else if (algo.type === 'astar') optimality = 'Guaranteed Optimal (A*)';
    else optimality = 'Autonomous Goal/Utility Balanced';

    results.push({
      algorithm: algo.type,
      displayName: algo.name,
      category: algo.category,
      nodesExplored: result.nodesExplored,
      pathLength: result.pathLength,
      totalCost: parseFloat(result.pathCost.toFixed(1)),
      batteryConsumed: parseFloat(result.batteryEstimatedCost.toFixed(1)),
      cleaningTimeSeconds: parseFloat(((result.pathLength * 0.4) + 1.2).toFixed(1)),
      dirtCleaned: targets.length,
      executionTimeMs: parseFloat(result.executionTimeMs.toFixed(2)),
      success: result.success,
      optimalityRating: optimality,
    });
  }

  return results;
}
