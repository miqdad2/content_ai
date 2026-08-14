import { useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Stars } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { IntelligenceCore } from "@/components/three/IntelligenceCore";
import { DEPARTMENTS } from "@/components/departments/departments.data";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SCENE_DPR, THREE_COLORS } from "@/lib/three-theme";

const NODE_RADIUS = 2.05;

/** Flat, camera-facing hub-and-spoke layout — deliberately NOT the tilted
 * "solar system" disc DepartmentScene3D uses. This is a diagram (shared
 * context radiating outward), not a planetary universe; reusing the exact
 * same visual grammar as the department page would blur that distinction.
 * Reuses DEPARTMENTS' angleDeg values purely so the two visuals agree on
 * which direction each department "lives in" conceptually. */
function nodePosition(angleDeg: number): Vector3 {
  const angle = (angleDeg * Math.PI) / 180;
  return new Vector3(Math.sin(angle) * NODE_RADIUS, Math.cos(angle) * NODE_RADIUS, 0);
}

interface BrandCoreScene3DProps {
  /** -1 = no department selected/hovered; otherwise highlights that
   * spoke + node so the 3D visual reinforces the DOM category-highlight
   * interaction (see BrandMemorySection). */
  activeIndex: number;
}

/**
 * `useFrame` must run inside a component rendered *underneath* `<Canvas>`
 * in the tree — calling it from the component that returns `<Canvas>`
 * itself throws "R3F: Hooks can only be used within the Canvas component!"
 * (caught the hard way via UNIT 06's automated interaction QA, which
 * surfaced it as a console error even though the ErrorBoundary silently
 * masked it visually). This wrapper exists solely so the rotation hook has
 * a valid place to live; hub+spokes+nodes rotate together as one rigid
 * unit — never independently, so nothing can visually drift apart (same
 * lesson as DepartmentOrbit.tsx in UNIT 05).
 */
function RotatingHub({ reducedMotion, children }: { reducedMotion: boolean; children: ReactNode }) {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.05;
  });
  return (
    <group ref={groupRef} rotation={[0.14, 0, 0]}>
      {children}
    </group>
  );
}

/**
 * The Brand Memory diagram: the shared IntelligenceCore (see
 * components/three/IntelligenceCore.tsx) at the center with six thin
 * spokes radiating out to small department nodes — "shared context flows
 * outward to every department." Lazy-loaded by BrandMemorySection; shares
 * the same `three`/`@react-three/fiber`/`@react-three/drei` vendor chunk
 * already used by the hero and department universe (verified in the
 * UNIT 06 build output, no duplicate chunk).
 */
export function BrandCoreScene3D({ activeIndex }: BrandCoreScene3DProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 1023px)");

  const nodes = useMemo(() => DEPARTMENTS.map((d) => nodePosition(d.angleDeg)), []);

  return (
    <Canvas
      dpr={SCENE_DPR}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, mobile ? 6.8 : 6.2], fov: mobile ? 42 : 38 }}
    >
      <color attach="background" args={[THREE_COLORS.spaceBlack]} />
      <ambientLight intensity={0.35} color={THREE_COLORS.primary} />
      <directionalLight position={[-3, 2, 4]} intensity={1.2} color={THREE_COLORS.primary} />
      <directionalLight position={[3, -2, -2]} intensity={0.4} color={THREE_COLORS.cyan} />

      <Stars
        radius={38}
        depth={22}
        count={mobile ? 250 : 600}
        factor={2}
        saturation={0}
        fade
        speed={0}
      />

      <RotatingHub reducedMotion={reducedMotion}>
        <IntelligenceCore reducedMotion={reducedMotion} lowQuality={mobile} scale={1.15} />
        {DEPARTMENTS.map((dept, i) => {
          const highlighted = i === activeIndex;
          const color = highlighted ? dept.color : THREE_COLORS.steel;
          return (
            <group key={dept.id}>
              <Line
                points={[new Vector3(0, 0, 0), nodes[i]!]}
                color={color}
                transparent
                opacity={highlighted ? 0.85 : 0.22}
                lineWidth={highlighted ? 1.6 : 1}
              />
              <mesh position={nodes[i]}>
                <sphereGeometry args={[highlighted ? 0.13 : 0.09, mobile ? 10 : 14, mobile ? 10 : 14]} />
                <meshBasicMaterial color={color} toneMapped={false} transparent opacity={highlighted ? 1 : 0.6} />
              </mesh>
            </group>
          );
        })}
      </RotatingHub>
    </Canvas>
  );
}
