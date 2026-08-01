"use client";

import { keyframes, styled } from "next-yak";

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

export const SkeletonBox = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => $height ?? "16px"};
  border-radius: ${({ $radius }) => $radius ?? "4px"};
  background: light-dark(
    linear-gradient(90deg, var(--color-grey-200) 25%, var(--color-grey-100) 50%, var(--color-grey-200) 75%),
    linear-gradient(90deg, var(--color-grey-800) 25%, var(--color-grey-700) 50%, var(--color-grey-800) 75%)
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: light-dark(var(--color-grey-200), var(--color-grey-800));
  }
`;
