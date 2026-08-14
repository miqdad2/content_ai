import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { MathUtils, Vector3 } from "three";
import { DepartmentOrbit } from "./DepartmentOrbit";
import { DepartmentPlanet } from "./DepartmentPlanet";
import { DEPARTMENTS } from "./departments.data";
import { IntelligenceCore } from "@/components/three/IntelligenceCore";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SCENE_DPR, THREE_COLORS } from "@/lib/three-theme";

const LAYOUT_RADIUS = 3.1;
const TILT = 0.33;

/** Planets sit at fixed angles baked directly into a tilted-disc position
 * (rather than a flat circle + a separate group rotation) so this same
 * [x, y, z] can be used unmodified as both the render position and the
 * camera look-at target — no matrix math needed at camera-transition time.
 * See DepartmentOrbit.tsx for why the ring itself must stay unrotated to
 * match. */
function departmentPosition(angleDeg: number, radius = LAYOUT_RADIUS): Vector3 {
  const angle = (angleDeg * Math.PI) / 180;
  const x = radius * Math.sin(angle);
  const y = radius * Math.cos(angle) * Math.sin(TILT);
  const z = -radius * Math.cos(angle) * Math.cos(TILT);
  return new Vector3(x, y, z);
}

interface CameraDirectorProps {
  activeIndex: number;
  reducedMotion: boolean;
  mobile: boolean;
}

/**
 * Fully code-driven camera — no OrbitControls, no user drag/zoom (same
 * invariant as the hero, see HeroScene3D). Damps toward a target position
 * derived from the selected department's fixed layout position using
 * `MathUtils.damp` (frame-rate-independent exponential ease, ~900-1200ms
 * feel at this lambda) rather than a linear lerp. Reduced motion snaps
 * directly to the target instead of easing.
 */
function CameraDirector({ activeIndex, reducedMotion, mobile }: CameraDirectorProps) {
  const { camera } = useThree();
  const lookTarget = useRef(new Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const dept = DEPARTMENTS[activeIndex];
    if (!dept) return;
    const planetPos = departmentPosition(dept.angleDeg);

    const camTargetX = planetPos.x * (mobile ? 0.35 : 0.52);
    const camTargetY = planetPos.y * 0.5 + (mobile ? 0.4 : 0.9);
    const camTargetZ = planetPos.z * 0.5 + (mobile ? 5.6 : 6.6);

    // Very small idle drift, additive, disabled under reduced motion —
    // matches the hero's restrained ambient-float feel.
    const t = state.clock.getElapsedTime();
    const driftY = reducedMotion ? 0 : Math.sin(t * 0.15) * 0.05;

    if (reducedMotion) {
      camera.position.set(camTargetX, camTargetY, camTargetZ);
      lookTarget.current.copy(planetPos);
    } else {
      const lambda = 3.2;
      camera.position.x = MathUtils.damp(camera.position.x, camTargetX, lambda, delta);
      camera.position.y = MathUtils.damp(camera.position.y, camTargetY + driftY, lambda, delta);
      camera.position.z = MathUtils.damp(camera.position.z, camTargetZ, lambda, delta);
      lookTarget.current.x = MathUtils.damp(lookTarget.current.x, planetPos.x, lambda, delta);
      lookTarget.current.y = MathUtils.damp(lookTarget.current.y, planetPos.y, lambda, delta);
      lookTarget.current.z = MathUtils.damp(lookTarget.current.z, planetPos.z, lambda, delta);
    }
    camera.lookAt(lookTarget.current);
  });

  return null;
}

interface DepartmentScene3DProps {
  activeIndex: number;
}

/**
 * The department universe: a central cre8.ai core, one static decorative
 * orbit ring, and six department planets at fixed positions on that ring
 * (see departmentPosition above for why they're fixed rather than
 * revolving). Lazy-loaded by DepartmentUniverse — shares the `three` /
 * `@react-three/fiber` / `@react-three/drei` chunk already introduced by
 * the landing hero rather than pulling in a second copy (see UNIT 05
 * report §"Performance/bundle impact").
 */
export function DepartmentScene3D({ activeIndex }: DepartmentScene3DProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 1023px)");
  const lowQuality = mobile;

  const positions = useMemo(
    () => DEPARTMENTS.map((d) => departmentPosition(d.angleDeg)),
    [],
  );

  return (
    <Canvas
      dpr={SCENE_DPR}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.9, mobile ? 6.5 : 8.2], fov: mobile ? 44 : 40 }}
    >
      <color attach="background" args={[THREE_COLORS.spaceBlack]} />
      <ambientLight intensity={0.35} color={THREE_COLORS.primary} />
      <directionalLight position={[-4, 3, 3]} intensity={1.3} color={THREE_COLORS.primary} />
      <directionalLight position={[3, -1, -3]} intensity={0.5} color={THREE_COLORS.cyan} />

      <Stars
        radius={40}
        depth={25}
        count={mobile ? 350 : 900}
        factor={2}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.1}
      />

      <IntelligenceCore reducedMotion={reducedMotion} lowQuality={lowQuality} />
      <DepartmentOrbit radius={LAYOUT_RADIUS} color={THREE_COLORS.steel} />

      {DEPARTMENTS.map((dept, i) => (
        <group key={dept.id} position={positions[i]}>
          <DepartmentPlanet
            variant={dept.planetVariant}
            color={dept.color}
            size={dept.size}
            active={i === activeIndex}
            reducedMotion={reducedMotion}
            lowQuality={lowQuality}
          />
        </group>
      ))}

      <CameraDirector activeIndex={activeIndex} reducedMotion={reducedMotion} mobile={mobile} />
    </Canvas>
  );
}
