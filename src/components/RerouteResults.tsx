import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RerouteResult {
  elementId: string;
  oldBoundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  newBoundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  direction: { x: number; y: number; z: number };
  distance: number;
  status: string;
}

interface RerouteResultsProps {
  results: RerouteResult[];
}

export default function RerouteResults({ results }: RerouteResultsProps) {
  if (results.length === 0) return null;

  const formatCoords = (coords: { x: number; y: number; z: number }) =>
    `(${Math.round(coords.x)}, ${Math.round(coords.y)}, ${Math.round(coords.z)})`;

  const getDirectionLabel = (dir: { x: number; y: number; z: number }) => {
    if (dir.x === 1) return '+X';
    if (dir.x === -1) return '-X';
    if (dir.y === 1) return '+Y';
    if (dir.y === -1) return '-Y';
    if (dir.z === 1) return '+Z';
    return 'Unknown';
  };

  return (
    <Card className="glass-panel rounded-xl border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-6 bg-green-500 rounded-full" />
          Rerouting Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Element ID</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Old Position</TableHead>
                <TableHead>New Position</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{result.elementId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {getDirectionLabel(result.direction)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{result.distance} units</TableCell>
                  <TableCell className="font-mono text-xs">
                    Min: {formatCoords(result.oldBoundingBox.min)}<br />
                    Max: {formatCoords(result.oldBoundingBox.max)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    Min: {formatCoords(result.newBoundingBox.min)}<br />
                    Max: {formatCoords(result.newBoundingBox.max)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={result.status === 'rerouted' ? 'default' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}