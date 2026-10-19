import { GridTile, Point, SearchAlgorithmType, SearchResult } from '../types/game';

// Helper to check valid walkable neighbor
export function isWalkable(tile: GridTile | undefined): boolean {
  if (!tile) return false;
  return tile.type !== 'wall' && tile.type !== 'furniture';
}

// Distance heuristics
export function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function euclideanDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 4-directional moves (Up, Right, Down, Left)
export const DIRECTIONS = [
  { dx: 0, dy: -1, name: 'North' },
  { dx: 1, dy: 0, name: 'East' },
  { dx: 0, dy: 1, name: 'South' },
  { dx: -1, dy: 0, name: 'West' },
];

export interface AlgorithmStepState {
  current: Point | null;
  frontier: Point[];
  visited: Set<string>;
  path: Point[];
  isDone: boolean;
  success: boolean;
}

// Reconstruct path from cameFrom map
function reconstructPath(cameFrom: Map<string, Point>, current: Point): Point[] {
  const path: Point[] = [current];
  let currKey = `${current.x},${current.y}`;

  while (cameFrom.has(currKey)) {
    const prev = cameFrom.get(currKey)!;
    path.unshift(prev);
    currKey = `${prev.x},${prev.y}`;
  }
  return path;
}

// Calculate true cost and battery consumption of path
export function calculatePathMetrics(grid: GridTile[][], path: Point[]) {
  let cost = 0;
  let battery = 0;
  for (let i = 1; i < path.length; i++) {
    const pt = path[i];
    const tile = grid[pt.y]?.[pt.x];
    const mult = tile ? tile.costMultiplier : 1.0;
    cost += mult;
    battery += 0.8 * mult; // 0.8% battery base per step, scaled by terrain resistance
  }
  return { cost, battery };
}

// 1. Breadth-First Search (BFS)
export function runBFS(
  grid: GridTile[][],
  start: Point,
  goal: Point
): SearchResult {
  const startTime = performance.now();
  const width = grid[0].length;
  const height = grid.length;

  const queue: Point[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const cameFrom = new Map<string, Point>();
  const exploredOrder: Point[] = [];

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    exploredOrder.push(current);

    if (current.x === goal.x && current.y === goal.y) {
      found = true;
      break;
    }

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited.has(key) && isWalkable(grid[ny][nx])) {
          visited.add(key);
          cameFrom.set(key, current);
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;
  const foundPath = found ? reconstructPath(cameFrom, goal) : [];
  const { cost, battery } = calculatePathMetrics(grid, foundPath);

  return {
    algorithm: 'bfs',
    foundPath,
    exploredOrder,
    nodesExplored: exploredOrder.length,
    pathCost: cost,
    pathLength: foundPath.length > 0 ? foundPath.length - 1 : 0,
    executionTimeMs,
    batteryEstimatedCost: battery,
    success: found,
  };
}

// 2. Depth-First Search (DFS)
export function runDFS(
  grid: GridTile[][],
  start: Point,
  goal: Point
): SearchResult {
  const startTime = performance.now();
  const width = grid[0].length;
  const height = grid.length;

  const stack: Point[] = [start];
  const visited = new Set<string>();
  const cameFrom = new Map<string, Point>();
  const exploredOrder: Point[] = [];

  let found = false;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    exploredOrder.push(current);

    if (current.x === goal.x && current.y === goal.y) {
      found = true;
      break;
    }

    // Push neighbors in reverse to explore in standard direction priority
    for (let i = DIRECTIONS.length - 1; i >= 0; i--) {
      const dir = DIRECTIONS[i];
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited.has(nKey) && isWalkable(grid[ny][nx])) {
          if (!cameFrom.has(nKey)) {
            cameFrom.set(nKey, current);
          }
          stack.push({ x: nx, y: ny });
        }
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;
  const foundPath = found ? reconstructPath(cameFrom, goal) : [];
  const { cost, battery } = calculatePathMetrics(grid, foundPath);

  return {
    algorithm: 'dfs',
    foundPath,
    exploredOrder,
    nodesExplored: exploredOrder.length,
    pathCost: cost,
    pathLength: foundPath.length > 0 ? foundPath.length - 1 : 0,
    executionTimeMs,
    batteryEstimatedCost: battery,
    success: found,
  };
}

// 3. Uniform Cost Search (UCS / Dijkstra with terrain cost multipliers)
export function runUCS(
  grid: GridTile[][],
  start: Point,
  goal: Point
): SearchResult {
  const startTime = performance.now();
  const width = grid[0].length;
  const height = grid.length;

  // Priority queue item: { point, cost }
  const openSet: Array<{ point: Point; cost: number }> = [{ point: start, cost: 0 }];
  const costSoFar = new Map<string, number>();
  costSoFar.set(`${start.x},${start.y}`, 0);

  const cameFrom = new Map<string, Point>();
  const exploredOrder: Point[] = [];
  const visited = new Set<string>();

  let found = false;

  while (openSet.length > 0) {
    // Sort to extract minimum cost
    openSet.sort((a, b) => a.cost - b.cost);
    const { point: current, cost: currentCost } = openSet.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    exploredOrder.push(current);

    if (current.x === goal.x && current.y === goal.y) {
      found = true;
      break;
    }

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nextTile = grid[ny][nx];
        if (isWalkable(nextTile)) {
          const stepCost = nextTile.costMultiplier;
          const newCost = currentCost + stepCost;

          if (!costSoFar.has(nKey) || newCost < costSoFar.get(nKey)!) {
            costSoFar.set(nKey, newCost);
            cameFrom.set(nKey, current);
            openSet.push({ point: { x: nx, y: ny }, cost: newCost });
          }
        }
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;
  const foundPath = found ? reconstructPath(cameFrom, goal) : [];
  const { cost, battery } = calculatePathMetrics(grid, foundPath);

  return {
    algorithm: 'ucs',
    foundPath,
    exploredOrder,
    nodesExplored: exploredOrder.length,
    pathCost: cost,
    pathLength: foundPath.length > 0 ? foundPath.length - 1 : 0,
    executionTimeMs,
    batteryEstimatedCost: battery,
    success: found,
  };
}

// 4. Greedy Best-First Search (pure heuristic h(n))
export function runGreedyBestFirst(
  grid: GridTile[][],
  start: Point,
  goal: Point
): SearchResult {
  const startTime = performance.now();
  const width = grid[0].length;
  const height = grid.length;

  const openSet: Array<{ point: Point; h: number }> = [
    { point: start, h: manhattanDistance(start, goal) },
  ];
  const visited = new Set<string>();
  const cameFrom = new Map<string, Point>();
  const exploredOrder: Point[] = [];

  let found = false;

  while (openSet.length > 0) {
    // Greedy extracts lowest h(n)
    openSet.sort((a, b) => a.h - b.h);
    const { point: current } = openSet.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    exploredOrder.push(current);

    if (current.x === goal.x && current.y === goal.y) {
      found = true;
      break;
    }

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited.has(nKey) && isWalkable(grid[ny][nx])) {
          if (!cameFrom.has(nKey)) {
            cameFrom.set(nKey, current);
          }
          openSet.push({
            point: { x: nx, y: ny },
            h: manhattanDistance({ x: nx, y: ny }, goal),
          });
        }
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;
  const foundPath = found ? reconstructPath(cameFrom, goal) : [];
  const { cost, battery } = calculatePathMetrics(grid, foundPath);

  return {
    algorithm: 'greedy',
    foundPath,
    exploredOrder,
    nodesExplored: exploredOrder.length,
    pathCost: cost,
    pathLength: foundPath.length > 0 ? foundPath.length - 1 : 0,
    executionTimeMs,
    batteryEstimatedCost: battery,
    success: found,
  };
}

// 5. A* Search (A-Star: f(n) = g(n) + h(n) with terrain resistance)
export function runAStar(
  grid: GridTile[][],
  start: Point,
  goal: Point
): SearchResult {
  const startTime = performance.now();
  const width = grid[0].length;
  const height = grid.length;

  const openSet: Array<{ point: Point; f: number; g: number }> = [
    { point: start, f: manhattanDistance(start, goal), g: 0 },
  ];
  const gScore = new Map<string, number>();
  gScore.set(`${start.x},${start.y}`, 0);

  const cameFrom = new Map<string, Point>();
  const exploredOrder: Point[] = [];
  const closedSet = new Set<string>();

  let found = false;

  while (openSet.length > 0) {
    // Sort by lowest f-score
    openSet.sort((a, b) => a.f - b.f);
    const { point: current, g: currentG } = openSet.shift()!;
    const key = `${current.x},${current.y}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);
    exploredOrder.push(current);

    if (current.x === goal.x && current.y === goal.y) {
      found = true;
      break;
    }

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nextTile = grid[ny][nx];
        if (isWalkable(nextTile) && !closedSet.has(nKey)) {
          const stepCost = nextTile.costMultiplier;
          const tentativeG = currentG + stepCost;

          if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)!) {
            gScore.set(nKey, tentativeG);
            cameFrom.set(nKey, current);

            const h = manhattanDistance({ x: nx, y: ny }, goal);
            const f = tentativeG + h;

            openSet.push({
              point: { x: nx, y: ny },
              f,
              g: tentativeG,
            });
          }
        }
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;
  const foundPath = found ? reconstructPath(cameFrom, goal) : [];
  const { cost, battery } = calculatePathMetrics(grid, foundPath);

  return {
    algorithm: 'astar',
    foundPath,
    exploredOrder,
    nodesExplored: exploredOrder.length,
    pathCost: cost,
    pathLength: foundPath.length > 0 ? foundPath.length - 1 : 0,
    executionTimeMs,
    batteryEstimatedCost: battery,
    success: found,
  };
}

// Master search dispatcher
export function executeSearch(
  algorithm: SearchAlgorithmType,
  grid: GridTile[][],
  start: Point,
  goal: Point
): SearchResult {
  switch (algorithm) {
    case 'bfs':
      return runBFS(grid, start, goal);
    case 'dfs':
      return runDFS(grid, start, goal);
    case 'ucs':
      return runUCS(grid, start, goal);
    case 'greedy':
      return runGreedyBestFirst(grid, start, goal);
    case 'astar':
    case 'goal_agent':
    case 'utility_agent':
    default:
      return runAStar(grid, start, goal);
  }
}
