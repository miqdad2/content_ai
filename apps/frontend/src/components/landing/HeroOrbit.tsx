import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3, type Group } from "three";

interface HeroOrbitProps {
  radius: number;
  tilt: number;
  color: string;
  speed: number;
  reducedMotion: boolean;
  /** Small unlabeled markers along the ring — atmospheric storytelling only
   * (hints at the upcoming department universe). UNIT 05 owns the real
   * department-node interaction; these are decorative and never
   * interactive. */
  nodeCount?: number;
}

/**
 * One thin elegant orbit ring (via drei's `Line`, which renders a
 * consistent-width line across browsers — plain WebGL `GL_LINES` clamps to
 * ~1px on most platforms) plus optional small marker spheres along it. Slow
 * constant rotation, skipped under prefers-reduced-motion.
 */
export function HeroOrbit({
  radius,
  tilt,
  color,
  speed,
  reducedMotion,
  nodeCount = 0,
}: HeroOrbitProps) {
  const groupRef = useRef<Group>(null);

  const points = useMemo(() => {
    const segments = 96;
    return Array.from({ length: segments + 1 }, (_, i) => {
      const theta = (i / segments) * Math.PI * 2;
      return new Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    });
  }, [radius]);

  const nodeAngles = useMemo(
    () => Array.from({ length: nodeCount }, (_, i) => (i / nodeCount) * Math.PI * 2),
    [nodeCount],
  );

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <group ref={groupRef}>
        <Line points={points} color={color} transparent opacity={0.26} lineWidth={1} />
        {nodeAngles.map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
