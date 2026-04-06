import { useState, useCallback, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DashboardStats from '@/components/DashboardStats';
import IFCUploader from '@/components/IFCUploader';
import BuildingViewer3D from '@/components/BuildingViewer3D';
import ClashTable from '@/components/ClashTable';
import ClashVisualization from '@/components/ClashVisualization';
import ReroutingSchedule, { ReroutingTask } from '@/components/ReroutingSchedule';
import RerouteViewer3D from '@/components/RerouteViewer3D';
import CopilotPanel from '@/components/CopilotPanel';
import RerouteResults from '@/components/RerouteResults';
import ReroutedViewer3D from '@/components/ReroutedViewer3D';
import IFCViewer from '@/components/ui/IFCViewer';
import { Clash, MEPElement } from '@/lib/clashEngine';
import { IFCModel } from '@/lib/ifcParser';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, FileDown, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [elements, setElements] = useState<MEPElement[]>([]);
  const [clashes, setClashes] = useState<Clash[]>([]);
  const [model, setModel] = useState<IFCModel | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reroutingSchedule, setReroutingSchedule] = useState<ReroutingTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualizingTask, setVisualizingTask] = useState<ReroutingTask | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [rerouteResults, setRerouteResults] = useState<any[]>([]);
  const [solvedElementIds, setSolvedElementIds] = useState<string[]>([]);
  const [selectedClash, setSelectedClash] = useState<Clash | null>(null);
  const [selectedReroute, setSelectedReroute] = useState<any>(null);
  const [ifcFileUrl, setIfcFileUrl] = useState<string>('');

  const handleModelLoaded = useCallback((m: IFCModel, file: File) => {
    setModel(m);
    setCurrentFile(file);
    setElements(m.elements);
    
    // Create blob URL for the IFC file for visualization
    const fileUrl = URL.createObjectURL(file);
    setIfcFileUrl(fileUrl);
    
    setActiveTab('dashboard');
    setReportText(null);
    setClashes([]);
    setReroutingSchedule([]);
    setRerouteResults([]);
    setSolvedElementIds([]);
    setSelectedClash(null);
    setSelectedReroute(null);
    window.localStorage.removeItem('solvedRerouteIds');
  }, []);

  const runDetection = useCallback(async () => {
    if (!model) return;
    
    setIsAnalyzing(true);
    toast.info("Starting backend clash analysis...");

    try {
      const response = await fetch('http://localhost:3001/api/clash-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements: elements,
          metadata: model.metadata
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      const activeClashes = data.clashes.filter((clash: Clash) => {
        return ![clash.elementA.id, clash.elementB.id].some(id => solvedElementIds.includes(id));
      });
      setClashes(activeClashes);
      setReportText(data.reportText);
      if (data.reportJson && data.reportJson.reroutingSchedule) {
        // Map clashes to tasks for visualization
        const tasksWithClashes = data.reportJson.reroutingSchedule.map((task: any) => {
          const originalClash = activeClashes.find((c: any) => c.id === task.taskId);
          return { ...task, clash: originalClash };
        }).filter((task: any) => task.clash);
        setReroutingSchedule(tasksWithClashes);
      }
      setActiveTab('clashes');
      toast.success(`Analysis complete: ${activeClashes.length} clashes detected`);
    } catch (error) {
      console.error('Clash analysis error:', error);
      toast.error("Failed to perform backend analysis");
    } finally {
      setIsAnalyzing(false);
    }
  }, [elements, model, solvedElementIds]);

  const downloadReport = useCallback(() => {
    if (!reportText) return;

    // Download text report
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clash_Report_${model?.metadata.project || 'BIM'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Download JSON data including reroute results
    const jsonData = {
      project: model?.metadata.project || 'BIM',
      timestamp: new Date().toISOString(),
      clashes: clashes,
      rerouteResults: rerouteResults,
      elements: elements,
      metadata: model?.metadata
    };

    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonA = document.createElement('a');
    jsonA.href = jsonUrl;
    jsonA.download = `BIM_Data_${model?.metadata.project || 'BIM'}.json`;
    document.body.appendChild(jsonA);
    jsonA.click();
    document.body.removeChild(jsonA);
    URL.revokeObjectURL(jsonUrl);

    toast.success("Reports downloaded successfully");
  }, [reportText, model, clashes, rerouteResults, elements]);

  const handleResolve = useCallback((id: string) => {
    setClashes(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' as const } : c));
  }, []);

  const handleVisualizeClash = useCallback((clash: Clash) => {
    setSelectedClash(clash);
    setSelectedReroute(null);
  }, []);

  const persistSolvedIds = useCallback((ids: string[]) => {
    try {
      window.localStorage.setItem('solvedRerouteIds', JSON.stringify(ids));
    } catch (error) {
      console.warn('Unable to persist solved reroute IDs', error);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('solvedRerouteIds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSolvedElementIds(parsed);
        }
      }
    } catch (error) {
      console.warn('Unable to load solved reroute IDs from localStorage', error);
    }
  }, []);

  const applyReroute = useCallback(async (task?: ReroutingTask) => {
    if (!elements.length || (!clashes.length && !task?.clash)) return;

    toast.info("Applying rerouting...");
    const selectedClashes = task?.clash ? [task.clash] : clashes;

    try {
      const response = await fetch('http://localhost:3001/api/reroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements: elements,
          clashes: selectedClashes
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || `Reroute failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("reroute result", data);
      const rerouted = Array.isArray(data.rerouted) ? data.rerouted : [];
      const updatedElements = Array.isArray(data.updatedElements) ? data.updatedElements : elements;
      const reroutedElementIds = rerouted.map((r: any) => r.elementId);
      const nextSolvedIds = [...new Set([...solvedElementIds, ...reroutedElementIds])];
      setSolvedElementIds(nextSolvedIds);
      persistSolvedIds(nextSolvedIds);

      // Store reroute results for display
      setRerouteResults(rerouted);

      // Update visualization with reroute results
      if (selectedClash && rerouted.length > 0) {
        const matchingReroute = rerouted.find((r: any) => 
          r.elementId === selectedClash.elementA.id || r.elementId === selectedClash.elementB.id
        );
        if (matchingReroute) {
          setSelectedReroute({ newBoundingBox: matchingReroute.newBoundingBox });
        }
      }

      // Update elements with new positions
      setElements(updatedElements);

      // Remove solved clashes from current list immediately
      setClashes(prev => prev.filter(clash => {
        return ![clash.elementA.id, clash.elementB.id].some(id => nextSolvedIds.includes(id));
      }));

      // Keep the rerouting schedule alive, but remove tasks that are solved
      setReroutingSchedule(prev => prev.filter(taskItem => {
        const ids = [taskItem.clash?.elementA.id, taskItem.clash?.elementB.id].filter(Boolean) as string[];
        return !ids.some(id => nextSolvedIds.includes(id));
      }));

      toast.success(`Rerouting applied: ${rerouted.length} elements moved`);

      // Re-run clash detection to verify remaining clashes
      setTimeout(async () => {
        try {
          const clashResponse = await fetch('http://localhost:3001/api/clash-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              elements: updatedElements,
              metadata: model?.metadata
            })
          });

          if (clashResponse.ok) {
            const clashData = await clashResponse.json();
            const filteredClashes = clashData.clashes.filter((clash: Clash) => {
              return ![clash.elementA.id, clash.elementB.id].some(id => nextSolvedIds.includes(id));
            });
            setClashes(filteredClashes);
            console.log("New clashes after reroute:", filteredClashes.length);
            if (filteredClashes.length === 0) {
              toast.success("All clashes resolved!");
            } else {
              toast.warning(`${filteredClashes.length} clashes remain`);
            }
          }
        } catch (error) {
          console.error('Error re-checking clashes:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('Reroute error:', error);
      toast.error(error.message || "Failed to apply rerouting");
    }
  }, [elements, clashes, model, solvedElementIds]);

  const goBackFromReroute = useCallback(() => {
    const reroutedElementIds = rerouteResults.map(r => r.elementId);
    const nextSolvedIds = [...new Set([...solvedElementIds, ...reroutedElementIds])];

    // Remove solved clashes from the list so they are no longer shown
    setClashes(prev => prev.filter(clash => {
      return ![clash.elementA.id, clash.elementB.id].some(id => nextSolvedIds.includes(id));
    }));

    // Persist rerouted element ids in memory
    setSolvedElementIds(nextSolvedIds);
    persistSolvedIds(nextSolvedIds);

    setRerouteResults([]);
    setActiveTab('clashes');

    toast.success("Returned to clash analysis. Solved clashes are now marked safe.");
  }, [rerouteResults, solvedElementIds]);

  const reset = useCallback(() => {
    setElements([]);
    setClashes([]);
    setModel(null);
    setCurrentFile(null);
    setReportText(null);
    setReroutingSchedule([]);
    setRerouteResults([]);
    setSolvedElementIds([]);
    window.localStorage.removeItem('solvedRerouteIds');
    setActiveTab('upload');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {model ? model.metadata.project : 'Welcome'}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {model
                    ? `${model.metadata.elementCount} elements • ${model.metadata.disciplines.join(', ')}`
                    : 'Upload an IFC model to get started'}
                </p>
              </div>
              {elements.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={runDetection} disabled={isAnalyzing} className="gap-2 gradient-bg">
                    {isAnalyzing ? "Analyzing..." : <><Play className="w-4 h-4" /> Run Detection</>}
                  </Button>
                  {reportText && (
                    <Button onClick={downloadReport} variant="outline" className="gap-2">
                      <FileDown className="w-4 h-4" /> Download Report
                    </Button>
                  )}
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </Button>
                </div>
              )}
            </div>

            <DashboardStats 
              clashes={clashes} 
              elements={elements} 
              accuracy={model?.metadata.processingAccuracy || 0.98} 
            />

            <BuildingViewer3D ifcFile={currentFile} />

            {clashes.length > 0 && <ClashVisualization clashes={clashes} />}

            {elements.length === 0 && (
              <div className="glass-panel rounded-xl p-12 text-center card-shadow">
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                  <Play className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">No Model Loaded</h2>
                <p className="text-sm text-muted-foreground mb-4">Upload an IFC file to begin clash detection analysis</p>
                <Button onClick={() => setActiveTab('upload')} className="gradient-bg">
                  Go to Upload
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Upload IFC Model</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Import your BIM model for clash detection analysis</p>
            </div>
            <IFCUploader onModelLoaded={handleModelLoaded} />
          </div>
        )}

        {activeTab === 'clashes' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analysis Results</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {clashes.length} conflicts identified for rerouting
                </p>
              </div>
              {elements.length > 0 && (
                <div className="flex gap-2">
                  {reportText && (
                    <Button onClick={downloadReport} variant="outline" className="gap-2">
                      <FileDown className="w-4 h-4" /> Download Schedule
                    </Button>
                  )}
                  <Button onClick={runDetection} disabled={isAnalyzing} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" /> {isAnalyzing ? "Analyzing..." : "Re-run"}
                  </Button>
                </div>
              )}
            </div>

            {reroutingSchedule.length > 0 && (
              <ReroutingSchedule 
                tasks={reroutingSchedule} 
                onVisualize={(task) => setVisualizingTask(task)}
                onApply={applyReroute}
                onApplyAll={() => applyReroute()}
              />
            )}

            {rerouteResults.length > 0 && (
              <div className="flex justify-between items-center gap-4 mb-4">
                <div className="text-sm text-muted-foreground">Reroute completed. Verified solution data is saved and safe.</div>
                <Button onClick={goBackFromReroute} className="gradient-bg gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Clash Results
                </Button>
              </div>
            )}

            {rerouteResults.length > 0 && (
              <RerouteResults results={rerouteResults} />
            )}

            {rerouteResults.length > 0 && (
              <ReroutedViewer3D elements={elements} rerouteResults={rerouteResults} />
            )}

            {clashes.length > 0 ? (
              <div className="pt-4 border-t border-border/50">
                <ClashTable clashes={clashes} onResolve={handleResolve} onVisualize={handleVisualizeClash} />
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-12 text-center card-shadow">
                <p className="text-muted-foreground">
                  {elements.length > 0
                    ? 'Click "Run Detection" on the dashboard to analyze clashes.'
                    : 'Upload a model first, then run clash detection.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Back Button */}
      {rerouteResults.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={goBackFromReroute}
            className="gradient-bg shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-5 py-3 flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      )}

      <CopilotPanel 
        clashes={clashes} 
        elements={elements}
        onRerouteAll={runDetection}
        isAnalyzing={isAnalyzing}
      />

      {visualizingTask && visualizingTask.clash && (
        <RerouteViewer3D 
          clash={visualizingTask.clash}
          allElements={elements}
          onClose={() => setVisualizingTask(null)}
        />
      )}

      {/* Clash Visualization Panel */}
      {selectedClash && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
            <div>
              <h2 className="text-xl font-bold text-foreground">Clash Visualization: {selectedClash.id}</h2>
              <p className="text-sm text-muted-foreground">
                Conflict between <span className="text-clash-hard font-semibold">{selectedClash.elementA.name}</span> and <span className="text-clash-hard font-semibold">{selectedClash.elementB.name}</span>
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedClash(null);
                setSelectedReroute(null);
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Close viewer"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Viewer */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">3D Model View</h3>
                <IFCViewer 
                  ifcUrl={ifcFileUrl}
                  clash={selectedClash}
                  reroute={selectedReroute}
                  showStats={false}
                />
              </div>

              {/* Clash Info Panel */}
              <div className="glass-panel rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Clash Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Clash ID:</span>
                      <p className="font-mono text-foreground">{selectedClash.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-mono text-foreground">{selectedClash.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-mono text-foreground">
                        ({Math.round(selectedClash.point.x)}, {Math.round(selectedClash.point.y)}, {Math.round(selectedClash.point.z)})
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-mono text-foreground">{selectedClash.status}</p>
                    </div>
                  </div>
                </div>

                {/* Element A Details */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Element A</h4>
                  <div className="bg-muted/50 rounded p-3 text-xs space-y-1 font-mono text-muted-foreground">
                    <div><span className="text-foreground">ID:</span> {selectedClash.elementA.id}</div>
                    <div><span className="text-foreground">Name:</span> {selectedClash.elementA.name}</div>
                    <div><span className="text-foreground">Type:</span> {selectedClash.elementA.type}</div>
                    <div><span className="text-foreground">Discipline:</span> {selectedClash.elementA.discipline}</div>
                  </div>
                </div>

                {/* Element B Details */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Element B</h4>
                  <div className="bg-muted/50 rounded p-3 text-xs space-y-1 font-mono text-muted-foreground">
                    <div><span className="text-foreground">ID:</span> {selectedClash.elementB.id}</div>
                    <div><span className="text-foreground">Name:</span> {selectedClash.elementB.name}</div>
                    <div><span className="text-foreground">Type:</span> {selectedClash.elementB.type}</div>
                    <div><span className="text-foreground">Discipline:</span> {selectedClash.elementB.discipline}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    handleResolve(selectedClash.id);
                    setSelectedClash(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Mark as Resolved
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedClash(null);
                    setSelectedReroute(null);
                  }}
                  className="flex-1 gradient-bg"
                >
                  Close Viewer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
