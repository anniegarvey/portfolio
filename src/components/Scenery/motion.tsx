"use client";

import { keyframes, styled } from "next-yak";
import type React from "react";

// ── Scenery motion ─────────────────────────────────────────────────────────────
//
// The small, slow movements the painted scenes (the bonsai gardens and the
// glade) are built from. Each is an SVG group that animates a transform or an
// opacity and nothing that drives layout, reads its tempo and reach from CSS
// custom properties so one keyframe serves every creature that shares it, and
// stops under reduced motion, where it parks at its authored position.
//
// An animated group's CSS transform replaces any `transform` attribute on the
// same element, so art is placed by an outer, static `<g transform>` and moved
// by one of these inside it. The turning motions pivot on their own box
// (`fill-box`), which holds however the art around them was placed.

/** Shorthand for the CSS custom properties these read. */
export function vars(entries: Record<string, string>): React.CSSProperties {
  return entries as React.CSSProperties;
}

/** A colour for each theme: the painted scenes turn to dusk in dark mode. */
export function ld(light: string, dark: string): string {
  return `light-dark(${light}, ${dark})`;
}

/**
 * A slow shift back and forth rather than a crossing: the sky moves, but
 * nothing arrives or departs, and nothing needs doubling up to loop.
 */
const sway = keyframes`
  0%, 100% { transform: translateX(calc(var(--sway-range) * -1)); }
  50%      { transform: translateX(var(--sway-range)); }
`;

export const Adrift = styled.g`
  animation: ${sway} var(--sway-period) var(--sway-offset, 0s) ease-in-out
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Falls, turns, and fades out near the ground before restarting. */
const fall = keyframes`
  0%   { opacity: 0; transform: translate(0, 0) rotate(0deg); }
  10%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--fall-x), var(--fall-y)) rotate(var(--fall-spin)); }
`;

export const Falling = styled.g`
  /* fill-box so a leaf turns about itself rather than about the scene origin. */
  transform-box: fill-box;
  transform-origin: center;
  animation: ${fall} var(--fall-period) var(--fall-offset, 0s) linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Light that breathes: lantern halos, glowing caps, stars a long way off. */
const glimmer = keyframes`
  0%, 100% { opacity: var(--glimmer-low); }
  50%      { opacity: 1; }
`;

export const Glimmer = styled.g`
  animation: ${glimmer} var(--glimmer-period) var(--glimmer-offset, 0s)
    ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Rises and settles: a bird on a birdbath, a hive's bee, a lily pad. */
const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(var(--bob-y)); }
`;

export const Bob = styled.g`
  animation: ${bob} var(--bob-period) var(--bob-offset, 0s) ease-in-out
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * Leans one way and back about a pivot on its own box (its foot, by default),
 * like a flower in a breeze or a squirrel's tail.
 */
const rock = keyframes`
  0%, 100% { transform: rotate(calc(var(--rock) * -1)); }
  50%      { transform: rotate(var(--rock)); }
`;

export const Rock = styled.g`
  transform-box: fill-box;
  transform-origin: var(--rock-origin, 50% 100%);
  animation: ${rock} var(--rock-period) var(--rock-offset, 0s) ease-in-out
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Turns right round about its own centre: sun rays, windmill sails. */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const Spin = styled.g`
  transform-box: fill-box;
  transform-origin: center;
  animation: ${spin} var(--spin-period) linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * A wandering loop through three waypoints and home again, for anything that
 * flies about rather than across: butterflies, bees, fireflies, a dragonfly.
 */
const wander = keyframes`
  0%, 100% { transform: translate(0, 0); }
  30%      { transform: translate(var(--w1x), var(--w1y)); }
  55%      { transform: translate(var(--w2x), var(--w2y)); }
  80%      { transform: translate(var(--w3x), var(--w3y)); }
`;

export const Wander = styled.g`
  animation: ${wander} var(--wander-period) var(--wander-offset, 0s)
    ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Wings beating: squashes towards the body along one axis, and back. */
const flapAcross = keyframes`
  0%, 100% { transform: scaleX(1); }
  50%      { transform: scaleX(0.28); }
`;

const flapUp = keyframes`
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(-0.6); }
`;

/** Butterfly wings, seen from above: they fold in towards the body. */
export const FlapAcross = styled.g`
  transform-box: fill-box;
  transform-origin: center;
  animation: ${flapAcross} var(--flap-period, 0.4s) var(--flap-offset, 0s)
    ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** A bird's wings, seen side on: they beat about the line of the body. */
export const FlapUp = styled.g`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${flapUp} var(--flap-period, 0.9s) var(--flap-offset, 0s)
    ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * A crossing, faded in and out at either end so the jump back to the start is
 * never seen: birds over the mountains, a snail on its long way over the path.
 */
const cross = keyframes`
  0%   { opacity: 0; transform: translate(0, 0); }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--cross-x), var(--cross-y, 0px)); }
`;

export const Cross = styled.g`
  animation: ${cross} var(--cross-period) var(--cross-offset, 0s) linear
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * A streak that shoots across the sky and is gone, then a long wait. Hidden at
 * rest, so under reduced motion there is simply no shooting star.
 */
const shoot = keyframes`
  0%       { opacity: 0; transform: translate(0, 0); }
  1.5%     { opacity: 1; }
  6%, 100% { opacity: 0; transform: translate(var(--cross-x), var(--cross-y)); }
`;

export const Shoot = styled.g`
  opacity: 0;
  animation: ${shoot} var(--cross-period) var(--cross-offset, 0s) ease-in
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Runs downward on a loop, inside a clip: water falling. */
const pour = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(var(--pour-y)); }
`;

export const Pour = styled.g`
  animation: ${pour} var(--pour-period) linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** A ring spreading on still water, fading as it goes. */
const ripple = keyframes`
  0%   { opacity: 0.9; transform: scale(0.3); }
  100% { opacity: 0; transform: scale(1.4); }
`;

export const Ripple = styled.g`
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: ${ripple} var(--ripple-period) var(--ripple-offset, 0s) ease-out
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Eyes open nearly all the time, with a quick blink near the end. */
const blink = keyframes`
  0%, 92%, 100% { transform: scaleY(1); }
  95%           { transform: scaleY(0.1); }
`;

export const Blink = styled.g`
  transform-box: fill-box;
  transform-origin: center;
  animation: ${blink} var(--blink-period, 6s) var(--blink-offset, 0s) linear
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
