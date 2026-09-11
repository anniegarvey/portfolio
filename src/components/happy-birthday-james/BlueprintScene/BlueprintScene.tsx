"use client";

import { styled } from "next-yak";
import { useEffect, useRef } from "react";

const VERTEX_SRC = `#version 300 es
void main() {
  vec2 pos[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`;

const FRAGMENT_SRC = `#version 300 es
precision mediump float;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform vec3 uLineColor;
uniform float uOpacity;
uniform float uDrift;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = uv;
  p.x *= aspect;

  vec2 parallax = uMouse * 0.14;
  vec2 drift = vec2(uTime * 0.015, uTime * 0.01) * uDrift;
  vec2 g = (p + parallax + drift) * 15.0;

  vec2 gridDist = abs(fract(g - 0.5) - 0.5) / fwidth(g);
  float line = min(gridDist.x, gridDist.y);
  float alpha = 1.0 - clamp(line, 0.0, 1.0);

  vec2 center = vec2(aspect * 0.5, 0.5);
  float vignette = smoothstep(0.95, 0.05, distance(p, center));

  outColor = vec4(uLineColor, alpha * uOpacity * vignette);
}`;

// Lavender line on dark, deeper violet on light — same brand hue either way.
const LINE_COLOR_DARK: readonly [number, number, number] = [0.72, 0.64, 0.98];
const LINE_COLOR_LIGHT: readonly [number, number, number] = [0.42, 0.28, 0.78];

function isDarkTheme(): boolean {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface GridUniforms {
  resolution: WebGLUniformLocation | null;
  mouse: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  lineColor: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
  drift: WebGLUniformLocation | null;
}

function drawGrid(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  uniforms: GridUniforms,
  mouse: { x: number; y: number },
  elapsedSeconds: number,
  reduceMotion: boolean,
): void {
  const dark = isDarkTheme();
  const [r, g, b] = dark ? LINE_COLOR_DARK : LINE_COLOR_LIGHT;

  gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
  gl.uniform2f(uniforms.mouse, mouse.x, mouse.y);
  gl.uniform1f(uniforms.time, elapsedSeconds);
  gl.uniform3f(uniforms.lineColor, r, g, b);
  gl.uniform1f(uniforms.opacity, dark ? 0.22 : 0.16);
  gl.uniform1f(uniforms.drift, reduceMotion ? 0 : 1);

  // Blending is enabled so the grid composites against the page behind the
  // canvas; without clearing first, each frame would also blend on top of
  // the previous one instead of replacing it, smearing motion into a static
  // average rather than showing a moving grid.
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * A drafting-table backdrop for the hero: an animated blueprint grid that
 * tilts toward the cursor, rendered with a hand-rolled WebGL2 shader rather
 * than an animated CSS background so the parallax reads as depth, not a
 * sliding pattern. Purely ambient — the grid never gates content, so it's
 * skipped outright (not degraded) if WebGL2 or its context creation fails.
 */
export function BlueprintScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dev-mode Strict Mode runs this effect twice on mount. The two runs
    // share the same canvas/context (a canvas keeps one WebGL context for
    // its lifetime), so without this guard both instances' rAF loops draw
    // to it every frame — whichever runs last each tick wins, and since one
    // of them is the orphaned first instance frozen at mouse (0, 0), the
    // parallax looked permanently stuck.
    let active = true;

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!(vs && fs)) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL API call, not a React hook
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uniforms: GridUniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      time: gl.getUniformLocation(program, "uTime"),
      lineColor: gl.getUniformLocation(program, "uLineColor"),
      opacity: gl.getUniformLocation(program, "uOpacity"),
      drift: gl.getUniformLocation(program, "uDrift"),
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect?.width ?? canvas.clientWidth));
      const height = Math.max(
        1,
        Math.round(rect?.height ?? canvas.clientHeight),
      );
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl?.viewport(0, 0, canvas.width, canvas.height);
    }

    function handlePointerMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      targetMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reduceMotion)
      window.addEventListener("pointermove", handlePointerMove);

    let rafId: number;
    const start = performance.now();

    function frame(now: number) {
      if (!(active && gl && canvas)) return;
      mouse.x += (targetMouse.x - mouse.x) * 0.06;
      mouse.y += (targetMouse.y - mouse.y) * 0.06;
      drawGrid(gl, canvas, uniforms, mouse, (now - start) / 1000, reduceMotion);
      if (!reduceMotion) rafId = requestAnimationFrame(frame);
    }

    frame(start);

    return () => {
      active = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <Canvas aria-hidden="true" ref={canvasRef} />;
}

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;
