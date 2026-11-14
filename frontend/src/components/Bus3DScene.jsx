import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import heroFallbackImg from '../assets/images/hero-bus.jpg';

export default function Bus3DScene() {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    let animId;
    let handleMouseMove;
    let handleResize;

    try {
      // Check WebGL availability
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }

      // 1. Scene, Camera, Renderer
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x071426, 0.035);

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || 650;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(5.5, 3.2, 7.8);
      camera.lookAt(0, 0.8, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(8, 12, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Cyan / Blue Accent Underglow
    const bluePoint = new THREE.PointLight(0x3b82f6, 4.5, 12);
    bluePoint.position.set(0, 0.2, 0);
    scene.add(bluePoint);

    // Warm street glow
    const amberPoint = new THREE.PointLight(0xf59e0b, 2.5, 10);
    amberPoint.position.set(-3, 3, 2);
    scene.add(amberPoint);

    // 3. The Road
    const roadGeo = new THREE.PlaneGeometry(16, 50);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.01;
    road.receiveShadow = true;
    scene.add(road);

    // Dashed Lane Markings
    const laneLines = [];
    const laneGeo = new THREE.PlaneGeometry(0.18, 1.8);
    const laneMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });

    for (let i = -10; i < 10; i++) {
      const line = new THREE.Mesh(laneGeo, laneMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.01, i * 2.8);
      scene.add(line);
      laneLines.push(line);
    }

    // 4. City Skyline Silhouettes
    const skylineGroup = new THREE.Group();
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0a192f, roughness: 0.9 });
    for (let i = 0; i < 16; i++) {
      const h = 4 + Math.random() * 7;
      const w = 1.4 + Math.random() * 1.5;
      const bldgGeo = new THREE.BoxGeometry(w, h, 2);
      const bldg = new THREE.Mesh(bldgGeo, bldgMat);
      const side = i % 2 === 0 ? 1 : -1;
      bldg.position.set(side * (5.5 + Math.random() * 3), h / 2 - 0.5, -12 + (i * 2.2));
      skylineGroup.add(bldg);
    }
    scene.add(skylineGroup);

    // 5. Build 3D Futuristic City Bus
    const busGroup = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Royal Blue
      metalness: 0.65,
      roughness: 0.25,
    });
    const bodyGeo = new THREE.BoxGeometry(2.0, 1.4, 5.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.05;
    body.castShadow = true;
    body.receiveShadow = true;
    busGroup.add(body);

    // Roof White Cap
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.3 });
    const roofGeo = new THREE.BoxGeometry(2.02, 0.2, 5.42);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.76;
    busGroup.add(roof);

    // Windshield (Front Glass)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.85
    });
    const windshieldGeo = new THREE.BoxGeometry(1.9, 0.75, 0.1);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.3, 2.71);
    busGroup.add(windshield);

    // Side Windows Bands
    const sideGlassGeo = new THREE.BoxGeometry(2.04, 0.55, 4.4);
    const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlass.position.set(0, 1.32, -0.15);
    busGroup.add(sideGlass);

    // Front Destination LED Display Banner
    const ledCanvas = document.createElement('canvas');
    ledCanvas.width = 512;
    ledCanvas.height = 128;
    const ctx = ledCanvas.getContext('2d');
    ctx.fillStyle = '#060f1e';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillStyle = '#60a5fa';
    ctx.textAlign = 'center';
    ctx.fillText('1A • KUDLA CONNECT', 256, 78);

    const ledTexture = new THREE.CanvasTexture(ledCanvas);
    const ledMat = new THREE.MeshBasicMaterial({ map: ledTexture });
    const ledBanner = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.38), ledMat);
    ledBanner.position.set(0, 1.76, 2.73);
    busGroup.add(ledBanner);

    // Headlights
    const headLightGeo = new THREE.BoxGeometry(0.35, 0.18, 0.05);
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const leftLight = new THREE.Mesh(headLightGeo, headLightMat);
    leftLight.position.set(-0.7, 0.65, 2.71);
    const rightLight = new THREE.Mesh(headLightGeo, headLightMat);
    rightLight.position.set(0.7, 0.65, 2.71);
    busGroup.add(leftLight, rightLight);

    // Spotlight beams
    const spotL = new THREE.SpotLight(0xe0f2fe, 6, 12, Math.PI / 6, 0.4);
    spotL.position.set(-0.7, 0.65, 2.7);
    spotL.target.position.set(-0.7, 0, 8);
    const spotR = new THREE.SpotLight(0xe0f2fe, 6, 12, Math.PI / 6, 0.4);
    spotR.position.set(0.7, 0.65, 2.7);
    spotR.target.position.set(0.7, 0, 8);
    scene.add(spotL, spotL.target, spotR, spotR.target);

    // Taillights (Red)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tailMat);
    tailL.position.set(-0.75, 0.7, -2.71);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tailMat);
    tailR.position.set(0.75, 0.7, -2.71);
    busGroup.add(tailL, tailR);

    // Wheels
    const wheels = [];
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
    const wheelPositions = [
      [-0.95, 0.35, 1.7],
      [0.95, 0.35, 1.7],
      [-0.95, 0.35, -1.7],
      [0.95, 0.35, -1.7],
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(x, y, z);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 24), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.23, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      busGroup.add(wGroup);
      wheels.push(wGroup);
    });

    busGroup.position.set(0, 0, 0);
    scene.add(busGroup);

    // 6. Floating Holographic 3D Location Pin Markers
    const pinGroup = new THREE.Group();
    const pinGeo = new THREE.ConeGeometry(0.28, 0.75, 16);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });
    const pin1 = new THREE.Mesh(pinGeo, pinMat);
    pin1.rotation.x = Math.PI;
    pin1.position.set(-2.2, 2.6, 1.5);
    pinGroup.add(pin1);

    const pin2 = new THREE.Mesh(pinGeo, pinMat.clone());
    pin2.rotation.x = Math.PI;
    pin2.position.set(2.4, 2.9, -1.2);
    pinGroup.add(pin2);

    scene.add(pinGroup);

    // 7. Interactive Mouse Camera Parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Bus cruising bobbing motion
      busGroup.position.y = Math.sin(elapsed * 4.5) * 0.025;
      busGroup.rotation.z = Math.sin(elapsed * 2.5) * 0.008;

      // Wheel spin
      wheels.forEach((w) => {
        w.children.forEach(c => {
          c.rotation.x += 0.12;
        });
      });

      // Road markings movement
      laneLines.forEach((l) => {
        l.position.z -= 0.15;
        if (l.position.z < -14) {
          l.position.z = 14;
        }
      });

      // Floating Pin bobbing
      pin1.position.y = 2.5 + Math.sin(elapsed * 3) * 0.18;
      pin1.rotation.y += 0.025;
      pin2.position.y = 2.8 + Math.cos(elapsed * 2.8) * 0.18;
      pin2.rotation.y += 0.025;

      // Smooth camera interpolation towards mouse
      camera.position.x += (5.5 + mouseX * 0.8 - camera.position.x) * 0.05;
      camera.position.y += (3.2 + mouseY * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0.8, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) renderer.dispose();
    };
    } catch (err) {
      console.warn('3D Scene WebGL initialization failed, switching to photo fallback:', err);
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="absolute inset-0 z-0">
        <img
          src={heroFallbackImg}
          alt="Mangaluru City Bus Transport"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-navy-950/85 to-navy-900/75"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 w-full h-full pointer-events-none"
      style={{ overflow: 'hidden' }}
    />
  );
}
