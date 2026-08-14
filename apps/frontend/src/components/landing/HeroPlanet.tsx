import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { RimGlowMaterial } from "@/components/three/RimGlowMaterial";
import { THREE_COLORS } from "@/lib/three-theme";

interface HeroPlanetProps {
  quality: "high" | "low";
  reducedMotion: boolean;
}

/**
 * The dominant hero object: a dark, unlit-looking sphere (no texture map —
 * deliberately relies on directional lighting + the rim shell below rather
 * than a downloaded/procedural surface texture, see UNIT 04 report) plus a
 * second, slightly larger backside-only sphere carrying the blue/cyan rim
 * glow (see RimGlowMaterial, shared with the department planets since
 * UNIT 05). Very slow constant rotation, skipped entirely under
 * prefers-reduced-motion.
 */
export function HeroPlanet({ quality, reducedMotion }: HeroPlanetProps) {
  const planetRef = useRef<Mesh>(null);
  const segments = quality === "high" ? 64 : 28;

  useFrame((_, delta) => {
    if (reducedMotion || !planetRef.current) return;
    planetRef.current.rotation.y += delta * 0.035;
  });

  return (
    <group>
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.6, segments, segments]} />
        <meshStandardMaterial color={THREE_COLORS.bodyDark} roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh scale={1.04}>
        <sphereGeometry args={[1.6, segments, segments]} />
        <RimGlowMaterial color="#4fb8ff" intensity={0.72} />
      </mesh>
    </group>
  );
}
