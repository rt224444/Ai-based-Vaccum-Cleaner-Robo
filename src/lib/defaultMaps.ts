import { GridTile, HouseFloorPlan, Point } from '../types/game';

// Helper to construct blank house grid
export function createEmptyGrid(width: number, height: number): GridTile[][] {
  const grid: GridTile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: GridTile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        type: 'floor',
        room: 'living',
        dirtLevel: 0,
        costMultiplier: 1.0,
        isCleaned: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

// Map 1: Suburban 3-Room Residence (24x16 grid)
export function getSuburbanResidence(): HouseFloorPlan {
  const width = 24;
  const height = 16;
  const tiles = createEmptyGrid(width, height);

  // Set boundary walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].type = 'wall';
    tiles[height - 1][x].type = 'wall';
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].type = 'wall';
    tiles[y][width - 1].type = 'wall';
  }

  // Define Rooms
  // Living Room: x: 1..13, y: 1..9
  // Kitchen: x: 14..22, y: 1..8
  // Hallway: x: 1..22, y: 9..10
  // Bedroom: x: 1..11, y: 11..14
  // Bathroom: x: 12..16, y: 11..14
  // Office: x: 17..22, y: 11..14

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (y <= 8 && x <= 13) tiles[y][x].room = 'living';
      else if (y <= 8 && x >= 14) {
        tiles[y][x].room = 'kitchen';
        tiles[y][x].type = 'tile';
      } else if (y >= 9 && y <= 10) tiles[y][x].room = 'hallway';
      else if (y >= 11 && x <= 11) tiles[y][x].room = 'bedroom';
      else if (y >= 11 && x >= 12 && x <= 16) {
        tiles[y][x].room = 'bathroom';
        tiles[y][x].type = 'tile';
      } else if (y >= 11 && x >= 17) tiles[y][x].room = 'office';
    }
  }

  // Interior dividing walls
  // Vertical wall between Living & Kitchen (x = 13, y: 1..8) with door at y=5
  for (let y = 1; y <= 8; y++) {
    if (y !== 4 && y !== 5) {
      tiles[y][13].type = 'wall';
    } else {
      tiles[y][13].type = 'door';
    }
  }

  // Horizontal wall separating top rooms from hallway (y = 8)
  for (let x = 1; x < width - 1; x++) {
    if (x === 6 || x === 7 || x === 18 || x === 19) {
      tiles[8][x].type = 'door';
    } else {
      tiles[8][x].type = 'wall';
    }
  }

  // Horizontal wall separating hallway from bottom rooms (y = 11)
  for (let x = 1; x < width - 1; x++) {
    if (x === 5 || x === 6 || x === 14 || x === 20) {
      tiles[11][x].type = 'door';
    } else {
      tiles[11][x].type = 'wall';
    }
  }

  // Vertical walls between bottom rooms
  for (let y = 11; y <= 14; y++) {
    tiles[y][11].type = 'wall';
    tiles[y][16].type = 'wall';
  }

  // Add Carpet Rugs (costMultiplier = 1.6)
  // Living room rug
  for (let y = 3; y <= 6; y++) {
    for (let x = 3; x <= 9; x++) {
      tiles[y][x].type = 'carpet';
      tiles[y][x].costMultiplier = 1.6;
    }
  }
  // Bedroom rug
  for (let y = 12; y <= 14; y++) {
    for (let x = 3; x <= 8; x++) {
      tiles[y][x].type = 'carpet';
      tiles[y][x].costMultiplier = 1.6;
    }
  }

  // Add Furniture Obstacles
  // Living room Sofa & Coffee Table
  tiles[3][4].type = 'furniture';
  tiles[3][4].furnitureType = 'sofa';
  tiles[3][5].type = 'furniture';
  tiles[3][5].furnitureType = 'sofa';
  tiles[3][6].type = 'furniture';
  tiles[3][6].furnitureType = 'sofa';
  tiles[5][5].type = 'furniture';
  tiles[5][5].furnitureType = 'table';
  tiles[1][1].type = 'furniture';
  tiles[1][1].furnitureType = 'plant';
  tiles[1][11].type = 'furniture';
  tiles[1][11].furnitureType = 'tv_stand';

  // Kitchen dining table & counter
  tiles[3][17].type = 'furniture';
  tiles[3][17].furnitureType = 'table';
  tiles[3][18].type = 'furniture';
  tiles[3][18].furnitureType = 'table';
  tiles[4][17].type = 'furniture';
  tiles[4][17].furnitureType = 'chair';
  tiles[4][18].type = 'furniture';
  tiles[4][18].furnitureType = 'chair';

  // Bedroom Bed
  tiles[13][2].type = 'furniture';
  tiles[13][2].furnitureType = 'bed';
  tiles[13][3].type = 'furniture';
  tiles[13][3].furnitureType = 'bed';
  tiles[14][2].type = 'furniture';
  tiles[14][2].furnitureType = 'bed';
  tiles[14][3].type = 'furniture';
  tiles[14][3].furnitureType = 'bed';

  // Puddles / spills (sticky tile, costMultiplier = 2.4)
  tiles[6][18].type = 'puddle';
  tiles[6][18].costMultiplier = 2.4;
  tiles[6][18].dirtLevel = 4;
  tiles[6][18].dirtType = 'spill';

  tiles[13][13].type = 'puddle';
  tiles[13][13].costMultiplier = 2.4;
  tiles[13][13].dirtLevel = 3;
  tiles[13][13].dirtType = 'spill';

  // Dock position (Hallway power outlet)
  const dock: Point = { x: 2, y: 9 };
  tiles[dock.y][dock.x].type = 'dock';

  // Dirt & dust areas distributed realistically
  const dirtPlacements: Array<{ x: number; y: number; level: number; type: 'dust' | 'crumbs' | 'hair' | 'spill' | 'mud' }> = [
    { x: 5, y: 2, level: 3, type: 'crumbs' },
    { x: 7, y: 5, level: 2, type: 'dust' },
    { x: 10, y: 4, level: 4, type: 'dust' },
    { x: 16, y: 2, level: 5, type: 'crumbs' },
    { x: 20, y: 4, level: 4, type: 'crumbs' },
    { x: 19, y: 6, level: 3, type: 'spill' },
    { x: 10, y: 9, level: 2, type: 'mud' },
    { x: 16, y: 9, level: 3, type: 'mud' },
    { x: 6, y: 13, level: 3, type: 'hair' },
    { x: 8, y: 12, level: 4, type: 'dust' },
    { x: 14, y: 12, level: 3, type: 'hair' },
    { x: 19, y: 13, level: 4, type: 'crumbs' },
    { x: 21, y: 12, level: 2, type: 'dust' },
  ];

  for (const d of dirtPlacements) {
    if (tiles[d.y][d.x].type !== 'wall' && tiles[d.y][d.x].type !== 'furniture') {
      tiles[d.y][d.x].dirtLevel = d.level;
      tiles[d.y][d.x].dirtType = d.type;
    }
  }

  return {
    id: 'suburban_home',
    name: 'Suburban 3-Room Residence',
    description: 'Realistic multi-room floorplan with living room, kitchen, bedroom, bath, office, and varied terrain.',
    width,
    height,
    dock,
    tiles,
  };
}

// Map 2: Modern Open-Plan Studio (20x14 grid)
export function getModernStudio(): HouseFloorPlan {
  const width = 20;
  const height = 14;
  const tiles = createEmptyGrid(width, height);

  for (let x = 0; x < width; x++) {
    tiles[0][x].type = 'wall';
    tiles[height - 1][x].type = 'wall';
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].type = 'wall';
    tiles[y][width - 1].type = 'wall';
  }

  // Room zones
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (x < 12 && y < 8) tiles[y][x].room = 'living';
      else if (x >= 12 && y < 8) {
        tiles[y][x].room = 'kitchen';
        tiles[y][x].type = 'tile';
      } else if (x < 11 && y >= 8) tiles[y][x].room = 'bedroom';
      else {
        tiles[y][x].room = 'bathroom';
        tiles[y][x].type = 'tile';
      }
    }
  }

  // Dividers
  for (let y = 8; y < height - 1; y++) {
    if (y !== 10) tiles[y][11].type = 'wall';
    else tiles[y][11].type = 'door';
  }

  // Furniture
  tiles[3][3].type = 'furniture';
  tiles[3][3].furnitureType = 'sofa';
  tiles[3][4].type = 'furniture';
  tiles[3][4].furnitureType = 'sofa';
  tiles[3][5].type = 'furniture';
  tiles[3][5].furnitureType = 'sofa';

  tiles[4][14].type = 'furniture';
  tiles[4][14].furnitureType = 'table';
  tiles[4][15].type = 'furniture';
  tiles[4][15].furnitureType = 'table';

  tiles[10][3].type = 'furniture';
  tiles[10][3].furnitureType = 'bed';
  tiles[11][3].type = 'furniture';
  tiles[11][3].furnitureType = 'bed';

  const dock: Point = { x: 1, y: 1 };
  tiles[dock.y][dock.x].type = 'dock';

  // Dirt placements
  const dirtList: Array<{ x: number; y: number; level: number; type: 'dust' | 'crumbs' | 'hair' | 'spill' }> = [
    { x: 6, y: 4, level: 4, type: 'crumbs' },
    { x: 8, y: 6, level: 2, type: 'dust' },
    { x: 15, y: 3, level: 5, type: 'crumbs' },
    { x: 17, y: 6, level: 3, type: 'spill' },
    { x: 5, y: 11, level: 4, type: 'hair' },
    { x: 15, y: 11, level: 3, type: 'dust' },
  ];

  for (const d of dirtList) {
    tiles[d.y][d.x].dirtLevel = d.level;
    tiles[d.y][d.x].dirtType = d.type;
  }

  return {
    id: 'modern_studio',
    name: 'Modern Open-Plan Studio',
    description: 'Expansive open layout with kitchen island, bedroom divider, and low corridor resistance.',
    width,
    height,
    dock,
    tiles,
  };
}

// Map 3: Obstacle & Corridor Maze (22x14 grid)
export function getObstacleMaze(): HouseFloorPlan {
  const width = 22;
  const height = 14;
  const tiles = createEmptyGrid(width, height);

  for (let x = 0; x < width; x++) {
    tiles[0][x].type = 'wall';
    tiles[height - 1][x].type = 'wall';
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].type = 'wall';
    tiles[y][width - 1].type = 'wall';
  }

  // Winding corridor maze
  for (let y = 1; y < 10; y++) {
    tiles[y][5].type = 'wall';
  }
  for (let y = 4; y < 13; y++) {
    tiles[y][10].type = 'wall';
  }
  for (let y = 1; y < 10; y++) {
    tiles[y][15].type = 'wall';
  }

  // Add doors / passages
  tiles[3][5].type = 'door';
  tiles[8][10].type = 'door';
  tiles[5][15].type = 'door';

  const dock: Point = { x: 2, y: 2 };
  tiles[dock.y][dock.x].type = 'dock';

  // Heavy dirt spots at ends of hallways
  const dirtSpots = [
    { x: 8, y: 2, level: 5 },
    { x: 8, y: 11, level: 4 },
    { x: 13, y: 2, level: 5 },
    { x: 13, y: 11, level: 4 },
    { x: 19, y: 2, level: 5 },
    { x: 19, y: 11, level: 5 },
  ];

  for (const d of dirtSpots) {
    tiles[d.y][d.x].dirtLevel = d.level;
    tiles[d.y][d.x].dirtType = 'dust';
  }

  return {
    id: 'obstacle_maze',
    name: 'Corridor & Obstacle Challenge',
    description: 'Designed to test BFS vs DFS vs A* in deep maze paths with backtracking and narrow bottlenecks.',
    width,
    height,
    dock,
    tiles,
  };
}

export const PRESET_MAPS = [getSuburbanResidence(), getModernStudio(), getObstacleMaze()];
