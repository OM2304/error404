import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MEPElement } from '@/lib/clashEngine';

interface ReroutedViewer3DProps {
  elements: MEPElement[];
  rerouteResults: any[];
}

export default function ReroutedViewer3D({ elements, rerouteResults }: ReroutedViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f9ff);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(5000, 5000, 5000);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1000, 1000, 1000);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10000, 50, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);

    // Create boxes for elements
    elements.forEach((element) => {
      const box = element.boundingBox;
      const width = box.max.x - box.min.x;
      const height = box.max.y - box.min.y;
      const depth = box.max.z - box.min.z;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({
        color: 0x4f46e5,
        transparent: true,
        opacity: 0.7
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        box.min.x + width / 2,
        box.min.y + height / 2,
        box.min.z + depth / 2
      );

      // Check if this element was rerouted
      const rerouteResult = rerouteResults.find(r => r.elementId === element.id);
      if (rerouteResult) {
        // Highlight rerouted elements in green
        material.color.setHex(0x10b981);
        material.opacity = 0.9;

        // Add a label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 128;
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, 256, 128);
        context.fillStyle = 'white';
        context.font = 'Bold 20px Arial';
        context.textAlign = 'center';
        context.fillText('REROUTED', 128, 40);
        context.fillText(element.id, 128, 80);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(mesh.position.x, mesh.position.y + height / 2 + 200, mesh.position.z);
        sprite.scale.set(500, 250, 1);
        scene.add(sprite);
      }

      scene.add(mesh);
    });

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [elements, rerouteResults]);

  if (elements.length === 0) {
    return (
      <Card className="glass-panel rounded-xl">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No elements to visualize</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded-full" />
          3D Rerouting Visualization
          {rerouteResults.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {rerouteResults.length} rerouted
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border"
        />
        <div className="mt-4 text-sm text-muted-foreground">
          <p>• Blue boxes: Original elements</p>
          <p>• Green boxes: Rerouted elements</p>
          <p>• Use mouse to orbit, zoom, and pan</p>
        </div>
      </CardContent>
    </Card>
  );
}