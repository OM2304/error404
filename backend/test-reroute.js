const { detectClashes } = require('./clash');
const { computeReroute } = require('./reroute');

const sample = [
  {
    id: 'IFC-1',
    name: 'Pipe1',
    type: 'pipe',
    discipline: 'plumbing',
    diameter: 100,
    level: 'L1',
    system: 'S1',
    boundingBox: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 100, y: 100, z: 100 }
    }
  },
  {
    id: 'IFC-2',
    name: 'Duct1',
    type: 'duct',
    discipline: 'mechanical',
    level: 'L1',
    system: 'S2',
    boundingBox: {
      min: { x: 50, y: 50, z: 50 },
      max: { x: 150, y: 150, z: 150 }
    }
  }
];

const clashes = detectClashes(sample);
console.log('clashes', JSON.stringify(clashes, null, 2));
const result = computeReroute(clashes, sample);
console.log('result', JSON.stringify(result, null, 2));
