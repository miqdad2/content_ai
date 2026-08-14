import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface HeroSpacecraftProps {
  reducedMotion: boolean;
}

/**
 * Small stylized geometric spacecraft — built entirely from primitives (no
 * downloaded/commercial model, no branded silhouette), kept small relative
 * to the planet and positioned off to the side so it never becomes the
 * hero subject. Slow drift only, skipped under prefers-reduced-motion (the
 * craft still renders, just holds still).
 */
export function HeroSpacecraft({ reducedMotion }: HeroSpacecraftProps) {
  const ref = useRef<Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (reducedMotion || !ref.current) return;
    elapsed.current += delta;
    const t = elapsed.current;
    ref.current.position.y = 0.15 + Math.sin(t * 0.35) * 0.09;
    ref.current.position.x = 2.35 + Math.cos(t * 0.22) * 0.14;
    ref.current.rotation.z = Math.sin(t * 0.3) * 0.06;
  });

  return (
    <group
      ref={ref}
      position={[2.35, 0.15, 0.5]}
      rotation={[0, Math.PI / 5, Math.PI / 2.3]}
      scale={0.22}
    >
      {/* Hull */}
      <mesh>
        <coneGeometry args={[0.5, 1.8, 12]} />
        <meshStandardMaterial color="#d7e4f5" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Fin cluster at the base */}
      <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.3, 0.85, 4]} />
        <meshStandardMaterial color="#3fa9ff" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Engine glow */}
      <mesh position={[0, -1.0, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial color="#55e6ff" toneMapped={false} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
