import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { HeroOrbit } from "./HeroOrbit";
import { HeroPlanet } from "./HeroPlanet";
import { HeroSpacecraft } from "./HeroSpacecraft";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Code-driven camera motion only — no OrbitControls, no user drag/zoom (see
 * AGENTS.md / UNIT 04 brief: the camera is controlled by the experience,
 * not the visitor). Uses R3F's built-in `pointer` from `useThree` for the
 * parallax influence instead of a hand-rolled `window` mousemove listener,
 * so there is no manual event listener to leak or clean up.
 */
function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, pointer } = useThree();
  const base = useRef({ x: camera.position.x, y: camera.position.y });

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    const floatY = Math.sin(t * 0.12) * 0.08;
    const parallaxX = pointer.x * 0.15;
    const parallaxY = -pointer.y * 0.07;
    camera.position.x = base.current.x + parallaxX;
    camera.position.y = base.current.y + floatY + parallaxY;
    camera.lookAt(0.5, 0, 0);
  });

  return null;
}

/**
 * The hero's 3D scene: one dominant dark planet with a blue/cyan rim glow,
 * two thin slow-rotating orbit rings carrying 6 unlabeled department-hint
 * markers total, a small stylized spacecraft, a restrained star field, and
 * a gently drifting camera. Lazy-loaded by `LandingHero` — this module
 * (and its `three`/`@react-three/fiber`/`@react-three/drei` dependency
 * graph) is not in the initial bundle.
 *
 * No real-time shadows, no post-processing, DPR capped at 1.5, geometry
 * and particle counts reduced on mobile via `quality`.
 */
export function HeroScene3D() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // Matches the codebase's existing `lg:` (1024px) desktop/mobile split
  // (see Navbar.tsx) rather than a narrower phone-only breakpoint — real
  // visual QA at 768px showed the "desktop" wide-framing still pushing the
  // planet into the headline text at that width. Below 1024px the planet
  // is repositioned as a small upper-right accent instead of a dominant
  // center-right object, so it never competes with the text column.
  const mobile = useMediaQuery("(max-width: 1023px)");
  const quality: "high" | "low" = mobile ? "low" : "high";

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{
        position: mobile ? [0, 0, 9] : [0.6, 0.1, 6.4],
        fov: mobile ? 40 : 38,
      }}
    >
      <color attach="background" args={["#04070e"]} />
      <ambientLight intensity={0.35} color="#3a6bb8" />
      <directionalLight position={[-4, 2, 3]} intensity={1.4} color="#4c8dff" />
      <directionalLight position={[3, -1.5, -2]} intensity={0.45} color="#55e6ff" />

      <Stars
        radius={40}
        depth={30}
        count={mobile ? 400 : 1400}
        factor={2.2}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.15}
      />

      {/* Mobile: small upper-right accent, well clear of the left-aligned
          text column (see comment above on the 1024px breakpoint choice).
          Desktop: the dramatic center-right placement verified via
          screenshot at 1024/1440/1920. */}
      <group position={mobile ? [1.65, 1.85, -1.8] : [1.5, 0, 0]} scale={mobile ? 0.42 : 1}>
        <HeroPlanet quality={quality} reducedMotion={reducedMotion} />
        <HeroOrbit
          radius={2.15}
          tilt={0.35}
          color="#4c8dff"
          speed={0.03}
          reducedMotion={reducedMotion}
          nodeCount={mobile ? 0 : 3}
        />
        <HeroOrbit
          radius={2.7}
          tilt={-0.22}
          color="#55e6ff"
          speed={-0.018}
          reducedMotion={reducedMotion}
          nodeCount={mobile ? 0 : 3}
        />
        {!mobile && <HeroSpacecraft reducedMotion={reducedMotion} />}
      </group>

      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
