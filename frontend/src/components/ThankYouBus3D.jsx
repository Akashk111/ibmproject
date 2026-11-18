import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CheckCircle2, Sparkles } from 'lucide-react';
import fallbackBusImg from '../assets/images/buses/mangaluru-city-bus-mg-road.jpg';

export default function ThankYouBus3D({ destinationText = "MANGALURU CITY", passengerName = "Passenger" }) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [busArrived, setBusArrived] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    let animId;
    let handleResize;
    let handleMouseMove;

    try {
      // 1. WebGL Verification
      const canvasTest = document.createElement('canvas');
      const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }

      // 2. Scene Setup
      const scene = new THREE.Scene();
      // Deep coastal navy sky fog
      scene.fog = new THREE.FogExp2(0x0a192f, 0.028);

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 420;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(4.2, 2.2, 6.8);
      camera.lookAt(0.1, 1.0, 0);

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
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);

      // 3. Lighting: High-contrast coastal celebration lighting
      const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0x93c5fd, 2.6);
      sunLight.position.set(6, 9, 5);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.0001;
      scene.add(sunLight);

      // Electric blue underglow
      const underglow = new THREE.PointLight(0x00f0ff, 4.5, 12);
      underglow.position.set(0, 0.25, 0);
      scene.add(underglow);

      // Warm interior cabin light
      const cabinLight = new THREE.PointLight(0xfef08a, 2.0, 6);
      cabinLight.position.set(0, 1.5, 0);
      scene.add(cabinLight);

      // 4. Coastal Road & Palm Trees Environment
      const roadGroup = new THREE.Group();

      // Asphalt road
      const roadGeo = new THREE.PlaneGeometry(10, 50);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.65,
        metalness: 0.3
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.y = -0.02;
      road.receiveShadow = true;
      roadGroup.add(road);

      // Center dashed road markings
      const laneLines = [];
      const laneGeo = new THREE.PlaneGeometry(0.16, 2.0);
      const laneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      for (let i = -10; i < 10; i++) {
        const line = new THREE.Mesh(laneGeo, laneMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.01, i * 2.6);
        roadGroup.add(line);
        laneLines.push(line);
      }

      // Sandy coastal shoulder
      const shoulderGeo = new THREE.PlaneGeometry(5, 50);
      const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const shoulderLeft = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulderLeft.rotation.x = -Math.PI / 2;
      shoulderLeft.position.set(-6, -0.03, 0);
      roadGroup.add(shoulderLeft);

      const shoulderRight = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulderRight.rotation.x = -Math.PI / 2;
      shoulderRight.position.set(6, -0.03, 0);
      roadGroup.add(shoulderRight);

      scene.add(roadGroup);

      // Palm Trees
      const palmGroup = new THREE.Group();
      const palmTrees = [];
      const createPalm = (x, z) => {
        const tree = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
        const trunkGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.2, 7);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.6;
        trunk.rotation.z = (Math.random() - 0.5) * 0.12;
        tree.add(trunk);

        const frondMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5, side: THREE.DoubleSide });
        for (let f = 0; f < 6; f++) {
          const frondGeo = new THREE.PlaneGeometry(1.2, 0.35);
          const frond = new THREE.Mesh(frondGeo, frondMat);
          frond.position.set(0, 3.1, 0);
          frond.rotation.y = (f * Math.PI) / 3;
          frond.rotation.x = 0.45;
          tree.add(frond);
        }
        tree.position.set(x, 0, z);
        palmGroup.add(tree);
        palmTrees.push(tree);
      };

      for (let k = -8; k < 8; k++) {
        createPalm(-4.2 - (k % 2 === 0 ? 0.4 : 0), k * 3.2);
        createPalm(4.2 + (k % 2 === 0 ? 0.4 : 0), k * 3.2 + 1.2);
      }
      scene.add(palmGroup);

      // Western Ghats Distant Hills Silhouette
      const hillsGroup = new THREE.Group();
      const hillMat = new THREE.MeshStandardMaterial({ color: 0x0c1e3d, roughness: 0.95 });
      for (let h = 0; h < 6; h++) {
        const hillGeo = new THREE.SphereGeometry(6 + h * 0.8, 16, 12);
        const hill = new THREE.Mesh(hillGeo, hillMat);
        hill.position.set(-14 + h * 5.5, -2, -18 - (h % 3) * 3);
        hill.scale.set(1.4, 0.65, 1.0);
        hillsGroup.add(hill);
      }
      scene.add(hillsGroup);

      // 5. 3D Mangaluru City Bus
      const bus = new THREE.Group();

      // Royal Blue Main Body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8, // Royal Blue
        metalness: 0.7,
        roughness: 0.22,
      });
      const bodyGeo = new THREE.BoxGeometry(2.1, 1.6, 6.0);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.15;
      body.castShadow = true;
      body.receiveShadow = true;
      bus.add(body);

      // Pure White Aerodynamic Roof Cap
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.35,
        roughness: 0.3
      });
      const roofGeo = new THREE.BoxGeometry(2.12, 0.22, 6.02);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 1.98;
      bus.add(roof);

      // Vibrant Orange Beltline Stripe (City Bus Signature)
      const orangeMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        metalness: 0.5,
        roughness: 0.25
      });
      const stripeGeo = new THREE.BoxGeometry(2.13, 0.16, 6.02);
      const stripe = new THREE.Mesh(stripeGeo, orangeMat);
      stripe.position.set(0, 0.82, 0);
      bus.add(stripe);

      // Curved Windshield
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
      windshield.position.set(0, 1.45, 3.02);
      windshield.rotation.x = -0.12;
      bus.add(windshield);

      // Side Panoramic Windows
      const sideGlassGeo = new THREE.BoxGeometry(2.14, 0.65, 4.8);
      const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      sideGlass.position.set(0, 1.46, -0.2);
      bus.add(sideGlass);

      // Destination Board displaying "MANGALURU CITY"
      const ledCanvas = document.createElement('canvas');
      ledCanvas.width = 512;
      ledCanvas.height = 128;
      const ctx = ledCanvas.getContext('2d');
      ctx.fillStyle = '#060f1e';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = 'bold 44px Inter, sans-serif';
      ctx.fillStyle = '#38bdf8'; // Glowing cyan
      ctx.textAlign = 'center';
      ctx.fillText(destinationText.toUpperCase(), 256, 76);

      const ledTexture = new THREE.CanvasTexture(ledCanvas);
      const ledMat = new THREE.MeshBasicMaterial({ map: ledTexture });
      const ledSign = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.38), ledMat);
      ledSign.position.set(0, 1.95, 3.03);
      bus.add(ledSign);

      // Wheels Construction
      const wheels = [];
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.36, 20);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });

      const wheelPositions = [
        [-1.02, 0.42, 1.9],
        [1.02, 0.42, 1.9],
        [-1.02, 0.42, -1.9],
        [1.02, 0.42, -1.9]
      ];

      wheelPositions.forEach(([x, y, z]) => {
        const wheelGroup = new THREE.Group();
        const tire = new THREE.Mesh(wheelGeo, tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 12);
        const hub = new THREE.Mesh(hubGeo, rimMat);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);

        wheelGroup.position.set(x, y, z);
        bus.add(wheelGroup);
        wheels.push(wheelGroup);
      });

      // Headlights with Soft Glow
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const headlightGeo = new THREE.CircleGeometry(0.15, 16);

      const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
      hlLeft.position.set(-0.76, 0.72, 3.02);
      bus.add(hlLeft);

      const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
      hlRight.position.set(0.76, 0.72, 3.02);
      bus.add(hlRight);

      // Subtle Soft Headlight Forward Spot Beams
      const hlBeamLeft = new THREE.SpotLight(0xfef08a, 2.5, 9, Math.PI / 6.5, 0.5, 1.2);
      hlBeamLeft.position.set(-0.76, 0.72, 3.02);
      hlBeamLeft.target.position.set(-0.76, 0, 8);
      bus.add(hlBeamLeft);
      bus.add(hlBeamLeft.target);

      const hlBeamRight = new THREE.SpotLight(0xfef08a, 2.5, 9, Math.PI / 6.5, 0.5, 1.2);
      hlBeamRight.position.set(0.76, 0.72, 3.02);
      hlBeamRight.target.position.set(0.76, 0, 8);
      bus.add(hlBeamRight);
      bus.add(hlBeamRight.target);

      // Subtle Realistic Contact Shadow under the Bus
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext('2d');
      const grad = sCtx.createRadialGradient(64, 128, 10, 64, 128, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 256);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const busShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 6.6),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85 })
      );
      busShadow.rotation.x = -Math.PI / 2;
      busShadow.position.set(0, 0.015, 0);
      bus.add(busShadow);

      // Initial Entrance Animation Coordinates
      // Checks reduced motion preference
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        bus.position.set(0, 0, 0);
        setBusArrived(true);
      } else {
        bus.position.set(0, 0, -11);
      }
      scene.add(bus);

      // 6. Celebratory Confetti Particles
      const confettiCount = 180;
      const confettiGeo = new THREE.PlaneGeometry(0.08, 0.08);
      const confettiColors = [
        0x10b981, // Emerald Green
        0x38bdf8, // Cyan Blue
        0xfbbf24, // Amber Gold
        0xf43f5e, // Rose Coral
        0xa855f7, // Purple
        0xffffff  // White Sparkle
      ];

      const confettiParticles = [];
      const confettiGroup = new THREE.Group();

      for (let i = 0; i < confettiCount; i++) {
        const col = confettiColors[i % confettiColors.length];
        const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(confettiGeo, mat);
        
        mesh.position.set(
          (Math.random() - 0.5) * 8,
          Math.random() * 5 + 1.5,
          (Math.random() - 0.5) * 8
        );
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        mesh.userData = {
          speedY: 0.015 + Math.random() * 0.025,
          rotSpeedX: (Math.random() - 0.5) * 0.05,
          rotSpeedY: (Math.random() - 0.5) * 0.05,
          rotSpeedZ: (Math.random() - 0.5) * 0.05
        };

        confettiGroup.add(mesh);
        confettiParticles.push(mesh);
      }
      scene.add(confettiGroup);

      // Mouse Parallax Interaction
      let mouseX = 0;
      let mouseY = 0;
      let targetCameraX = 4.2;
      let targetCameraY = 2.2;

      handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX = x * 1.2;
        mouseY = y * 0.8;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Resize Handler
      handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 420;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // 7. Animation Loop with Entrance Transition
      let clock = 0;
      let entranceProgress = prefersReducedMotion ? 1.0 : 0;
      let hasTriggeredArrived = prefersReducedMotion;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        clock += 0.018;

        // Smooth 3D Bus Drive-in Entrance
        if (entranceProgress < 1.0) {
          entranceProgress += 0.012; // ~1.5 seconds smooth drive-in
          const t = Math.min(1.0, entranceProgress);
          // Cubic ease-out
          const eased = 1 - Math.pow(1 - t, 3);
          bus.position.z = -11 + eased * 11; // drives smoothly from -11 to 0

          // Natural wheel rotation during movement (decelerates to 0)
          const wheelSpeed = (1 - eased) * 0.28;
          wheels.forEach(w => {
            w.rotation.x += wheelSpeed;
          });

          // Road lines move while bus approaches
          const roadSpeed = (1 - eased) * 0.16;
          laneLines.forEach(line => {
            line.position.z += roadSpeed;
            if (line.position.z > 14) line.position.z -= 48;
          });

          // Subtle braking pitch & suspension settle
          bus.rotation.x = (1 - eased) * -0.015;
          bus.position.y = Math.sin(t * Math.PI) * 0.03;

          if (t >= 0.98 && !hasTriggeredArrived) {
            hasTriggeredArrived = true;
            setBusArrived(true);
          }
        } else {
          // Bus has gently stopped in the centre!
          // Wheels stay stopped
          // Gentle idle engine & road suspension breathing
          bus.position.y = Math.sin(clock * 2.8) * 0.012;
          bus.rotation.z = Math.sin(clock * 1.8) * 0.003;
          bus.rotation.x = 0;
        }

        // Headlights subtle warm glow pulse
        const pulse = 2.4 + Math.sin(clock * 3.5) * 0.3;
        hlBeamLeft.intensity = pulse;
        hlBeamRight.intensity = pulse;

        // Animate Confetti Particles
        confettiParticles.forEach(p => {
          p.position.y -= p.userData.speedY;
          p.rotation.x += p.userData.rotSpeedX;
          p.rotation.y += p.userData.rotSpeedY;
          p.rotation.z += p.userData.rotSpeedZ;

          // Respawn above when hitting ground
          if (p.position.y < 0.1) {
            p.position.y = 5.5 + Math.random();
            p.position.x = (Math.random() - 0.5) * 8;
            p.position.z = (Math.random() - 0.5) * 8;
          }
        });

        // Smooth camera mouse parallax
        targetCameraX = 4.2 + mouseX * 0.8;
        targetCameraY = 2.2 - mouseY * 0.5;
        camera.position.x += (targetCameraX - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0.1, 1.0, 0);

        renderer.render(scene, camera);
      };

      animate();

    } catch (err) {
      console.warn('Three.js 3D initialization failed, using high-res visual fallback:', err);
      setHasWebGL(false);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
      if (renderer && renderer.domElement && container) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [destinationText]);

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[480px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a192f] via-[#102b4e] to-[#07192f] shadow-2xl border border-white/10">
      
      {/* 3D WebGL Canvas Container */}
      {hasWebGL ? (
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Animation / Device Fallback with authentic Mangaluru City Bus */
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={fallbackBusImg}
            alt="Mangaluru City Bus"
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102B4E]/90 via-transparent to-[#102B4E]/40" />
        </div>
      )}

      {/* Floating 3D Celebratory Badge Overlay */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none flex items-center gap-2">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/90 backdrop-blur-md text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
        </div>
        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
          <span className="text-[10px] text-emerald-300 font-black uppercase tracking-wider block">
            Booking Confirmed
          </span>
          <span className="text-xs font-black text-white">
            Destination: {destinationText}
          </span>
        </div>
      </div>

      {/* Animated Small Thank-You Greeting Badge */}
      {busArrived && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 pointer-events-none transition-all duration-700 animate-fadeIn flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-xl text-white">
          <span className="text-base sm:text-lg animate-bounce">🚌</span>
          <div className="leading-tight">
            <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wide block">
              Official City Transit
            </span>
            <span className="text-xs sm:text-sm font-black text-white">
              Thank you, {passengerName}! Have a safe journey ✨
            </span>
          </div>
        </div>
      )}

      {/* Live 3D Experience Watermark Indicator */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-blue-200 font-bold">
        <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
        <span>Interactive 3D Coastal Bus Scene</span>
      </div>

    </div>
  );
}
