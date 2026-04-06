import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Clash, MEPElement } from '@/lib/clashEngine';

interface ElementModelProps {
  box: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  type?: string;
  color: string;
  opacity?: number;
  label?: string;
  wireframe?: boolean;
}

function ElementModel({ box, type, color, opacity = 1, label, wireframe = false }: ElementModelProps) {
  const dx = Math.max(0.1, box.max.x - box.min.x) / 1000;
  const dy = Math.max(0.1, box.max.y - box.min.y) / 1000;
  const dz = Math.max(0.1, box.max.z - box.min.z) / 1000;
  
  const size = [dx, dy, dz];
  const position = [
    (box.min.x + box.max.x) / 2000,
    (box.min.z + box.max.z) / 2000,
    (box.min.y + box.max.y) / 2000
  ];

  const isRound = type === 'pipe' || type === 'conduit';

  return (
    <group position={position as [number, number, number]}>
      <mesh>
        {isRound ? (
          // For pipes, we use a cylinder. We find the longest axis to orient it.
          <cylinderGeometry 
            args={[
              Math.min(dx, dz) / 2, // radiusTop
              Math.min(dx, dz) / 2, // radiusBottom
              dy,                  // height
              16                   // segments
            ]} 
          />
        ) : (
          <boxGeometry args={size as [number, number, number]} />
        )}
        <meshStandardMaterial 
          color={color} 
          transparent={opacity < 1} 
          opacity={opacity} 
          wireframe={wireframe}
          emissive={color}
          emissiveIntensity={opacity < 1 ? 0 : 0.2}
        />
      </mesh>
      {label && (
        <Text
          position={[0, dy / 2 + 0.2, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

interface RerouteViewer3DProps {
  clash: any; // Using any because of the extended clash structure from backend
  allElements: MEPElement[];
  onClose: () => void;
}

export default function RerouteViewer3D({ clash, allElements, onClose }: RerouteViewer3DProps) {
  const reroute = clash.suggestedReroute;
  
  // Find other elements that are close to the clash point to show context
  const contextElements = useMemo(() => {
    const range = 5000; // 5 meters
    return allElements.filter(el => {
      if (el.id === clash.elementA.id || el.id === clash.elementB.id) return false;
      const dist = Math.sqrt(
        Math.pow(el.boundingBox.min.x - clash.point.x, 2) +
        Math.pow(el.boundingBox.min.y - clash.point.y, 2) +
        Math.pow(el.boundingBox.min.z - clash.point.z, 2)
      );
      return dist < range;
    });
  }, [allElements, clash]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Reroute Visualization: {clash.id}</h2>
          <p className="text-sm text-muted-foreground">
            Resolving conflict between <span className="text-clash-hard font-semibold">{clash.elementA.name}</span> and <span className="text-clash-hard font-semibold">{clash.elementB.name}</span>
          </p>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all font-bold"
        >
          Close Viewer
        </button>
      </div>

      <div className="flex-1 relative">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[3, 3, 3]} fov={40} />
          <OrbitControls makeDefault minDistance={1} maxDistance={15} />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          
          <Grid 
            infiniteGrid 
            fadeDistance={20} 
            fadeStrength={5} 
            cellSize={1} 
            sectionSize={5} 
            sectionThickness={1.5} 
            sectionColor="#333" 
            cellColor="#222"
          />

          {/* Original Elements in Clash (Red) */}
          <ElementModel 
            box={clash.elementA.boundingBox} 
            type={clash.elementA.type}
            color="#ef4444" 
            opacity={0.8} 
            label="Original A" 
          />
          <ElementModel 
            box={clash.elementB.boundingBox} 
            type={clash.elementB.type}
            color="#ef4444" 
            opacity={0.8} 
            label="Original B" 
          />

          {/* Suggested Reroute (Green) */}
          <ElementModel 
            box={reroute.suggestedBox} 
            type={clash.elementA.id === reroute.elementId ? clash.elementA.type : clash.elementB.type}
            color="#22c55e" 
            opacity={1} 
            label="AI Reroute" 
          />

          {/* Context Elements (Grey/Transparent) */}
          {contextElements.map(el => (
            <ElementModel 
              key={el.id}
              box={el.boundingBox} 
              type={el.type}
              color="#666" 
              opacity={0.2} 
              wireframe
            />
          ))}

          <Environment preset="city" />
        </Canvas>

        {/* Info Panel Overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-4 pointer-events-none">
          <div className="glass-panel p-4 rounded-xl border-l-4 border-l-status-resolved flex-1 pointer-events-auto max-w-md">
            <h4 className="font-bold text-status-resolved mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> AI Rerouting Plan
            </h4>
            <p className="text-sm text-foreground leading-relaxed">
              {reroute.description}
            </p>
            {!reroute.isClear && (
              <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                <span>Secondary Conflict Detected with: {reroute.secondaryConflict}</span>
              </div>
            )}
            {reroute.isClear && (
              <div className="mt-3 p-2 rounded bg-status-resolved/10 border border-status-resolved/20 text-xs text-status-resolved flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                <span>Clear Route: No secondary clashes detected in new path.</span>
              </div>
            )}
          </div>

          <div className="glass-panel p-4 rounded-xl border-l-4 border-l-primary flex-1 pointer-events-auto max-w-sm">
            <h4 className="font-bold text-primary mb-2">3D Controls</h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>• Left Click: Rotate View</li>
              <li>• Scroll: Zoom In/Out</li>
              <li>• Right Click: Pan Camera</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2, AlertCircle } from 'lucide-react';
