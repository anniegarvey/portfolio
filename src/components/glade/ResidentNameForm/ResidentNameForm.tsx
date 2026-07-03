"use client";

import { styled } from "next-yak";
import { useId, useState } from "react";
import { Button } from "@/components/Button";

export interface ResidentNameFormProps {
  label: string;
  submitLabel: string;
  /** Species name, shown as the input placeholder. */
  placeholder: string;
  initialValue?: string;
  /** Focus the input on mount — for forms opened by a user action. */
  autoFocus?: boolean;
  onSubmit: (name: string) => void;
}

/** Compact form for giving a glade resident a personal name. */
export function ResidentNameForm({
  label,
  submitLabel,
  placeholder,
  initialValue,
  autoFocus = false,
  onSubmit,
}: ResidentNameFormProps) {
  const [draft, setDraft] = useState(initialValue ?? "");
  const inputId = useId();

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
    >
      <Label htmlFor={inputId}>{label}</Label>
      <Row>
        <Input
          autoComplete="off"
          autoFocus={autoFocus}
          id={inputId}
          maxLength={24}
          name="resident-name"
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          value={draft}
        />
        <Button
          disabled={draft.trim() === ""}
          size="sm"
          type="submit"
          variant="outline"
        >
          {submitLabel}
        </Button>
      </Row>
    </Form>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Row = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  width: 10rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.9rem;
  border-radius: 8px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(white, var(--color-grey-900));
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 1px;
  }
`;
