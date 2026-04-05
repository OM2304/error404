/**
 * AABB Clash Detection Engine (Backend)
 */

function aabbIntersects(a, b) {
  return (
    a.min.x <= b.max.x && a.max.x >= b.min.x &&
    a.min.y <= b.max.y && a.max.y >= b.min.y &&
    a.min.z <= b.max.z && a.max.z >= b.min.z
  );
}

function calculatePenetration(a, b) {
  const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
  const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
  const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);

  const depth = Math.min(overlapX, overlapY, overlapZ);
  const point = {
    x: (Math.max(a.min.x, b.min.x) + Math.min(a.max.x, b.max.x)) / 2,
    y: (Math.max(a.min.y, b.min.y) + Math.min(a.max.y, b.max.y)) / 2,
    z: (Math.max(a.min.z, b.min.z) + Math.min(a.max.z, b.max.z)) / 2,
  };

  return { depth, point };
}

function expandAABB(box, clearance) {
  return {
    min: { x: box.min.x - clearance, y: box.min.y - clearance, z: box.min.z - clearance },
    max: { x: box.max.x + clearance, y: box.max.y + clearance, z: box.max.z + clearance },
  };
}

const DEFAULT_RULES = [
  { disciplineA: 'mechanical', disciplineB: 'electrical', minClearance: 150, priority: 1 },
  { disciplineA: 'mechanical', disciplineB: 'plumbing', minClearance: 100, priority: 2 },
  { disciplineA: 'electrical', disciplineB: 'plumbing', minClearance: 75, priority: 2 },
  { disciplineA: 'mechanical', disciplineB: 'structural', minClearance: 50, priority: 3 },
  { disciplineA: 'electrical', disciplineB: 'structural', minClearance: 25, priority: 3 },
  { disciplineA: 'plumbing', disciplineB: 'structural', minClearance: 50, priority: 3 },
];

function findRule(a, b, rules) {
  return rules.find(
    r => (r.disciplineA === a.discipline && r.disciplineB === b.discipline) ||
         (r.disciplineA === b.discipline && r.disciplineB === a.discipline)
  );
}

function suggestReroute(elementA, elementB, clashPoint, penetration, allElements) {
  const priorityOrder = ['conduit', 'pipe', 'duct', 'equipment', 'structural'];
  const moveElement = priorityOrder.indexOf(elementA.type) <= priorityOrder.indexOf(elementB.type) ? elementA : elementB;
  const staticElement = moveElement.id === elementA.id ? elementB : elementA;

  const possibilities = [];
  const directions = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
  ];

  for (const dir of directions) {
    const offsetDistance = Math.abs(penetration) + 200;
    const originalBox = moveElement.boundingBox;
    const suggestedBox = {
      min: { 
        x: originalBox.min.x + dir.x * offsetDistance, 
        y: originalBox.min.y + dir.y * offsetDistance, 
        z: originalBox.min.z + dir.z * offsetDistance 
      },
      max: { 
        x: originalBox.max.x + dir.x * offsetDistance, 
        y: originalBox.max.y + dir.y * offsetDistance, 
        z: originalBox.max.z + dir.z * offsetDistance 
      }
    };

    // Check if this new position clashes with ANY other element
    let hasSecondaryClash = false;
    let clashingWith = null;

    for (const other of allElements) {
      if (other.id === moveElement.id || other.id === staticElement.id) continue;
      if (aabbIntersects(suggestedBox, other.boundingBox)) {
        hasSecondaryClash = true;
        clashingWith = other.name;
        break;
      }
    }

    possibilities.push({
      direction: dir,
      offsetDistance,
      suggestedBox,
      isClear: !hasSecondaryClash,
      secondaryConflict: clashingWith,
      description: `Move ${moveElement.name} ${offsetDistance}mm in ${dir.x !== 0 ? 'X' : dir.y !== 0 ? 'Y' : 'Z'} direction`
    });
  }

  // Find the best clear possibility
  const bestPossibility = possibilities.find(p => p.isClear) || possibilities[0];

  return {
    elementId: moveElement.id,
    moveElementName: moveElement.name,
    staticElementName: staticElement.name,
    originalBox: moveElement.boundingBox,
    suggestedBox: bestPossibility.suggestedBox,
    description: bestPossibility.description,
    isClear: bestPossibility.isClear,
    secondaryConflict: bestPossibility.secondaryConflict,
    allPossibilities: possibilities,
    confidence: bestPossibility.isClear ? 0.98 : 0.45,
  };
}

function detectClashes(elements, rules = DEFAULT_RULES) {
  console.log(`[ClashEngine] Starting analysis for ${elements.length} elements`);
  const clashes = [];
  let clashId = 1;

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      if (a.discipline === b.discipline && a.type === b.type) continue;

      const rule = findRule(a, b, rules);
      const clearance = rule?.minClearance || 50;

      const isHard = aabbIntersects(a.boundingBox, b.boundingBox);
      const expandedA = expandAABB(a.boundingBox, clearance);
      const isClearance = aabbIntersects(expandedA, b.boundingBox);

      if (isHard || isClearance) {
        const { depth, point } = calculatePenetration(a.boundingBox, b.boundingBox);

        clashes.push({
          id: `CLH-${clashId++}`,
          elementA: a,
          elementB: b,
          type: isHard ? 'hard' : 'soft',
          severity: isHard ? Math.min(1.0, (depth + 100) / 300) : 0.2,
          point: point,
          penetrationDepth: isHard ? depth : -clearance,
          status: 'active',
          suggestedReroute: suggestReroute(a, b, point, isHard ? depth : -clearance, elements)
        });
      }
    }
  }

  console.log(`[ClashEngine] Analysis complete. Detected ${clashes.length} clashes.`);
  return clashes;
}

module.exports = { detectClashes };
