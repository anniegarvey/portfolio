"use client";

import { styled } from "next-yak";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { GITHUB_REPO_URL } from "@/lib/constants";

export function SuggestionForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const canSubmit = title.trim() !== "" && description.trim() !== "";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams({
      title,
      body: description,
      labels: "enhancement",
    });
    const url = `${GITHUB_REPO_URL}/issues/new?${params}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    setBlockedUrl(opened ? null : url);
  }

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor={titleId}>Title</Label>
          <Input
            id={titleId}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            required
            value={title}
          />
        </Field>
        <Field>
          <Label htmlFor={descriptionId}>Description</Label>
          <TextArea
            id={descriptionId}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            value={description}
          />
        </Field>
        <Button disabled={!canSubmit} type="submit">
          Continue to GitHub
        </Button>
      </Form>
      {blockedUrl && (
        <BlockedNotice role="alert">
          Your browser blocked the new tab.{" "}
          <a href={blockedUrl} rel="noopener noreferrer" target="_blank">
            Open the GitHub issue manually
          </a>
          .
        </BlockedNotice>
      )}
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 40rem;
  margin-inline: auto;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Input = styled.input`
  padding: 0.5rem 0.7rem;
  font-size: 1rem;
  font-family: inherit;
  border-radius: 8px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(white, var(--color-grey-900));
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 1px;
  }
`;

const TextArea = styled.textarea`
  padding: 0.5rem 0.7rem;
  font-size: 1rem;
  font-family: inherit;
  border-radius: 8px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(white, var(--color-grey-900));
  color: inherit;
  resize: vertical;

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 1px;
  }
`;

const BlockedNotice = styled.p`
  max-width: 40rem;
  margin-inline: auto;
  margin-top: 1rem;
  color: light-dark(var(--color-rose-700), var(--color-rose-300));
`;
