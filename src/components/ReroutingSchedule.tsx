import { AlertCircle, ArrowRight, CheckCircle2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ReroutingTask {
  taskId: string;
  priority: 'CRITICAL' | 'MEDIUM';
  targetElement: string;
  instruction: string;
  coordinates: { x: number; y: number; z: number };
  clash?: any; // Full clash object for visualization
}

interface ReroutingScheduleProps {
  tasks: ReroutingTask[];
  onVisualize: (task: ReroutingTask) => void;
  onApply: (task?: ReroutingTask) => void;
  onApplyAll?: () => void;
}

export default function ReroutingSchedule({ tasks, onVisualize, onApply, onApplyAll }: ReroutingScheduleProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-primary rounded-full" />
          <h2 className="text-xl font-bold text-foreground">AI Rerouting Schedule</h2>
          <span className="text-sm text-muted-foreground">{tasks.length} tasks pending</span>
        </div>
        {onApplyAll && (
          <button
            onClick={onApplyAll}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Apply All Tasks
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task, index) => (
          <div 
            key={task.taskId} 
            className="glass-panel rounded-xl p-4 border-l-4 border-l-primary flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Task #{index + 1}
                </span>
                <Badge 
                  variant={task.priority === 'CRITICAL' ? 'destructive' : 'secondary'}
                  className="text-[10px] px-2 py-0"
                >
                  {task.priority}
                </Badge>
              </div>
              
              <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {task.targetElement}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {task.instruction}
              </p>
            </div>

            <div className="pt-3 border-t border-border/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <AlertCircle className="w-3 h-3" />
                  <span>X:{Math.round(task.coordinates.x)} Y:{Math.round(task.coordinates.y)} Z:{Math.round(task.coordinates.z)}</span>
                </div>
                {task.clash?.suggestedReroute?.secondaryConflict && (
                  <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive bg-destructive/5 px-1 py-0">
                    Conflict Detected
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => onVisualize(task)}
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-8 text-xs gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Visualize
                </Button>
                <Button 
                  onClick={() => onApply(task)}
                  size="sm" 
                  className="flex-1 h-8 text-xs gap-1.5 gradient-bg"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
