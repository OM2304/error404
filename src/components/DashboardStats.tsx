import { AlertTriangle, CheckCircle, Clock, Layers, ShieldCheck } from 'lucide-react';
import { Clash, MEPElement } from '@/lib/clashEngine';

interface DashboardStatsProps {
  clashes: Clash[];
  elements: MEPElement[];
  accuracy?: number;
}

export default function DashboardStats({ clashes, elements, accuracy = 0.98 }: DashboardStatsProps) {
  const hard = clashes.filter(c => c.type === 'hard').length;
  const soft = clashes.filter(c => c.type === 'soft').length; // Added soft count
  const resolved = clashes.filter(c => c.status === 'resolved').length;

  const stats = [
    { label: 'Total Elements', value: elements.length, icon: Layers, color: 'text-primary' },
    { label: 'Hard Clashes', value: hard, icon: AlertTriangle, color: 'text-clash-hard' },
    { label: 'Soft Clashes', value: soft, icon: Clock, color: 'text-clash-soft' }, // Added soft card
    { label: 'System Accuracy', value: `${(accuracy * 100).toFixed(1)}%`, icon: ShieldCheck, color: 'text-secondary' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="glass-panel rounded-xl p-5 card-shadow animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-3xl font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
