import { Clash } from '@/lib/clashEngine';

interface ClashVisualizationProps {
  clashes: Clash[];
}

export default function ClashVisualization({ clashes }: ClashVisualizationProps) {
  const hard = clashes.filter(c => c.type === 'hard').length;
  const soft = clashes.filter(c => c.type === 'soft').length;
  const clearance = clashes.filter(c => c.type === 'clearance').length;
  const total = clashes.length || 1;

  const disciplines = ['mechanical', 'electrical', 'plumbing', 'structural'] as const;
  const disciplineClashes = disciplines.map(d => ({
    name: d,
    count: clashes.filter(c => c.elementA.discipline === d || c.elementB.discipline === d).length,
  }));
  const maxDiscipline = Math.max(...disciplineClashes.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Clash Distribution */}
      <div className="glass-panel rounded-xl p-5 card-shadow">
        <h4 className="text-sm font-semibold text-foreground mb-4">Clash Distribution</h4>
        <div className="flex items-end gap-3 h-32">
          {[
            { label: 'Hard', value: hard, color: 'bg-clash-hard' },
            { label: 'Soft', value: soft, color: 'bg-clash-soft' },
            { label: 'Clearance', value: clearance, color: 'bg-clash-clearance' },
          ].map(item => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-lg font-bold text-foreground">{item.value}</span>
              <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${(item.value / total) * 100}%`, minHeight: 4 }}>
                <div className={`w-full h-full rounded-t-lg ${item.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By Discipline */}
      <div className="glass-panel rounded-xl p-5 card-shadow">
        <h4 className="text-sm font-semibold text-foreground mb-4">By Discipline</h4>
        <div className="space-y-3">
          {disciplineClashes.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 capitalize">{d.name}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-bg rounded-full transition-all duration-700"
                  style={{ width: `${(d.count / maxDiscipline) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
