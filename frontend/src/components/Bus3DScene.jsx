import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import heroFallbackImg from '../assets/images/buses/mangaluru-city-bus-mg-road.jpg';

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
      // 1. WebGL Support Verification
      const canvasTest = document.createElement('canvas');
      const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }

      // 2. Scene & Atmosphere Setup
      const scene = new THREE.Scene();
      // Deep coastal navy twilight fog
      scene.fog = new THREE.FogExp2(0x060f1e, 0.032);

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 560;

      // Perspective Camera positioned dynamically to highlight the right-side 3D bus
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(4.8, 2.6, 7.2);
      camera.lookAt(0.2, 1.1, 0);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      // 3. Lighting: High-end automotive studio & highway twilight
      const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.1);
      scene.add(ambientLight);

      // Key moonlight / twilight directional light
      const sunLight = new THREE.DirectionalLight(0x93c5fd, 2.4);
      sunLight.position.set(7, 10, 5);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.0001;
      scene.add(sunLight);

      // Electric Cyan Chassis Underglow Light
      const underglow = new THREE.PointLight(0x00f0ff, 5.0, 14);
      underglow.position.set(0, 0.25, 0);
      scene.add(underglow);

      // Warm interior cabin fill light
      const cabinLight = new THREE.PointLight(0xfef08a, 2.2, 7);
      cabinLight.position.set(0, 1.6, 0);
      scene.add(cabinLight);

      // 4. Highway Road & Shoulder Construction
      const roadGroup = new THREE.Group();

      // Asphalt Highway Plane
      const roadGeo = new THREE.PlaneGeometry(12, 60);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x09111e,
        roughness: 0.65,
        metalness: 0.35
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.y = -0.02;
      road.receiveShadow = true;
      roadGroup.add(road);

      // Highway animated dashed center markings
      const laneLines = [];
      const laneGeo = new THREE.PlaneGeometry(0.18, 2.2);
      const laneMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });

      for (let i = -12; i < 12; i++) {
        const line = new THREE.Mesh(laneGeo, laneMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.01, i * 2.8);
        roadGroup.add(line);
        laneLines.push(line);
      }

      // Yellow Shoulder Lines
      const shoulderGeo = new THREE.PlaneGeometry(0.12, 60);
      const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const leftShoulder = new THREE.Mesh(shoulderGeo, yellowMat);
      leftShoulder.rotation.x = -Math.PI / 2;
      leftShoulder.position.set(-2.8, 0.01, 0);
      const rightShoulder = new THREE.Mesh(shoulderGeo, yellowMat);
      rightShoulder.rotation.x = -Math.PI / 2;
      rightShoulder.position.set(2.8, 0.01, 0);
      roadGroup.add(leftShoulder, rightShoulder);

      scene.add(roadGroup);

      // 5. Coastal Karnataka Scenery: Animated Roadside Palm Trees & Western Ghats Hills
      const palmTrees = [];
      const palmGroup = new THREE.Group();

      const createPalmTree = (x, z) => {
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);

        // Curved trunk
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.18, 3.8, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x473323, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.9;
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        tree.add(trunk);

        // Layered Palm Fronds
        const frondMat = new THREE.MeshStandardMaterial({
          color: 0x059669,
          roughness: 0.7,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        for (let j = 0; j < 6; j++) {
          const frondGeo = new THREE.ConeGeometry(0.85, 1.8, 5);
          const frond = new THREE.Mesh(frondGeo, frondMat);
          frond.position.set(0, 3.8, 0);
          frond.rotation.x = 0.6;
          frond.rotation.y = (j * Math.PI) / 3;
          tree.add(frond);
        }

        palmGroup.add(tree);
        palmTrees.push(tree);
      };

      // Populate palm trees along both coastal highway verges
      for (let k = -10; k < 10; k++) {
        createPalmTree(-4.6 - (k % 2 === 0 ? 0.6 : 0), k * 3.4);
        createPalmTree(4.6 + (k % 2 === 0 ? 0.5 : 0), k * 3.4 + 1.2);
      }
      scene.add(palmGroup);

      // Western Ghats Distant Hills Silhouette
      const hillsGroup = new THREE.Group();
      const hillMat = new THREE.MeshStandardMaterial({ color: 0x071b35, roughness: 0.95 });
      for (let h = 0; h < 7; h++) {
        const hillGeo = new THREE.SphereGeometry(6 + h * 0.8, 16, 12);
        const hill = new THREE.Mesh(hillGeo, hillMat);
        hill.position.set(-16 + h * 5.5, -2, -18 - (h % 3) * 3);
        hill.scale.set(1.4, 0.65, 1.0);
        hillsGroup.add(hill);
      }
      scene.add(hillsGroup);

      // 6. Build High-Precision 3D Volvo-Style Multi-Axle Intercity Coach
      const bus = new THREE.Group();

      // Main Aerodynamic Coach Body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8, // Royal Blue Primary
        metalness: 0.7,
        roughness: 0.22,
      });
      const bodyGeo = new THREE.BoxGeometry(2.1, 1.6, 6.2);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.15;
      body.castShadow = true;
      body.receiveShadow = true;
      bus.add(body);

      // Curved Aerodynamic Roof Cap (Arctic White)
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.35,
        roughness: 0.3
      });
      const roofGeo = new THREE.BoxGeometry(2.12, 0.22, 6.22);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 1.98;
      bus.add(roof);

      // Vibrant Orange Accent Livery Beltline (Mangaluru City Transit styling)
      const orangeMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        metalness: 0.5,
        roughness: 0.25
      });
      const stripeGeo = new THREE.BoxGeometry(2.13, 0.16, 6.22);
      const stripe = new THREE.Mesh(stripeGeo, orangeMat);
      stripe.position.set(0, 0.82, 0);
      bus.add(stripe);

      // Front Curved Aerodynamic Windshield
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.88,
        transparent: true,
        opacity: 0.9
      });
      const windshieldGeo = new THREE.BoxGeometry(2.0, 0.85, 0.12);
      const windshield = new THREE.Mesh(windshieldGeo, glassMat);
      windshield.position.set(0, 1.45, 3.12);
      windshield.rotation.x = -0.12; // sleek rake angle
      bus.add(windshield);

      // Tinted Side Panoramic Windows
      const sideGlassGeo = new THREE.BoxGeometry(2.14, 0.65, 5.0);
      const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      sideGlass.position.set(0, 1.46, -0.2);
      bus.add(sideGlass);

      // Digital Illuminated LED Route Destination Display
      const ledCanvas = document.createElement('canvas');
      ledCanvas.width = 512;
      ledCanvas.height = 128;
      const ctx = ledCanvas.getContext('2d');
      ctx.fillStyle = '#060f1e';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('MANGALURU BUS CONNECT', 256, 76);

      const ledTexture = new THREE.CanvasTexture(ledCanvas);
      const ledMat = new THREE.MeshBasicMaterial({ map: ledTexture });
      const ledSign = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.38), ledMat);
      ledSign.position.set(0, 1.95, 3.13);
      bus.add(ledSign);

      // Chrome Front Bumper & Mangaluru Logo Emblem
      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.95,
        roughness: 0.1
      });
      const bumperGeo = new THREE.BoxGeometry(2.12, 0.3, 0.2);
      const bumper = new THREE.Mesh(bumperGeo, chromeMat);
      bumper.position.set(0, 0.45, 3.12);
      bus.add(bumper);

      // Dual High-Intensity LED Headlights
      const headLightGeo = new THREE.BoxGeometry(0.38, 0.18, 0.05);
      const headLightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const leftLight = new THREE.Mesh(headLightGeo, headLightMat);
      leftLight.position.set(-0.75, 0.68, 3.13);
      const rightLight = new THREE.Mesh(headLightGeo, headLightMat);
      rightLight.position.set(0.75, 0.68, 3.13);
      bus.add(leftLight, rightLight);

      // Volumetric Headlight Beams Casting on Road
      const spotL = new THREE.SpotLight(0xdbeafe, 7.5, 16, Math.PI / 7, 0.5);
      spotL.position.set(-0.75, 0.68, 3.1);
      spotL.target.position.set(-0.75, 0, 10);
      const spotR = new THREE.SpotLight(0xdbeafe, 7.5, 16, Math.PI / 7, 0.5);
      spotR.position.set(0.75, 0.68, 3.1);
      spotR.target.position.set(0.75, 0, 10);
      scene.add(spotL, spotL.target, spotR, spotR.target);

      // Dual Electric Cyan DRL Accent Eyebrows
      const drlMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const drlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.05), drlMat);
      drlL.position.set(-0.75, 0.8, 3.13);
      const drlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.05), drlMat);
      drlR.position.set(0.75, 0.8, 3.13);
      bus.add(drlL, drlR);

      // Rear Red LED Taillight Strip
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.05), tailMat);
      tailStrip.position.set(0, 0.8, -3.12);
      bus.add(tailStrip);

      // Multi-Axle Wheels (1 Front Axle + 2 Rear Axles = 6 Wheels total)
      const wheels = [];
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.1 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });

      const wheelPositions = [
        [-1.02, 0.4, 2.0],  // Front Left
        [1.02, 0.4, 2.0],   // Front Right
        [-1.02, 0.4, -1.3], // Rear Axle 1 Left
        [1.02, 0.4, -1.3],  // Rear Axle 1 Right
        [-1.02, 0.4, -2.3], // Rear Axle 2 Left (Multi-Axle)
        [1.02, 0.4, -2.3],  // Rear Axle 2 Right (Multi-Axle)
      ];

      wheelPositions.forEach(([wx, wy, wz]) => {
        const wGroup = new THREE.Group();
        wGroup.position.set(wx, wy, wz);

        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 24), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wGroup.add(tire);

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.25, 16), rimMat);
        rim.rotation.z = Math.PI / 2;
        wGroup.add(rim);

        bus.add(wGroup);
        wheels.push(wGroup);
      });

      // Position bus slightly offset to showcase angle
      bus.position.set(0.1, 0, 0);
      bus.rotation.y = 0.05;
      scene.add(bus);

      // 7. Floating 3D Holographic Location Beacon Pins
      const beaconGroup = new THREE.Group();
      const pinGeo = new THREE.ConeGeometry(0.24, 0.68, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      const pin1 = new THREE.Mesh(pinGeo, pinMat);
      pin1.rotation.x = Math.PI;
      pin1.position.set(-2.2, 2.8, 1.2);
      beaconGroup.add(pin1);

      const pin2 = new THREE.Mesh(pinGeo, pinMat.clone());
      pin2.rotation.x = Math.PI;
      pin2.position.set(2.4, 3.1, -1.5);
      beaconGroup.add(pin2);

      scene.add(beaconGroup);

      // 8. Interactive Mouse Parallax Coordinates
      let mouseX = 0;
      let mouseY = 0;
      handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };
      window.addEventListener('mousemove', handleMouseMove);

      // 9. High-Performance Render Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Bus smooth cruising suspension motion
        bus.position.y = Math.sin(elapsed * 4.2) * 0.022;
        bus.rotation.z = Math.sin(elapsed * 2.2) * 0.007;

        // Continuous wheel spin
        wheels.forEach((w) => {
          w.children.forEach((c) => {
            c.rotation.x += 0.16;
          });
        });

        // Highway lane markings continuous scrolling
        laneLines.forEach((l) => {
          l.position.z -= 0.18;
          if (l.position.z < -16) {
            l.position.z = 16;
          }
        });

        // Palm trees roadside scrolling
        palmTrees.forEach((t) => {
          t.position.z -= 0.18;
          if (t.position.z < -20) {
            t.position.z = 20;
          }
        });

        // Floating pins gentle oscillation
        pin1.position.y = 2.8 + Math.sin(elapsed * 3) * 0.15;
        pin1.rotation.y += 0.03;
        pin2.position.y = 3.1 + Math.cos(elapsed * 2.6) * 0.15;
        pin2.rotation.y += 0.03;

        // Camera smooth ease towards mouse position
        camera.position.x += (4.8 + mouseX * 0.65 - camera.position.x) * 0.05;
        camera.position.y += (2.6 + mouseY * 0.45 - camera.position.y) * 0.05;
        camera.lookAt(0.2, 1.1, 0);

        renderer.render(scene, camera);
      };

      animate();

      // Responsive Resize
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
      console.warn('3D Scene WebGL init exception, switching to photo fallback:', err);
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={heroFallbackImg}
          alt="Mangaluru Bus Connect Intercity Coach"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e] via-[#0a192f]/85 to-[#060f1e]/70" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 w-full h-full pointer-events-none select-none"
      style={{ overflow: 'hidden' }}
    />
  );
}
