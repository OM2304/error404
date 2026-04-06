import { Box, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'upload', label: 'Upload IFC' },
    { id: 'clashes', label: 'Clash Results' },
  ];

  return (
    <header className="glass-panel border-b border-border/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <Box className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">AI BIM</span>
              <Zap className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs text-muted-foreground font-medium">Clash Detection</span>
            </div>
          </div>

          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'gradient-bg text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
