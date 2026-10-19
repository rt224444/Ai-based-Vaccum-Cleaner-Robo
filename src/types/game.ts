export type SearchAlgorithmType =
  | 'bfs'
  | 'dfs'
  | 'ucs'
  | 'greedy'
  | 'astar'
  | 'goal_agent'
  | 'utility_agent';

export type GameMode = 'autonomous' | 'manual' | 'benchmark';

export interface VirtualControllerState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  turbo: boolean;
}

export type TileType =
  | 'floor'
  | 'wall'
  | 'door'
  | 'carpet'
  | 'tile'
  | 'puddle'
  | 'dock'
  | 'furniture';

export type RoomType =
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'hallway'
  | 'bathroom'
  | 'office';

export interface Point {
  x: number;
  y: number;
}

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  room: RoomType;
  dirtLevel: number; // 0 to 5
  dirtType?: 'dust' | 'crumbs' | 'hair' | 'spill' | 'mud';
  costMultiplier: number; // 1.0 for hardwood, 1.6 for carpet, 2.2 for sticky spill
  isCleaned: boolean;
  furnitureType?: 'sofa' | 'table' | 'bed' | 'chair' | 'plant' | 'tv_stand';
}

export interface SearchNode {
  x: number;
  y: number;
  gCost: number; // Distance from start
  hCost: number; // Heuristic to goal
  fCost: number; // g + h (or just h for greedy, or just g for UCS)
  parent: SearchNode | null;
  dirtAtNode?: number;
}

export interface SearchResult {
  algorithm: SearchAlgorithmType;
  foundPath: Point[];
  exploredOrder: Point[];
  frontierHistory?: Point[][];
  nodesExplored: number;
  pathCost: number;
  pathLength: number;
  executionTimeMs: number;
  batteryEstimatedCost: number;
  success: boolean;
}

export interface BenchmarkMetrics {
  algorithm: SearchAlgorithmType;
  displayName: string;
  category: 'Uninformed Search' | 'Informed Search' | 'Intelligent Agent';
  nodesExplored: number;
  pathLength: number;
  totalCost: number;
  batteryConsumed: number;
  cleaningTimeSeconds: number;
  dirtCleaned: number;
  executionTimeMs: number;
  success: boolean;
  optimalityRating: string;
}

export interface RobotState {
  x: number; // continuous canvas pos
  y: number;
  gridX: number;
  gridY: number;
  heading: number; // radians
  battery: number; // 0 to 100
  maxBattery: number;
  dustbin: number; // 0 to 100
  dustbinCapacity: number;
  speed: number;
  isMoving: boolean;
  isCleaning: boolean;
  isDocked: boolean;
  status:
    | 'idle'
    | 'planning'
    | 'exploring'
    | 'cleaning'
    | 'returning_to_dock'
    | 'recharging'
    | 'out_of_battery'
    | 'mission_complete'
    | 'stuck';
  brushAngle: number;
}

export interface DynamicHazard {
  id: string;
  type: 'cat' | 'dog' | 'toy';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  pauseTimer: number;
  color: string;
}

export interface HouseFloorPlan {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  dock: Point;
  tiles: GridTile[][];
}
