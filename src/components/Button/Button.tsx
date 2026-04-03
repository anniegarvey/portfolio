"use client";

import { Loader2 } from "lucide-react";
import { css, styled } from "next-yak";
import { useId } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: "solid" | "outline" | "ghost" | "dashed" | "link";
  intent?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "icon";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  ref,
  variant = "solid",
  intent = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const labelId = useId();
  const statusId = useId();

  return (
    <StyledButton
      $fullWidth={fullWidth}
      $intent={intent}
      $size={size}
      $variant={variant}
      disabled={disabled}
      ref={ref}
      style={{
        ...intentVariables[intent],
        ...props.style,
      }}
      type="button"
      {...props}
      // These must come after {...props} so loading state always wins
      aria-disabled={loading || undefined}
      aria-labelledby={loading ? `${labelId} ${statusId}` : undefined}
      onClick={loading ? undefined : onClick}
    >
      {loading ? (
        <>
          <VisuallyHidden id={labelId}>{children}</VisuallyHidden>
          <Loader2 aria-hidden className="animate-spin" size={16} />
          <VisuallyHidden id={statusId}>loading</VisuallyHidden>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
        </>
      )}
    </StyledButton>
  );
}

const intentVariables: Record<string, React.CSSProperties> = {
  primary: {
    "--btn-bg": "var(--color-primary-700)",
    "--btn-bg-hover": "var(--color-primary-800)",
    "--btn-text": "white",
    "--btn-border": "var(--color-primary-700)",
    "--btn-ghost-text":
      "light-dark(var(--color-primary-700), var(--color-primary-400))",
    "--btn-ghost-hover-bg":
      "light-dark(var(--color-primary-50), var(--color-primary-900))",
    "--btn-outline-text":
      "light-dark(var(--color-primary-700), var(--color-primary-400))",
    "--btn-outline-hover-text":
      "light-dark(var(--color-primary-700), var(--color-primary-400))",
  } as React.CSSProperties,
  secondary: {
    "--btn-bg": "light-dark(var(--color-grey-200), var(--color-grey-700))",
    "--btn-bg-hover":
      "light-dark(var(--color-grey-300), var(--color-grey-600))",
    "--btn-text": "light-dark(var(--color-grey-900), var(--color-grey-100))",
    "--btn-border": "light-dark(var(--color-grey-300), var(--color-grey-600))",
    "--btn-ghost-text":
      "light-dark(var(--color-grey-600), var(--color-grey-400))",
    "--btn-ghost-hover-bg":
      "light-dark(var(--color-grey-100), var(--color-grey-800))",
    "--btn-outline-text":
      "light-dark(var(--color-grey-700), var(--color-grey-300))",
    "--btn-outline-hover-text":
      "light-dark(var(--color-grey-900), var(--color-grey-100))",
  } as React.CSSProperties,
  danger: {
    "--btn-bg": "var(--color-rose-700)",
    "--btn-bg-hover": "var(--color-rose-800)",
    "--btn-text": "white",
    "--btn-border": "var(--color-rose-700)",
    "--btn-ghost-text": "var(--color-rose-700)",
    "--btn-ghost-hover-bg": "var(--color-rose-50)",
    "--btn-outline-text": "var(--color-rose-700)",
    "--btn-outline-hover-text": "var(--color-rose-700)",
  } as React.CSSProperties,
};

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const StyledButton = styled.button<{
  $variant: ButtonProps["variant"];
  $intent: ButtonProps["intent"];
  $size: ButtonProps["size"];
  $fullWidth?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  border: 1px solid transparent; /* Reserve space for border to prevent layout shift */

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled,
  &[aria-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  /* Sizes */
  ${({ $size }) => {
    switch ($size) {
      case "sm":
        return css`
          padding: 6px 12px;
          font-size: 0.85rem;
        `;
      case "icon":
        return css`
          padding: 8px;
          min-width: 40px;
          height: 40px;
        `;
      default:
        return css`
          padding: 8px 16px;
          font-size: 0.9rem;
        `;
    }
  }}

  /* Variants */
  ${({ $variant }) => {
    switch ($variant) {
      case "outline":
        return css`
          background-color: transparent;
          border-color: var(--btn-border);
          color: var(--btn-outline-text);

          &:hover:not(:disabled):not([aria-disabled="true"]) {
            background-color: var(--btn-ghost-hover-bg);
            color: var(--btn-outline-hover-text);
          }
        `;
      case "ghost":
        return css`
          background-color: transparent;
          border-color: transparent;
          color: var(--btn-ghost-text);

          &:hover:not(:disabled):not([aria-disabled="true"]) {
            background-color: var(--btn-ghost-hover-bg);
          }
        `;
      case "dashed":
        return css`
          background-color: transparent;
          border: 1px dashed var(--color-grey-300);
          color: light-dark(var(--color-grey-600), var(--color-grey-400));

          &:hover:not(:disabled):not([aria-disabled="true"]) {
            border-color: var(--btn-border);
            color: var(--btn-ghost-text);
            background-color: var(--btn-ghost-hover-bg);
          }
        `;
      case "link":
        return css`
          background: none;
          border: none;
          padding: 0;
          height: auto;
          color: var(--btn-ghost-text);
          text-decoration: underline;

          &:hover:not(:disabled):not([aria-disabled="true"]) {
            color: var(--btn-bg-hover);
          }
        `;
      default:
        return css`
          background-color: var(--btn-bg);
          border-color: var(--btn-border);
          color: var(--btn-text);
          box-shadow: var(--elevation-xs);

          &:hover:not(:disabled):not([aria-disabled="true"]),
          &:focus-visible:not(:disabled):not([aria-disabled="true"]) {
            background-color: var(--btn-bg-hover);
            border-color: var(--btn-bg-hover);
            box-shadow: var(--elevation-sm);
          }
        `;
    }
  }}
`;
