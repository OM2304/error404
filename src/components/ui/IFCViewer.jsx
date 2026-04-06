import { useEffect, useRef, useState } from "react";
import { IfcViewerAPI } from "web-ifc-viewer";
import * as THREE from "three";

export default function IFCViewer({
  ifcUrl,
  clash,
  reroute,
  onReady = () => {},
  showStats = true
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize viewer and load model
  useEffect(() => {
    if (!containerRef.current || !ifcUrl) {
      setLoading(false);
      return;
    }

    let viewer = null;
    let modelID = null;

    const initializeViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create viewer instance
        viewer = new IfcViewerAPI({
          container: containerRef.current,
          backgroundColor: new THREE.Color(0.95, 0.95, 0.95),
        });

        viewerRef.current = viewer;

        // Set WASM path for web-ifc
        viewer.IFC.setWasmPath("https://unpkg.com/web-ifc@0.0.77/");

        // Load IFC model
        modelID = await viewer.IFC.loadIfcUrl(ifcUrl);

        // Setup scene
        viewer.shadowDropper.renderShadow(modelID);
        viewer.context.renderer.postProduction.active = true;

        // Setup camera
        viewer.context.ifcCamera.cameraControls.setPosition(0, 2500, 3000, 0, 2500, 0, true);

        // Show stats if requested
        if (showStats && viewer.context.renderer.stats) {
          viewer.context.renderer.stats.showPanel(0);
          document.body.appendChild(viewer.context.renderer.stats.dom);
        }

        // Clear any existing markers
        clearMarkers(viewer);

        // Add clash visualization if provided
        if (clash && clash.point) {
          showClashPoint(viewer, clash.point);
        }

        // Add reroute visualization if provided
        if (reroute && reroute.newBoundingBox) {
          showRerouteBox(viewer, reroute.newBoundingBox);
        }

        setIsLoading(false);
        onReady(viewer);
      } catch (err) {
        console.error("Error initializing IFC viewer:", err);
        setError(err.message || "Failed to load IFC model");
        setIsLoading(false);
      }
    };

    initializeViewer();

    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        clearMarkers(viewerRef.current);
        viewerRef.current.dispose();
      }
    };
  }, [ifcUrl, onReady, showStats]);

  // Update clash visualization
  useEffect(() => {
    if (!viewerRef.current || !clash) return;

    clearMarkers(viewerRef.current);

    if (clash.point) {
      showClashPoint(viewerRef.current, clash.point);
    }
  }, [clash]);

  // Update reroute visualization
  useEffect(() => {
    if (!viewerRef.current || !reroute) return;

    if (reroute.newBoundingBox) {
      showRerouteBox(viewerRef.current, reroute.newBoundingBox);
    }
  }, [reroute]);

  return (
    <div className="relative w-full h-[500px] bg-muted rounded-lg overflow-hidden border border-border/50">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Loading 3D Model...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/10">
          <div className="text-center p-4">
            <p className="text-sm font-medium text-red-600 mb-2">Error Loading Model</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Visualization Info */}
      {!isLoading && !error && (clash || reroute) && (
        <div className="absolute top-3 right-3 bg-card/80 backdrop-blur border border-border/50 rounded-lg p-2 text-xs text-muted-foreground space-y-1">
          {clash && <div>🔴 Clash Point: ({Math.round(clash.point.x)}, {Math.round(clash.point.y)}, {Math.round(clash.point.z)})</div>}
          {reroute && <div>🟢 Reroute Path Shown (Wireframe)</div>}
        </div>
      )}
    </div>
  );
}

/* ---------- Helper Functions ---------- */

/**
 * Clear all markers and overlays from the scene
 */
function clearMarkers(viewer) {
  if (!viewer || !viewer.context || !viewer.context.scene) return;

  // Remove clash markers and reroute boxes
  const toRemove = [];
  viewer.context.scene.children.forEach((child) => {
    if (child.userData && (child.userData.isClashMarker || child.userData.isRerouteBox)) {
      toRemove.push(child);
    }
  });

  toRemove.forEach((child) => {
    viewer.context.scene.remove(child);
  });
}

/**
 * Display red sphere at clash point with camera focus
 */
function showClashPoint(viewer, point) {
  if (!viewer || !viewer.context || !viewer.context.scene || !point) return;

  const radius = 300; // Adjust based on model scale
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xff3333,
    emissiveIntensity: 0.8,
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(point.x, point.y, point.z);
  sphere.userData.isClashMarker = true;

  // Add glow effect using post-processing
  sphere.layers.set(1);

  viewer.context.scene.add(sphere);

  // Animate camera to clash point
  if (viewer.context.ifcCamera && viewer.context.ifcCamera.cameraControls) {
    const cameraDistance = 2000;
    const cameraPos = {
      x: point.x,
      y: point.y + cameraDistance * 0.5,
      z: point.z + cameraDistance,
    };

    viewer.context.ifcCamera.cameraControls.setLookAt(
      cameraPos.x,
      cameraPos.y,
      cameraPos.z,
      point.x,
      point.y,
      point.z,
      true // smooth animation
    );
  }

  // Add blinking animation
  let blink = true;
  const interval = setInterval(() => {
    if (!sphere.parent) {
      clearInterval(interval);
      return;
    }
    blink = !blink;
    sphere.material.emissiveIntensity = blink ? 0.8 : 0.3;
  }, 600);
}

/**
 * Display green wireframe box for rerouted bounding box
 */
function showRerouteBox(viewer, box) {
  if (!viewer || !viewer.context || !viewer.context.scene || !box) return;

  const sizeX = Math.max(100, box.max.x - box.min.x);
  const sizeY = Math.max(100, box.max.y - box.min.y);
  const sizeZ = Math.max(100, box.max.z - box.min.z);

  const geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
  const material = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    wireframe: true,
    emissive: 0x22c55e,
    emissiveIntensity: 0.5,
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(
    box.min.x + sizeX / 2,
    box.min.y + sizeY / 2,
    box.min.z + sizeZ / 2
  );
  cube.userData.isRerouteBox = true;

  viewer.context.scene.add(cube);
}

/**
 * Create a visualization marker for element bounding boxes
 */
function showElementBox(viewer, box, color = 0x3b82f6) {
  if (!viewer || !viewer.context || !viewer.context.scene || !box) return;

  const sizeX = Math.max(100, box.max.x - box.min.x);
  const sizeY = Math.max(100, box.max.y - box.min.y);
  const sizeZ = Math.max(100, box.max.z - box.min.z);

  const geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
  const material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 2,
  });

  const edges = new THREE.EdgesGeometry(geometry);
  const wireframe = new THREE.LineSegments(edges, material);
  wireframe.position.set(
    box.min.x + sizeX / 2,
    box.min.y + sizeY / 2,
    box.min.z + sizeZ / 2
  );
  wireframe.userData.isElementBox = true;

  viewer.context.scene.add(wireframe);
}