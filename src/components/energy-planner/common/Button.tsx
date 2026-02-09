"use client";

import { Loader2 } from "lucide-react";
import { css, styled } from "next-yak";
import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost" | "dashed" | "link";
  intent?: "primary" | "secondary" | "danger" | "teal";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "solid",
      intent = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <StyledButton
        $fullWidth={fullWidth}
        $intent={intent}
        $size={size}
        $variant={variant}
        disabled={disabled || isLoading}
        ref={ref}
        style={{
          ...getIntentVariables(intent),
          ...props.style,
        }}
        type="button" // Default to button to prevent accidental form submission
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <>
            {leftIcon && <IconWrapper>{leftIcon}</IconWrapper>}
            {children}
            {rightIcon && <IconWrapper>{rightIcon}</IconWrapper>}
          </>
        )}
      </StyledButton>
    );
  },
);

Button.displayName = "Button";

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  border: 1px solid transparent; /* Reserve space for border to prevent layout shift */

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled {
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
      case "xs":
        return css`
          padding: 2px 6px;
          font-size: 0.75rem;
          border-radius: 4px;
        `;
      case "sm":
        return css`
          padding: 6px 12px;
          font-size: 0.85rem;
        `;
      case "lg":
        return css`
          padding: 10px 20px;
          font-size: 1rem;
        `;
      case "icon":
        return css`
          padding: 6px;
          min-width: 32px;
          height: 32px;
        `;
      default:
        return css`
          padding: 8px 16px;
          font-size: 0.9rem;
        `;
    }
  }}

  /* Variants & Intents */
  /* Variants using CSS Variables */
  ${({ $variant }) => {
    switch ($variant) {
      case "outline":
        return css`
          background-color: transparent;
          border-color: var(--btn-border);
          color: var(--btn-outline-text);

          &:hover:not(:disabled) {
            background-color: var(--btn-ghost-hover-bg);
            color: var(--btn-outline-hover-text);
          }
        `;
      case "ghost":
        return css`
          background-color: transparent;
          border-color: transparent;
          color: var(--btn-ghost-text);

          &:hover:not(:disabled) {
            background-color: var(--btn-ghost-hover-bg);
          }
        `;
      case "dashed":
        return css`
          background-color: transparent;
          border: 1px dashed var(--color-grey-300);
          color: light-dark(var(--color-grey-600), var(--color-grey-400));
          
          &:hover:not(:disabled) {
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
          
          &:hover:not(:disabled) {
             color: var(--btn-bg-hover);
          }
        `;
      default:
        return css`
          background-color: var(--btn-bg);
          border-color: var(--btn-border);
          color: var(--btn-text);
          
          &:hover:not(:disabled) {
            background-color: var(--btn-bg-hover);
            border-color: var(--btn-bg-hover);
          }
        `;
    }
  }}
`;

const getIntentVariables = (intent: string): React.CSSProperties => {
  const colors = {
    primary: {
      bg: "var(--color-primary-700)",
      bgHover: "var(--color-primary-800)",
      text: "white",
      border: "var(--color-primary-700)",
      ghostText:
        "light-dark(var(--color-primary-700), var(--color-primary-400))",
      ghostHoverBg:
        "light-dark(var(--color-primary-50), var(--color-primary-900))",
      outlineText:
        "light-dark(var(--color-primary-700), var(--color-primary-400))",
      outlineHoverText:
        "light-dark(var(--color-primary-700), var(--color-primary-400))",
    },
    secondary: {
      bg: "light-dark(var(--color-grey-200), var(--color-grey-700))",
      bgHover: "light-dark(var(--color-grey-300), var(--color-grey-600))",
      text: "light-dark(var(--color-grey-900), var(--color-grey-100))",
      border: "light-dark(var(--color-grey-300), var(--color-grey-600))",
      ghostText: "light-dark(var(--color-grey-600), var(--color-grey-400))",
      ghostHoverBg: "light-dark(var(--color-grey-100), var(--color-grey-800))",
      outlineText: "light-dark(var(--color-grey-700), var(--color-grey-300))",
      outlineHoverText:
        "light-dark(var(--color-grey-900), var(--color-grey-100))",
    },
    danger: {
      bg: "var(--color-rose-700)",
      bgHover: "var(--color-rose-800)",
      text: "white",
      border: "var(--color-rose-700)",
      ghostText: "var(--color-rose-700)",
      ghostHoverBg: "var(--color-rose-50)",
      outlineText: "var(--color-rose-700)",
      outlineHoverText: "var(--color-rose-700)",
    },
    teal: {
      bg: "var(--color-teal-700)",
      bgHover: "var(--color-teal-800)",
      text: "white",
      border: "var(--color-teal-700)",
      ghostText: "var(--color-teal-700)",
      ghostHoverBg: "var(--color-teal-50)",
      outlineText: "var(--color-teal-700)",
      outlineHoverText: "var(--color-teal-700)",
    },
  };

  const c = colors[intent as keyof typeof colors] || colors.primary;

  return {
    "--btn-bg": c.bg,
    "--btn-bg-hover": c.bgHover,
    "--btn-text": c.text,
    "--btn-border": c.border,
    "--btn-ghost-text": c.ghostText,
    "--btn-ghost-hover-bg": c.ghostHoverBg,
    "--btn-outline-text": c.outlineText,
    "--btn-outline-hover-text": c.outlineHoverText,
  } as React.CSSProperties;
};
