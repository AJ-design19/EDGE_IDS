"use client";

import { use, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, Float, Sparkles, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { Intel_One_Mono } from "next/font/google";
import { gsap } from "gsap";
import { AlertTriangleIcon } from 'lucide-react';

const intelOneMono = Intel_One_Mono({
  subsets: ["latin"],
  variable: "--font-intel-one-mono",
});


// Preload the model
useGLTF.preload('/scene.gltf');

function getRandomPointOnSphere(radius: number) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function Arc({ radius }: { radius: number }) {
  const start = useMemo(() => getRandomPointOnSphere(radius), [radius]);
  const end = useMemo(() => getRandomPointOnSphere(radius), [radius]);
  const mid = useMemo(() => {
    const m = start.clone().add(end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    // Push mid point out to create a nice curve
    return m.normalize().multiplyScalar(radius + dist * 0.5);
  }, [start, end, radius]);

  // Approximate line length to use for the dash size
  const l = useMemo(() => start.distanceTo(mid) + mid.distanceTo(end), [start, mid, end]);

  const lineRef = useRef<any>(null);

  // Randomize speed so they don't all draw at the same time
  const speed = useMemo(() => 40 + Math.random() * 40, []);

  // Track offset manually. Start with a random delay
  const offsetRef = useRef(l + Math.random() * l * 2);

  useFrame((state, delta) => {
    if (lineRef.current && lineRef.current.material) {
      offsetRef.current -= delta * speed;

      // Once the line has fully drawn and then fully erased, reset it with a random delay
      if (offsetRef.current < -l) {
        offsetRef.current = l + Math.random() * l * 3;
      }

      lineRef.current.material.dashOffset = offsetRef.current;
    }
  });

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={start}
      end={end}
      mid={mid}
      color="#ffe066" // brighter, almost white-yellow for glow effect
      lineWidth={3.5} // slightly thicker
      dashed={true}
      dashScale={1}
      dashSize={l}
      gapSize={l * 4}
      transparent
      opacity={1} // Full opacity for maximum brightness
    />
  );
}

function ConnectionArcs({ radius, count = 12 }: { radius: number, count?: number }) {
  const arcs = useMemo(() => Array.from({ length: count }), [count]);
  return (
    <group>
      {arcs.map((_, i) => (
        <Arc key={i} radius={radius} />
      ))}
    </group>
  );
}

function EarthModel({ start }: { start: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/scene.gltf');
  const { actions } = useAnimations(animations, group);
  const [radius, setRadius] = useState(50); // Default fallback radius


  const animation = () => {
    if (group.current) {
      gsap.to(group.current.scale, {
        x: 3,
        y: 3,
        z: 3,
        duration: 3,
        ease: "power2.inOut",
      });
    }
  }
  useEffect(() => {
    if (start)
      animation();

  }, [start]);





  useEffect(() => {
    // Play all animations available in the model
    if (actions) {
      Object.values(actions).forEach(action => action?.play());
    }
  }, [actions]);

  // Adjust material properties if needed to make it look "holographic" and "good"
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {

        if (child.material) {
          child.material.transparent = true;
          child.material.needsUpdate = true;
        }
      }
    });

    // Calculate bounding sphere to get radius for arcs
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0 && maxDim < 1000) {
      setRadius(maxDim / 2);
    }
  }, [scene]);

  return (
    <group ref={group} dispose={null} scale={0.7}>
      <primitive object={scene} />
      {radius > 0 && <ConnectionArcs radius={radius * 1.01} />}
    </group>
  );
}

interface SplineIntroProps {
  onComplete: () => void;
  show: boolean;
}

export function SplineIntro({ onComplete, show }: SplineIntroProps) {

  const [start, setStart] = useState(false);
  const [riskAlert, setRiskAlert] = useState<{ show: boolean, x: number, y: number } | null>(null);

  const trigger = () => {
    setStart(true);
    setRiskAlert(null);
    setTimeout(() => {
      onComplete();
    }, 2000);
  }

  useEffect(() => {
    if (!show || start) {
      setRiskAlert(null);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const cycleAlert = () => {
      // Wait before showing alert
      timeoutId = setTimeout(() => {
        // Generate random position avoiding the center
        // X: either 10-30% or 70-90%
        const isLeft = Math.random() > 0.5;
        const x = isLeft ? 10 + Math.random() * 20 : 70 + Math.random() * 20;

        // Y: either 15-35% or 65-85%
        const isTop = Math.random() > 0.5;
        const y = isTop ? 15 + Math.random() * 20 : 65 + Math.random() * 20;

        setRiskAlert({ show: true, x, y });

        // Hide after some time and cycle again
        timeoutId = setTimeout(() => {
          setRiskAlert(null);
          cycleAlert();
        }, 3000 + Math.random() * 2000);

      }, 1500 + Math.random() * 2500);
    };

    cycleAlert();

    return () => clearTimeout(timeoutId);
  }, [show, start]);


  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1326] overflow-hidden"
        >
          {/* 3D Scene */}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 100, 90], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={2} color="#3b82f6" />
              <directionalLight position={[-10, -10, -5]} intensity={1} color="#10b981" />
              <Environment preset="night" />

              <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <EarthModel start={start} />
              </Float>

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={1}
              />

              <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#3b82f6" />
            </Canvas>
          </div>

          {/* Overlay Content */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 bg-gradient-to-b from-[#0b1326]/40 via-transparent to-[#0b1326]/80">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="flex flex-col items-center opacity-70"
            >
              <h1 className={` ${intelOneMono.variable} text-5xl md:text-7xl font-bold tracking-[0.2em] text-white/80 uppercase text-center drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]  mix-blend-plus-lighter`}>
                EDGE<span className=" mx-5 text-[#3b82f6]">IDS</span>
              </h1>
              <p className="mt-4 text-[#ffe066] font-mono text-sm tracking-[0.3em] uppercase drop-shadow-md mix-blend-plus-lighter">
                Global Threat Intelligence
              </p>

              <button
                onClick={trigger}
                className="mt-12 px-8 py-3 border border-[#3b82f6]/50 rounded-full text-[#dae2fd] font-mono text-xs uppercase tracking-widest hover:bg-[#3b82f6]/20 hover:border-[#3b82f6] transition-all pointer-events-auto shadow-[0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-md relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/0 via-[#3b82f6]/20 to-[#3b82f6]/0 opacity-0 group-hover:opacity-100  blur-xl backdrop-blur-xl  transition-opacity translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
                Initialize System
              </button>
            </motion.div>
          </div>

          {/* Random Risk Alert Overlay */}
          <AnimatePresence>
            {riskAlert && riskAlert.show && !start && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={trigger}
                style={{ left: `${riskAlert.x}%`, top: `${riskAlert.y}%`, transform: 'translate(-50%, -50%)' }}
                className="absolute z-50 px-6 py-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 font-mono tracking-widest uppercase shadow-[0_0_30px_rgba(239,68,68,0.4)] backdrop-blur-md pointer-events-auto hover:bg-red-500/30 hover:border-red-400 transition-all cursor-pointer flex items-center gap-4 group"
              >
                <AlertTriangleIcon className="w-6 h-6 text-red-500 animate-pulse" />
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-red-300">THREAT DETECTED</span>
                  <span className="text-xs opacity-80 text-red-200 mt-1">CLICK TO INTERCEPT</span>
                </div>
                <div className="absolute inset-0 border border-red-500/0 rounded-lg group-hover:animate-ping opacity-30"></div>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
