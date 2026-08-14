import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color } from "three";

/**
 * Cheap fresnel/rim-glow shader — the standard "slightly larger backside
 * sphere with a view-angle falloff" technique, not a multi-pass or
 * physically-based atmosphere. Extracted from UNIT 04's HeroPlanet in
 * UNIT 05 so the department planets can reuse the exact same glow instead
 * of a second copy of this GLSL.
 */
const RIM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    rim = pow(rim, 3.4);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

interface RimGlowMaterialProps {
  color?: string;
  intensity?: number;
}

/** Drop onto a slightly-larger backside-only copy of a sphere mesh — see
 * HeroPlanet.tsx or DepartmentPlanet.tsx for the two-sphere usage pattern. */
export function RimGlowMaterial({ color = "#4fb8ff", intensity = 0.72 }: RimGlowMaterialProps) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <shaderMaterial
      vertexShader={RIM_VERTEX}
      fragmentShader={RIM_FRAGMENT}
      uniforms={uniforms}
      transparent
      blending={AdditiveBlending}
      side={BackSide}
      depthWrite={false}
    />
  );
}
