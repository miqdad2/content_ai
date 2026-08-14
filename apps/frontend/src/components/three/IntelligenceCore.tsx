import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { THREE_COLORS } from "@/lib/three-theme";

interface IntelligenceCoreProps {
  reducedMotion: boolean;
  lowQuality: boolean;
  scale?: number;
}

/**
 * The central cre8.ai / Brand Memory intelligence object — an icosahedron
 * energy cage around a small glowing core, deliberately NOT a smooth
 * rim-lit sphere like the department/showcase planets, so it always reads
 * as structurally distinct (the shared intelligence layer, not one more
 * department). Two independent slow rotations (cage vs inner core,
 * opposite directions), both skipped under prefers-reduced-motion.
 *
 * Extracted in UNIT 06 from UNIT 05's `DepartmentCore` so the department
 * universe and the new homepage Brand Memory diagram render the exact same
 * object rather than two near-duplicate implementations — see
 * DepartmentScene3D.tsx and BrandCoreScene3D.tsx for the two call sites.
 */
export function IntelligenceCore({ reducedMotion, lowQuality, scale = 1 }: IntelligenceCoreProps) {
  const cageRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (cageRef.current) {
      cageRef.current.rotation.y += delta * 0.06;
      cageRef.current.rotation.x += delta * 0.015;
    }
    if (coreRef.current) coreRef.current.rotation.y -= delta * 0.1;
  });

  return (
    <group scale={scale}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.42, lowQuality ? 16 : 32, lowQuality ? 16 : 32]} />
        <meshStandardMaterial
          color={THREE_COLORS.cyanDeep}
          emissive={THREE_COLORS.cyan}
          emissiveIntensity={0.9}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <mesh ref={cageRef}>
        <icosahedronGeometry args={[0.72, 0]} />
        <meshBasicMaterial color={THREE_COLORS.primary} wireframe transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </group>
  );
}
