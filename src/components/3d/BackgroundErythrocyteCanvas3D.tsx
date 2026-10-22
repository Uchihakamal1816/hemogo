import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ThemeMode } from '../../services/themeService';

interface BackgroundErythrocyteCanvas3DProps {
  theme: ThemeMode;
}

export const BackgroundErythrocyteCanvas3D: React.FC<BackgroundErythrocyteCanvas3DProps> = ({ theme }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    
    let width = window.innerWidth;
    let height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = theme === 'light' ? 1.35 : 1.15;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglSupported(false);
      return;
    }

    // Dynamic Lighting according to Theme
    const isLight = theme === 'light';

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(
      isLight ? 0xfff0f0 : 0x44050a, 
      isLight ? 2.2 : 1.4
    );
    scene.add(ambientLight);

    // Key Directional Light (Crisp White Specular Highlights)
    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 3.0 : 2.5);
    keyLight.position.set(6, 9, 10);
    scene.add(keyLight);

    // Warm Ruby Fill Light
    const fillLight = new THREE.DirectionalLight(0xd91627, isLight ? 2.5 : 2.8);
    fillLight.position.set(-8, -5, -4);
    scene.add(fillLight);

    // Secondary Specular / Rim Light
    const rimLight = new THREE.PointLight(isLight ? 0xff6666 : 0xff3b5c, isLight ? 2.4 : 3.0, 45);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Biconcave Erythrocyte Parametric Geometry Generator
    // Based on Evans-Fung biconcave discoid equation:
    // z(r) = 0.5 * D * sqrt(1 - (2r/D)^2) * (c0 + c1*(2r/D)^2 + c2*(2r/D)^4)
    const createErythrocyteGeometry = (radius: number, radialSegs = 64, tubularSegs = 64): THREE.BufferGeometry => {
      const points: THREE.Vector2[] = [];
      const D = radius * 2;
      const c0 = 0.207;
      const c1 = 2.003;
      const c2 = -1.122;

      for (let i = 0; i <= radialSegs; i++) {
        const r = (i / radialSegs) * radius;
        const normR = (2 * r) / D;
        const term = Math.max(0, 1 - normR * normR);
        const z = 0.5 * D * Math.sqrt(term) * (c0 + c1 * Math.pow(normR, 2) + c2 * Math.pow(normR, 4));
        points.push(new THREE.Vector2(Math.max(0.015, r), z * 0.46));
      }

      const lathe = new THREE.LatheGeometry(points, tubularSegs);
      lathe.center();
      lathe.computeVertexNormals();
      return lathe;
    };

    // Ultra-Refined Ruby Red Living Erythrocyte Material
    const cellMaterial = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xd61827 : 0xe11d48,
      emissive: isLight ? 0x240205 : 0x450309,
      roughness: 0.17,
      metalness: 0.04,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      transmission: isLight ? 0.15 : 0.2,
      ior: 1.42,
      sheen: 0.5,
      sheenColor: 0xff6677
    });

    // Secondary Material with intense gloss for foreground cells
    const cellMaterialGloss = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xdf1c2d : 0xf43f5e,
      emissive: isLight ? 0x2a0408 : 0x5a0710,
      roughness: 0.14,
      metalness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
      transmission: isLight ? 0.18 : 0.22,
      ior: 1.45,
      sheen: 0.6,
      sheenColor: 0xff7b8b
    });

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Floating Cells Data Structure
    interface FloatingMeshItem {
      mesh: THREE.Object3D;
      baseX: number;
      baseY: number;
      baseZ: number;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      floatSpeed: number;
      floatAmp: number;
      floatOffset: number;
      depthFactor: number; // for layered parallax
    }

    const floatingItems: FloatingMeshItem[] = [];

    // CELL CONFIGURATIONS MATCHING THE REFERENCE VISUAL:
    // 1. Top Left: angled disk
    // 2. Top Right: tilted disk
    // 3. Right Foreground: large prominent glossy erythrocyte
    // 4. Bottom Left: angled disk
    // 5. Bottom Center: small distant cell
    // 6. Additional atmospheric depth cells
    const cellsSetup = [
      // Top Left Cell (Angled)
      { r: 1.8, pos: [-4.6, 2.3, 0.2], rot: [1.2, 0.4, -0.3], mat: cellMaterialGloss, depth: 1.0 },
      // Top Right Cell (Facing viewer / tilted)
      { r: 1.3, pos: [3.2, 2.4, -0.8], rot: [0.4, 0.7, 0.1], mat: cellMaterial, depth: 0.8 },
      // Right Foreground Cell (Prominent Large Cell)
      { r: 2.3, pos: [4.4, -1.2, 1.6], rot: [-0.3, -0.4, 0.5], mat: cellMaterialGloss, depth: 1.3 },
      // Bottom Left Cell (Angled)
      { r: 1.7, pos: [-4.0, -2.6, 0.6], rot: [0.9, -0.3, 0.4], mat: cellMaterial, depth: 0.9 },
      // Bottom Center Cell (Small / Distant)
      { r: 0.85, pos: [0.6, -3.2, -1.8], rot: [0.5, 0.8, -0.2], mat: cellMaterialGloss, depth: 0.6 },
      // Deep Background Subtle Cells for Depth
      { r: 1.0, pos: [-6.8, -0.2, -4.5], rot: [0.3, 0.9, 0.2], mat: cellMaterial, depth: 0.4 },
      { r: 0.7, pos: [6.2, 3.4, -5.0], rot: [0.6, -0.5, 0.3], mat: cellMaterial, depth: 0.35 },
      { r: 1.1, pos: [-1.8, 3.8, -3.5], rot: [-0.4, 0.2, 0.6], mat: cellMaterial, depth: 0.45 }
    ];

    cellsSetup.forEach((cfg, idx) => {
      const geom = createErythrocyteGeometry(cfg.r);
      const mesh = new THREE.Mesh(geom, cfg.mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      rootGroup.add(mesh);

      floatingItems.push({
        mesh,
        baseX: cfg.pos[0],
        baseY: cfg.pos[1],
        baseZ: cfg.pos[2],
        rotSpeedX: 0.003 + (idx % 4) * 0.002,
        rotSpeedY: 0.005 + (idx % 3) * 0.0025,
        rotSpeedZ: 0.002 + (idx % 2) * 0.0015,
        floatSpeed: 0.6 + (idx % 3) * 0.25,
        floatAmp: 0.25 + (idx % 3) * 0.1,
        floatOffset: idx * 1.4,
        depthFactor: cfg.depth
      });
    });

    // -------------------------------------------------------------
    // DYNAMIC SWEEPING CRESCENT FLOW ARC (Center Feature in Image)
    // -------------------------------------------------------------
    // We model the elegant curved arterial crescent/swoosh flow wave:
    const curvePoints = [
      new THREE.Vector3(-2.6, 0.85, 0.6),
      new THREE.Vector3(-1.4, 1.45, 0.8),
      new THREE.Vector3(0.0, 1.35, 0.7),
      new THREE.Vector3(1.4, 0.6, 0.5),
      new THREE.Vector3(2.2, -0.75, 0.3)
    ];

    const flowCurve = new THREE.CatmullRomCurve3(curvePoints);
    const arcGeometry = new THREE.TubeGeometry(flowCurve, 64, 0.14, 16, false);
    
    // Scale curve radius dynamically to create tapered crescent ends
    const arcPos = arcGeometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < arcPos.count; i++) {
      vertex.fromBufferAttribute(arcPos, i);
      // Normalized u along the curve (roughly from x = -2.6 to 2.2)
      const u = THREE.MathUtils.clamp((vertex.x + 2.6) / 4.8, 0, 1);
      // Crescent taper profile: thicker in center, razor tapered at tips
      const thickness = Math.sin(u * Math.PI) * 1.5 + 0.15;
      
      // Calculate distance to closest curve point and taper
      const closestPoint = flowCurve.getPointAt(u);
      vertex.sub(closestPoint).multiplyScalar(thickness).add(closestPoint);
      arcPos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    arcGeometry.computeVertexNormals();

    const arcMaterial = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0xcc1122 : 0xee1133,
      emissive: isLight ? 0x330205 : 0x660812,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.98,
      transmission: 0.15,
      ior: 1.5
    });

    const flowArc = new THREE.Mesh(arcGeometry, arcMaterial);
    rootGroup.add(flowArc);

    floatingItems.push({
      mesh: flowArc,
      baseX: 0,
      baseY: 0,
      baseZ: 0,
      rotSpeedX: 0.001,
      rotSpeedY: 0.002,
      rotSpeedZ: 0.001,
      floatSpeed: 0.5,
      floatAmp: 0.15,
      floatOffset: 0.8,
      depthFactor: 1.1
    });

    // -------------------------------------------------------------
    // FLOATING PLATELET PARTICLES (Square/Point micro-specks from image)
    // -------------------------------------------------------------
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      opacities[i] = Math.random() * 0.7 + 0.25;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Canvas square texture for crisp square particles seen in the image
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isLight ? '#d61827' : '#ff4455';
      ctx.fillRect(1, 1, 14, 14);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: isLight ? 0.14 : 0.16,
      map: particleTexture,
      transparent: true,
      opacity: isLight ? 0.75 : 0.85,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    // -------------------------------------------------------------
    // INTERACTIVE PARALLAX & SCROLL DEPTH DYNAMICS
    // -------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth Mouse Parallax Lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      scrollY += (targetScrollY - scrollY) * 0.05;

      const scrollOffset = scrollY * 0.0018;

      // Group Level subtle camera tilt
      rootGroup.rotation.y = mouseX * 0.22;
      rootGroup.rotation.x = -mouseY * 0.18;
      rootGroup.position.y = scrollOffset * 0.8;

      // Animate Individual Floating Erythrocytes & Arc
      if (!prefersReducedMotion) {
        floatingItems.forEach((item) => {
          // Continuous gentle biological rotation
          item.mesh.rotation.x += item.rotSpeedX;
          item.mesh.rotation.y += item.rotSpeedY;
          item.mesh.rotation.z += item.rotSpeedZ;

          // Organic vertical floating oscillation
          const floatY = Math.sin(elapsed * item.floatSpeed + item.floatOffset) * item.floatAmp;
          item.mesh.position.y = item.baseY + floatY - scrollOffset * (item.depthFactor * 0.6);

          // Subtle lateral parallax response based on depth
          item.mesh.position.x = item.baseX + mouseX * 0.45 * item.depthFactor;
          item.mesh.position.z = item.baseZ + mouseY * 0.35 * item.depthFactor;
        });

        // Drift Platelet Micro-Particles
        particles.rotation.y = elapsed * 0.02 + mouseX * 0.1;
        particles.rotation.x = elapsed * 0.015;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      cellMaterial.dispose();
      cellMaterialGloss.dispose();
      arcMaterial.dispose();
      arcGeometry.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
    };
  }, [theme]);

  if (!webglSupported) {
    return null;
  }

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700"
    >
      {/* 3D WebGL Canvas Layer */}
      <div 
        ref={mountRef} 
        className="w-full h-full absolute inset-0 opacity-90 dark:opacity-80 transition-opacity" 
      />

      {/* Luminous Ambient Lighting Layer behind 3D cells */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 dark:opacity-20" />
    </div>
  );
};
