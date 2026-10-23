import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Sparkles } from 'lucide-react';

interface BloodCellCanvas3DProps {
  className?: string;
  showControls?: boolean;
}

export const BloodCellCanvas3D: React.FC<BloodCellCanvas3DProps> = ({
  className = '',
  showControls = true
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [pulseSpeed, setPulseSpeed] = useState<number>(1);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRotating(false);
    }

    // Scene setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglSupported(false);
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xff4444, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(5, 8, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xef4444, 3.0);
    dirLight2.position.set(-6, -4, -4);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0x38bdf8, 2.0, 50);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    const backLight = new THREE.DirectionalLight(0xff3344, 2.0);
    backLight.position.set(0, -6, -6);
    scene.add(backLight);

    // Function to generate mathematically accurate, watertight, solid biconcave red blood cell geometry
    const createErythrocyteGeometry = (radius: number, radialSegs = 64, tubularSegs = 64): THREE.BufferGeometry => {
      // Based on Evans-Fung biconcave discoid equation:
      // z(r) = 0.5 * D * sqrt(1 - (2r/D)^2) * (c0 + c1*(2r/D)^2 + c2*(2r/D)^4)
      const points: THREE.Vector2[] = [];
      const D = radius * 2;
      const c0 = 0.207;
      const c1 = 2.003;
      const c2 = -1.122;

      const calcZ = (r: number) => {
        const normR = (2 * r) / D;
        const term = Math.max(0, 1 - normR * normR);
        return 0.5 * D * Math.sqrt(term) * (c0 + c1 * Math.pow(normR, 2) + c2 * Math.pow(normR, 4)) * 0.46;
      };

      // 1. Bottom concave surface: from center axis (r = 0.001, z = -z(0)) outward to rounded rim (r = radius, z = 0)
      for (let i = 0; i <= radialSegs; i++) {
        const r = 0.001 + (i / radialSegs) * (radius - 0.001);
        points.push(new THREE.Vector2(r, -calcZ(r)));
      }

      // 2. Top concave surface: from rounded rim (r = radius, z = 0) inward back to center axis (r = 0.001, z = +z(0))
      for (let i = radialSegs - 1; i >= 0; i--) {
        const r = 0.001 + (i / radialSegs) * (radius - 0.001);
        points.push(new THREE.Vector2(r, calcZ(r)));
      }

      // Lathe curve around y-axis to form complete biconcave disc
      const lathe = new THREE.LatheGeometry(points, tubularSegs);
      lathe.center();
      lathe.computeVertexNormals();
      return lathe;
    };

    // Realistic Ruby Red Blood Cell Material
    const cellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcc1111,
      emissive: 0x330000,
      roughness: 0.28,
      metalness: 0.1,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2,
      reflectivity: 0.8,
      side: THREE.DoubleSide
    });

    // Secondary Material for variety
    const cellMaterialGloss = new THREE.MeshPhysicalMaterial({
      color: 0xee2222,
      emissive: 0x440505,
      roughness: 0.22,
      metalness: 0.08,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide
    });

    // Group for all rotating blood cells
    const cellGroup = new THREE.Group();
    scene.add(cellGroup);

    // Hero Main Center Blood Cell
    const mainGeometry = createErythrocyteGeometry(2.4);
    const mainCell = new THREE.Mesh(mainGeometry, cellMaterial);
    mainCell.rotation.x = 0.6;
    mainCell.rotation.y = 0.4;
    cellGroup.add(mainCell);

    // Additional floating blood cells
    interface FloatingCell {
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      rotSpeedX: number;
      rotSpeedY: number;
      floatSpeed: number;
      floatOffset: number;
    }

    const floatingCells: FloatingCell[] = [];
    const cellConfigs = [
      { r: 1.5, pos: [-3.8, 1.8, -2], rot: [0.3, 0.5, 0.2], mat: cellMaterialGloss },
      { r: 1.3, pos: [4.2, -1.5, -1.5], rot: [-0.4, 0.8, -0.3], mat: cellMaterial },
      { r: 1.1, pos: [-3.2, -2.4, 1.2], rot: [0.7, -0.2, 0.5], mat: cellMaterialGloss },
      { r: 0.9, pos: [3.5, 2.5, -3], rot: [-0.6, -0.5, 0.1], mat: cellMaterial },
      { r: 0.7, pos: [1.2, -3.2, -4], rot: [0.2, 0.9, -0.4], mat: cellMaterialGloss }
    ];

    const floatingGeometries: THREE.BufferGeometry[] = [];

    cellConfigs.forEach((cfg, idx) => {
      const geom = createErythrocyteGeometry(cfg.r);
      floatingGeometries.push(geom);
      const mesh = new THREE.Mesh(geom, cfg.mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      cellGroup.add(mesh);

      floatingCells.push({
        mesh,
        baseX: cfg.pos[0],
        baseY: cfg.pos[1],
        baseZ: cfg.pos[2],
        rotSpeedX: 0.008 + (idx % 3) * 0.004,
        rotSpeedY: 0.012 + (idx % 2) * 0.005,
        floatSpeed: 0.8 + (idx % 3) * 0.4,
        floatOffset: idx * 1.5
      });
    });

    // Plasma Micro-particles
    const particleCount = 90;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      particleScales[i] = Math.random() * 0.8 + 0.3;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff6666,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Parallax Interaction
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.45;
      targetRotX = -y * 0.35;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime() * pulseSpeed;

      // Mouse Parallax Lerp
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      cellGroup.rotation.x = currentRotX;
      cellGroup.rotation.y = currentRotY;

      if (isRotating && !prefersReducedMotion) {
        // Main Cell Gentle Oscillation & Spin
        mainCell.rotation.y += 0.008 * pulseSpeed;
        mainCell.rotation.z += 0.004 * pulseSpeed;
        mainCell.position.y = Math.sin(elapsedTime * 1.4) * 0.22;

        // Floating Secondary Cells
        floatingCells.forEach((c) => {
          c.mesh.rotation.x += c.rotSpeedX * pulseSpeed;
          c.mesh.rotation.y += c.rotSpeedY * pulseSpeed;
          c.mesh.position.y = c.baseY + Math.sin(elapsedTime * c.floatSpeed + c.floatOffset) * 0.3;
        });

        // Drift Plasma Particles
        particles.rotation.y = elapsedTime * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 500;
      const newH = container.clientHeight || 450;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      mainGeometry.dispose();
      floatingGeometries.forEach((g) => g.dispose());
      cellMaterial.dispose();
      cellMaterialGloss.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [isRotating, pulseSpeed]);

  if (!webglSupported) {
    return (
      <div className={`relative flex items-center justify-center p-8 bg-red-950/20 rounded-3xl border border-red-900/30 ${className}`}>
        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-red-600 to-red-400 blur-xl opacity-80 animate-pulse"></div>
        <p className="absolute text-xs text-red-300 font-bold">3D Visualizer Active</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden rounded-3xl group ${className}`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border border-red-200 dark:border-red-500/30 text-[11px] font-bold text-red-700 dark:text-red-400 shadow-md pointer-events-none transition-colors">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        <span className="tracking-wide">Interactive 3D Erythrocyte Specimen</span>
      </div>

      {/* Interactive Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl opacity-90 hover:opacity-100 transition-all">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isRotating ? 'bg-red-50 dark:bg-red-600/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/40' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400'
            }`}
            title="Toggle 3D Rotation"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span className="text-[10px] hidden sm:inline">{isRotating ? 'Active' : 'Paused'}</span>
          </button>

          <button
            onClick={() => setPulseSpeed(prev => (prev === 1 ? 1.8 : prev === 1.8 ? 0.6 : 1))}
            className="p-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 flex items-center gap-1 transition-all"
            title="Adjust Blood Flow Speed"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-[10px] hidden sm:inline">{pulseSpeed}x Flow</span>
          </button>
        </div>
      )}

      {/* Ambient Radial Glow */}
      <div className="absolute -z-10 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};
