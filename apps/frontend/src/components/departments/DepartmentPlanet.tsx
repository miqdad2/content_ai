import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group, type Mesh } from "three";
import { RimGlowMaterial } from "@/components/three/RimGlowMaterial";
import { THREE_COLORS } from "@/lib/three-theme";
import type { PlanetVariant } from "./departments.data";

interface DepartmentPlanetProps {
  variant: PlanetVariant;
  color: string;
  size: number;
  active: boolean;
  reducedMotion: boolean;
  lowQuality: boolean;
}

/** Small tick-mark ring used by the "segmented" (Analytics) variant — a
 * data/grid feel instead of a smooth line. */
function SegmentedRing({ radius, color, count }: { radius: number; color: string; count: number }) {
  const segments = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2).map((angle) => ({
        angle,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
      })),
    [radius, count],
  );
  return (
    <group rotation={[Math.PI / 2.3, 0, 0]}>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]} rotation={[0, -s.angle, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.14]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Two small moons for the "satellites" (Social Media) variant — orbit
 * their own parent group independently of the planet's own spin. */
function Satellites({ radius, color, reducedMotion }: { radius: number; color: string; reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={groupRef} rotation={[Math.PI / 5, 0, 0]}>
      {[0, (Math.PI * 2) / 3].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * One department planet. Shares the hero's two-sphere body+rim technique
 * (see RimGlowMaterial) as its base, then layers a variant-specific
 * decoration so all six read as one coherent blue/cyan/steel/indigo family
 * while staying visually distinct — see departments.data.ts for which
 * variant maps to which department and the design rationale.
 */
export function DepartmentPlanet({
  variant,
  color,
  size,
  active,
  reducedMotion,
  lowQuality,
}: DepartmentPlanetProps) {
  const bodyRef = useRef<Mesh>(null);
  const segments = lowQuality ? 24 : 48;
  const radius = 0.95 * size;

  useFrame((_, delta) => {
    if (reducedMotion || !bodyRef.current) return;
    bodyRef.current.rotation.y += delta * 0.05;
  });

  const rimIntensity = active ? 1.05 : variant === "atmospheric" ? 0.5 : 0.65;
  const rimScale = variant === "atmospheric" ? 1.09 : 1.035;

  return (
    <group>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial color={THREE_COLORS.bodyDark} roughness={0.78} metalness={0.18} />
      </mesh>
      <mesh scale={rimScale}>
        <sphereGeometry args={[radius, segments, segments]} />
        <RimGlowMaterial color={color} intensity={rimIntensity} />
      </mesh>

      {variant === "ringed" && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[radius * 1.35, radius * 1.7, lowQuality ? 32 : 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.32} side={DoubleSide} toneMapped={false} />
        </mesh>
      )}

      {variant === "segmented" && (
        <SegmentedRing radius={radius * 1.5} color={color} count={lowQuality ? 16 : 28} />
      )}

      {variant === "satellites" && !lowQuality && (
        <Satellites radius={radius * 1.8} color={color} reducedMotion={reducedMotion} />
      )}

      {/* Active-selection halo — a third, larger, very faint shell so the
          selected planet reads as emphasized without needing a label
          baked into the canvas (see DepartmentInfo for the accessible
          text version of "this one is selected"). */}
      {active && (
        <mesh scale={rimScale * 1.18}>
          <sphereGeometry args={[radius, segments, segments]} />
          <RimGlowMaterial color={color} intensity={0.28} />
        </mesh>
      )}
    </group>
  );
}
