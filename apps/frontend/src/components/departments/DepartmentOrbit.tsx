import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { Vector3 } from "three";

interface DepartmentOrbitProps {
  radius: number;
  color: string;
}

/**
 * One thin, fully static decorative ring showing the conceptual orbit path
 * the six department planets sit on. Deliberately does NOT rotate: the
 * planets sit at fixed angles on this ring (see departments.data.ts) rather
 * than traveling around it, so the ring must stay perfectly aligned with
 * them — an independently-rotating ring would visibly drift away from the
 * fixed planets sitting "on" it. Individual planets still self-rotate
 * (spin) for liveliness; only the ring itself is static. Reuses the same
 * drei `Line` technique as the hero's HeroOrbit (thin lines need it —
 * native GL_LINES clamp to ~1px on most platforms) but simpler: no marker
 * nodes, since the actual planets already occupy this ring.
 */
export function DepartmentOrbit({ radius, color }: DepartmentOrbitProps) {
  const points = useMemo(() => {
    const segments = 96;
    return Array.from({ length: segments + 1 }, (_, i) => {
      const theta = (i / segments) * Math.PI * 2;
      return new Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    });
  }, [radius]);

  return <Line points={points} color={color} transparent opacity={0.22} lineWidth={1} />;
}
