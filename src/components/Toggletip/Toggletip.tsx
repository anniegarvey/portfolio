"use client";

import { Info } from "lucide-react";
import { styled } from "next-yak";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";

interface ToggletipProps {
  content: React.ReactNode;
  /** Trigger button label. Defaults to "About". */
  label?: string;
  /** Trigger button icon. Defaults to an info glyph. */
  icon?: React.ReactNode;
}

const VIEWPORT_MARGIN = 8;

export function Toggletip({
  content,
  label = "About",
  icon = <Info aria-hidden size={16} />,
}: ToggletipProps) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // The popover is centered on the trigger by default (see `left`/`transform`
  // below). On a narrow viewport that can push it past the screen edge with
  // no way to read the clipped half, so once it's open we nudge it back on
  // screen by exactly as much as it overflows.
  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const rect = popoverRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (rect.left < VIEWPORT_MARGIN) {
      setShift(VIEWPORT_MARGIN - rect.left);
    } else if (rect.right > window.innerWidth - VIEWPORT_MARGIN) {
      setShift(window.innerWidth - VIEWPORT_MARGIN - rect.right);
    } else {
      setShift(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [open]);

  return (
    <Wrapper ref={wrapperRef}>
      <Button
        aria-controls={id}
        aria-expanded={open}
        intent="secondary"
        leftIcon={icon}
        onClick={() => setOpen((v) => !v)}
        variant="outline"
      >
        {label}
      </Button>
      <Popover
        hidden={!open}
        id={id}
        ref={popoverRef}
        role="status"
        style={
          shift !== 0
            ? { transform: `translateX(calc(-50% + ${shift}px))` }
            : undefined
        }
      >
        {open && content}
      </Popover>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: max-content;
  max-width: min(280px, 90vw);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  background: light-dark(white, var(--color-grey-800));
  box-shadow: var(--elevation-md, 0 4px 16px rgba(0, 0, 0, 0.12));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));

  &[hidden] {
    display: none;
  }
`;
