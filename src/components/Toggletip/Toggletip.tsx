"use client";

import { Info } from "lucide-react";
import { styled } from "next-yak";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/Button";

interface ToggletipProps {
  content: string;
}

export function Toggletip({ content }: ToggletipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);

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
        leftIcon={<Info aria-hidden size={16} />}
        onClick={() => setOpen((v) => !v)}
        variant="outline"
      >
        About
      </Button>
      <Popover hidden={!open} id={id} role="status">
        {content}
      </Popover>
    </Wrapper>
  );
}

const Wrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const Popover = styled.span`
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
