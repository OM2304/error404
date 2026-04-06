import { useState } from 'react';
import { Clash, ClashType, ClashStatus } from '@/lib/clashEngine';
import { ChevronDown, ChevronRight, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClashTableProps {
  clashes: Clash[];
  onResolve: (id: string) => void;
  onVisualize?: (clash: Clash) => void;
}

const statusConfig: Record<ClashStatus, { label: string; typeLabel: string; color: string }> = {
  active: { label: 'Clash Detected', typeLabel: 'Hard Clash', color: 'text-clash-hard' },
  pending: { label: 'Pending', typeLabel: 'Soft Clash', color: 'text-clash-soft' },
  resolved: { label: 'Solved', typeLabel: 'Clearance Issue', color: 'text-status-resolved' },
};

function getStatusDisplay(clash: Clash) {
  if (clash.status === 'resolved') return { label: 'Solved', typeLabel: 'Resolved', color: 'text-status-resolved' };
  if (clash.type === 'hard') return { label: 'Clash Detected', typeLabel: 'Type: Hard Clash', color: 'text-clash-hard' };
  if (clash.type === 'soft') return { label: 'Pending', typeLabel: 'Type: Soft Clash', color: 'text-clash-soft' };
  return { label: 'Pending', typeLabel: 'Type: Clearance Issue', color: 'text-clash-clearance' };
}

function getClashTypeLabel(clash: Clash): string {
  const a = clash.elementA.type;
  const b = clash.elementB.type;
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(a)} - ${capitalize(b)}`;
}

function formatCoord(clash: Clash): string {
  const p = clash.point;
  return `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;
}

function buildElementDetail(el: Clash['elementA']) {
  return {
    element_id: el.id,
    type: el.type.charAt(0).toUpperCase() + el.type.slice(1),
    system_type: el.system,
    ...(el.type === 'duct' || el.type === 'equipment' ? {
      width: Math.round((el.boundingBox.max.y - el.boundingBox.min.y)),
      height: Math.round((el.boundingBox.max.z - el.boundingBox.min.z)),
    } : {
      diameter: el.diameter ? Math.round(el.diameter) : undefined,
    }),
    material: el.type === 'pipe' ? 'GI' : el.type === 'duct' ? 'Galvanized Steel' : el.type === 'conduit' ? 'PVC' : 'Steel',
    level: el.level,
    offset: Math.round(el.boundingBox.min.z),
    start_point: {
      x: Math.round(el.boundingBox.min.x),
      y: Math.round(el.boundingBox.min.y),
      z: Math.round(el.boundingBox.min.z),
    },
    end_point: {
      x: Math.round(el.boundingBox.max.x),
      y: Math.round(el.boundingBox.max.y),
      z: Math.round(el.boundingBox.max.z),
    },
  };
}

export default function ClashTable({ clashes, onResolve, onVisualize }: ClashTableProps) {
  const [expandedA, setExpandedA] = useState<Record<string, boolean>>({});
  const [expandedB, setExpandedB] = useState<Record<string, boolean>>({});

  const toggleA = (id: string) => setExpandedA(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleB = (id: string) => setExpandedB(prev => ({ ...prev, [id]: !prev[id] }));

  const handleExport = () => {
    const data = JSON.stringify(clashes.map(c => ({
      clash_id: c.id,
      clash_type: getClashTypeLabel(c),
      element_a: buildElementDetail(c.elementA),
      element_b: buildElementDetail(c.elementB),
      clash_location: { x: +c.point.x.toFixed(1), y: +c.point.y.toFixed(1), z: +c.point.z.toFixed(1) },
      status: getStatusDisplay(c).label,
      type: c.type,
    })), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clash-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clash-hard">3. AI Clash Detection Results</h2>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export JSON
        </Button>
      </div>

      <div className="glass-panel rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="gradient-bg">
              {['Clash ID', 'Clash Type', 'Element A (Detailed Data)', 'Element B (Detailed Data)', 'Clash Location', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-primary-foreground text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clashes.map((clash, idx) => {
              const status = getStatusDisplay(clash);
              return (
                <tr
                  key={clash.id}
                  className={`border-b border-border/30 align-top ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                >
                  {/* Clash ID */}
                  <td className="px-5 py-4 font-semibold text-foreground">{clash.id}</td>

                  {/* Clash Type */}
                  <td className="px-5 py-4 text-foreground">{getClashTypeLabel(clash)}</td>

                  {/* Element A */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleA(clash.id)}
                      className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {expandedA[clash.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {clash.elementA.name}
                    </button>
                    {expandedA[clash.id] && (
                      <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono whitespace-pre-wrap animate-fade-in">
{JSON.stringify(buildElementDetail(clash.elementA), null, 2)}
                      </pre>
                    )}
                  </td>

                  {/* Element B */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleB(clash.id)}
                      className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {expandedB[clash.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {clash.elementB.name}
                    </button>
                    {expandedB[clash.id] && (
                      <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono whitespace-pre-wrap animate-fade-in">
{JSON.stringify(buildElementDetail(clash.elementB), null, 2)}
                      </pre>
                    )}
                  </td>

                  {/* Clash Location */}
                  <td className="px-5 py-4 font-mono text-foreground text-xs">{formatCoord(clash)}</td>

                  {/* Actions */}
                  <td className="px-5 py-4 flex items-center gap-2">
                    <button
                      onClick={() => clash.status !== 'resolved' && onResolve(clash.id)}
                      className={`font-bold ${status.color} cursor-pointer hover:underline text-sm`}
                    >
                      {status.label}
                    </button>
                    {onVisualize && clash.status !== 'resolved' && (
                      <button
                        onClick={() => onVisualize(clash)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                        title="Visualize clash in 3D"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {clashes.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-sm">No clashes detected yet. Upload a model and run detection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
