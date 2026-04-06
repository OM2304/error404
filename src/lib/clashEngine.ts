// ==========================================
// AABB Clash Detection Engine
// ==========================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AABB {
  min: Vector3;
  max: Vector3;
}

export interface MEPElement {
  id: string;
  name: string;
  type: 'pipe' | 'duct' | 'conduit' | 'equipment' | 'structural';
  discipline: 'mechanical' | 'electrical' | 'plumbing' | 'structural';
  diameter?: number;
  boundingBox: AABB;
  path?: Vector3[];
  level: string;
  system: string;
}

export type ClashType = 'hard' | 'soft' | 'clearance';
export type ClashStatus = 'active' | 'pending' | 'resolved';

export interface Clash {
  id: string;
  elementA: MEPElement;
  elementB: MEPElement;
  type: ClashType;
  severity: number; // 0-1
  point: Vector3;
  penetrationDepth: number;
  status: ClashStatus;
  suggestedReroute?: RerouteSuggestion;
}

export interface RerouteSuggestion {
  elementId: string;
  originalPath: Vector3[];
  suggestedPath: Vector3[];
  offsetDirection: Vector3;
  offsetDistance: number;
  description: string;
  confidence: number;
}

export interface ClashRule {
  disciplineA: string;
  disciplineB: string;
  minClearance: number;
  priority: number;
}

// Default clearance rules (in mm)
export const DEFAULT_RULES: ClashRule[] = [
  { disciplineA: 'mechanical', disciplineB: 'electrical', minClearance: 150, priority: 1 },
  { disciplineA: 'mechanical', disciplineB: 'plumbing', minClearance: 100, priority: 2 },
  { disciplineA: 'electrical', disciplineB: 'plumbing', minClearance: 75, priority: 2 },
  { disciplineA: 'mechanical', disciplineB: 'structural', minClearance: 50, priority: 3 },
  { disciplineA: 'electrical', disciplineB: 'structural', minClearance: 25, priority: 3 },
  { disciplineA: 'plumbing', disciplineB: 'structural', minClearance: 50, priority: 3 },
];

// AABB intersection test
export function aabbIntersects(a: AABB, b: AABB): boolean {
  return (
    a.min.x <= b.max.x && a.max.x >= b.min.x &&
    a.min.y <= b.max.y && a.max.y >= b.min.y &&
    a.min.z <= b.max.z && a.max.z >= b.min.z
  );
}

// Calculate penetration depth
export function calculatePenetration(a: AABB, b: AABB): { depth: number; point: Vector3 } {
  const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
  const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
  const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);

  const depth = Math.min(overlapX, overlapY, overlapZ);
  const point: Vector3 = {
    x: (Math.max(a.min.x, b.min.x) + Math.min(a.max.x, b.max.x)) / 2,
    y: (Math.max(a.min.y, b.min.y) + Math.min(a.max.y, b.max.y)) / 2,
    z: (Math.max(a.min.z, b.min.z) + Math.min(a.max.z, b.max.z)) / 2,
  };

  return { depth, point };
}

// Expand AABB by clearance
function expandAABB(box: AABB, clearance: number): AABB {
  return {
    min: { x: box.min.x - clearance, y: box.min.y - clearance, z: box.min.z - clearance },
    max: { x: box.max.x + clearance, y: box.max.y + clearance, z: box.max.z + clearance },
  };
}

// Classify clash type
function classifyClash(elementA: MEPElement, elementB: MEPElement, penetration: number, rule?: ClashRule): ClashType {
  if (penetration > 0) return 'hard';
  if (rule && penetration > -rule.minClearance) return 'clearance';
  return 'soft';
}

// Find applicable rule
function findRule(a: MEPElement, b: MEPElement, rules: ClashRule[]): ClashRule | undefined {
  return rules.find(
    r => (r.disciplineA === a.discipline && r.disciplineB === b.discipline) ||
         (r.disciplineA === b.discipline && r.disciplineB === a.discipline)
  );
}

// Generate reroute suggestion
function suggestReroute(elementA: MEPElement, elementB: MEPElement, clashPoint: Vector3, penetration: number): RerouteSuggestion {
  // Determine which element to move (prefer moving smaller/more flexible)
  const priorityOrder = ['conduit', 'pipe', 'duct', 'equipment', 'structural'];
  const moveElement = priorityOrder.indexOf(elementA.type) <= priorityOrder.indexOf(elementB.type) ? elementA : elementB;
  
  const offsetDistance = Math.abs(penetration) + 100; // Add 100mm safety margin
  
  // Calculate offset direction (perpendicular to clash)
  const centerA = {
    x: (elementA.boundingBox.min.x + elementA.boundingBox.max.x) / 2,
    y: (elementA.boundingBox.min.y + elementA.boundingBox.max.y) / 2,
    z: (elementA.boundingBox.min.z + elementA.boundingBox.max.z) / 2,
  };
  const centerB = {
    x: (elementB.boundingBox.min.x + elementB.boundingBox.max.x) / 2,
    y: (elementB.boundingBox.min.y + elementB.boundingBox.max.y) / 2,
    z: (elementB.boundingBox.min.z + elementB.boundingBox.max.z) / 2,
  };

  const dx = centerA.x - centerB.x;
  const dy = centerA.y - centerB.y;
  const dz = centerA.z - centerB.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  const offsetDir: Vector3 = { x: dx / len, y: dy / len, z: dz / len };

  const originalPath = moveElement.path || [
    moveElement.boundingBox.min,
    { x: (moveElement.boundingBox.min.x + moveElement.boundingBox.max.x) / 2, y: moveElement.boundingBox.min.y, z: moveElement.boundingBox.min.z },
    moveElement.boundingBox.max,
  ];

  const suggestedPath = originalPath.map(p => ({
    x: p.x + offsetDir.x * offsetDistance,
    y: p.y + offsetDir.y * offsetDistance,
    z: p.z + offsetDir.z * offsetDistance,
  }));

  const descriptions = [
    `Move ${moveElement.name} ${offsetDistance.toFixed(0)}mm along ${Math.abs(offsetDir.x) > 0.5 ? 'X' : Math.abs(offsetDir.y) > 0.5 ? 'Y' : 'Z'}-axis`,
    `Reroute ${moveElement.type} to avoid ${elementA.id === moveElement.id ? elementB.name : elementA.name}`,
    `Offset ${moveElement.discipline} element by ${offsetDistance.toFixed(0)}mm to maintain clearance`,
  ];

  return {
    elementId: moveElement.id,
    originalPath,
    suggestedPath,
    offsetDirection: offsetDir,
    offsetDistance,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    confidence: Math.min(0.95, 0.6 + Math.random() * 0.3),
  };
}

// Main clash detection function
export function detectClashes(elements: MEPElement[], rules: ClashRule[] = DEFAULT_RULES): Clash[] {
  const clashes: Clash[] = [];
  let clashId = 1;

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      // Skip same discipline
      if (a.discipline === b.discipline && a.type === b.type) continue;

      const rule = findRule(a, b, rules);
      const clearance = rule?.minClearance || 50;

      // Check with clearance expansion
      const expandedA = expandAABB(a.boundingBox, clearance);

      if (aabbIntersects(expandedA, b.boundingBox)) {
        const isHard = aabbIntersects(a.boundingBox, b.boundingBox);
        const { depth, point } = isHard
          ? calculatePenetration(a.boundingBox, b.boundingBox)
          : { depth: -clearance * 0.5, point: {
              x: (a.boundingBox.max.x + b.boundingBox.min.x) / 2,
              y: (a.boundingBox.max.y + b.boundingBox.min.y) / 2,
              z: (a.boundingBox.max.z + b.boundingBox.min.z) / 2,
            }};

        const type = classifyClash(a, b, depth, rule);
        const severity = type === 'hard' ? 0.8 + Math.random() * 0.2 : type === 'soft' ? 0.4 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2;

        clashes.push({
          id: `CLH-${String(clashId++).padStart(4, '0')}`,
          elementA: a,
          elementB: b,
          type,
          severity,
          point,
          penetrationDepth: depth,
          status: 'active',
          suggestedReroute: suggestReroute(a, b, point, depth),
        });
      }
    }
  }

  return clashes.sort((a, b) => b.severity - a.severity);
}

// Generate sample MEP elements for demo
export function generateSampleElements(): MEPElement[] {
  const elements: MEPElement[] = [];
  let id = 1;

  const levels = ['Level 1', 'Level 2', 'Level 3'];
  const systems = ['HVAC Supply', 'HVAC Return', 'Chilled Water', 'Hot Water', 'Electrical Main', 'Fire Sprinkler', 'Sanitary', 'Storm Water'];

  // Generate pipes
  for (let i = 0; i < 8; i++) {
    const x = 1000 + Math.random() * 8000;
    const y = 500 + Math.random() * 4000;
    const z = (Math.floor(Math.random() * 3)) * 3500;
    const len = 2000 + Math.random() * 3000;
    const dia = 50 + Math.random() * 200;

    elements.push({
      id: `PIPE-${String(id++).padStart(3, '0')}`,
      name: `${['CW', 'HW', 'CHW', 'Fire'][i % 4]} Pipe ${id}`,
      type: 'pipe',
      discipline: i < 4 ? 'plumbing' : 'mechanical',
      diameter: dia,
      boundingBox: {
        min: { x, y, z },
        max: { x: x + len, y: y + dia, z: z + dia },
      },
      level: levels[Math.floor(z / 3500)],
      system: systems[i % systems.length],
    });
  }

  // Generate ducts
  for (let i = 0; i < 6; i++) {
    const x = 800 + Math.random() * 8000;
    const y = 400 + Math.random() * 4000;
    const z = (Math.floor(Math.random() * 3)) * 3500 + 200;
    const len = 3000 + Math.random() * 4000;
    const w = 300 + Math.random() * 600;
    const h = 200 + Math.random() * 400;

    elements.push({
      id: `DUCT-${String(id++).padStart(3, '0')}`,
      name: `${i % 2 === 0 ? 'Supply' : 'Return'} Duct ${id}`,
      type: 'duct',
      discipline: 'mechanical',
      boundingBox: {
        min: { x, y, z },
        max: { x: x + len, y: y + w, z: z + h },
      },
      level: levels[Math.floor((z - 200) / 3500)],
      system: i % 2 === 0 ? 'HVAC Supply' : 'HVAC Return',
    });
  }

  // Generate conduits
  for (let i = 0; i < 5; i++) {
    const x = 1200 + Math.random() * 7000;
    const y = 300 + Math.random() * 4000;
    const z = (Math.floor(Math.random() * 3)) * 3500 + 100;
    const len = 1500 + Math.random() * 5000;
    const dia = 25 + Math.random() * 75;

    elements.push({
      id: `COND-${String(id++).padStart(3, '0')}`,
      name: `Conduit ${id}`,
      type: 'conduit',
      discipline: 'electrical',
      diameter: dia,
      boundingBox: {
        min: { x, y, z },
        max: { x: x + len, y: y + dia, z: z + dia },
      },
      level: levels[Math.floor((z - 100) / 3500)],
      system: 'Electrical Main',
    });
  }

  // Generate structural elements (beams/columns)
  for (let i = 0; i < 4; i++) {
    const x = 2000 + i * 2500;
    const y = 500 + Math.random() * 3000;
    const z = 0;

    elements.push({
      id: `STR-${String(id++).padStart(3, '0')}`,
      name: `Steel Beam ${id}`,
      type: 'structural',
      discipline: 'structural',
      boundingBox: {
        min: { x, y, z },
        max: { x: x + 300, y: y + 6000, z: z + 500 },
      },
      level: 'Level 1',
      system: 'Structure',
    });
  }

  return elements;
}
