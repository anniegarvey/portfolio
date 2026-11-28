"use client";

import { Lightbulb } from "lucide-react";
import { styled } from "next-yak";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import { isInstalledApp } from "@/lib/energy-planner/utils";

// One field, one key: an idea is saved as a one-off with only a name, and the
// rest is filled in when it gets planned.
export function JotBox({
  inputRef: givenRef,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const { addActivity } = useEnergyPlanner();
  const [title, setTitle] = useState("");
  // Counted, so saving the same name twice still restarts the message
  const [saved, setSaved] = useState({ name: "", count: 0 });
  const ownRef = useRef<HTMLInputElement>(null);
  const inputRef = givenRef ?? ownRef;

  // Opening or returning to the installed app (from the home or lock screen)
  // is usually to jot something down, so start there.
  useEffect(() => {
    if (!isInstalledApp()) return;
    const focus = () => inputRef.current?.focus();
    focus();
    // Coming back shouldn't pull focus out of a dialog or another field
    const onVisible = () => {
      const active = document.activeElement;
      const busy =
        active?.closest('[role="dialog"]') ||
        (active !== inputRef.current &&
          active?.matches("input, textarea, select"));
      if (document.visibilityState === "visible" && !busy) focus();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [inputRef]);

  useEffect(() => {
    if (!saved.name) return;
    const timer = setTimeout(
      () => setSaved((prev) => ({ ...prev, name: "" })),
      3000,
    );
    return () => clearTimeout(timer);
  }, [saved]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = title.trim();
    if (!name) return;
    addActivity({
      title: name,
      energyCost: {},
      factors: {
        initiationDifficulty: 0,
        terminationDifficulty: 0,
        isRestorative: false,
      },
    });
    setTitle("");
    setSaved((prev) => ({ name, count: prev.count + 1 }));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Lightbulb aria-hidden size={16} />
        <Input
          aria-label="Jot down an idea"
          autoComplete="off"
          enterKeyHint="done"
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Jot down an idea…"
          ref={inputRef}
          value={title}
        />
      </Field>
      <Status aria-live="polite">
        {saved.name ? (
          <span key={saved.count}>
            Saved &ldquo;{saved.name}&rdquo; to your ideas
          </span>
        ) : null}
      </Status>
    </Form>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Field = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background-color: light-dark(white, var(--color-grey-900));
  color: light-dark(var(--color-primary-600), var(--color-primary-300));

  &:focus-within {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px
      color-mix(in oklch, var(--color-primary-500) 25%, transparent);
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: light-dark(var(--color-grey-900), var(--color-grey-50));
  font: inherit;
  font-size: 1rem;
  outline: none;

  &::placeholder {
    color: light-dark(var(--color-grey-500), var(--color-grey-400));
  }
`;

const Status = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
