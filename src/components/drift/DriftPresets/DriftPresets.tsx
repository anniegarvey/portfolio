"use client";

import { Trash2 } from "lucide-react";
import { styled } from "next-yak";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/Button";
import { MAX_PRESET_NAME, type Preset } from "@/lib/drift/presets";

type Props = {
  presets: Preset[];
  onSave: (name: string) => void;
  onApply: (preset: Preset) => void;
  onDelete: (name: string) => void;
};

/** Save the current settings under a name, and bring them back later. */
export function DriftPresets({ presets, onSave, onApply, onDelete }: Props) {
  const id = useId();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const trimmed = name.trim();
  const overwrites = presets.some(
    (p) => p.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
  );

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed === "") return;
    onSave(trimmed);
    setStatus(`${overwrites ? "Updated" : "Saved"} “${trimmed}”.`);
    setName("");
  };

  return (
    <Group aria-labelledby={`${id}-heading`}>
      <Heading id={`${id}-heading`}>Saved settings</Heading>

      <Form onSubmit={save}>
        <NameLabel htmlFor={`${id}-name`}>Name these settings</NameLabel>
        <NameRow>
          <NameInput
            id={`${id}-name`}
            maxLength={MAX_PRESET_NAME}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Evening calm"
            value={name}
          />
          <Button disabled={trimmed === ""} size="sm" type="submit">
            {overwrites ? "Update" : "Save"}
          </Button>
        </NameRow>
      </Form>

      <Status aria-live="polite">{status}</Status>

      {presets.length > 0 && (
        <List>
          {presets.map((preset) => (
            <Item key={preset.name}>
              <ApplyButton
                intent="secondary"
                onClick={() => {
                  onApply(preset);
                  setStatus(`Switched to “${preset.name}”.`);
                }}
                size="sm"
                variant="outline"
              >
                {preset.name}
              </ApplyButton>
              <Button
                aria-label={`Delete “${preset.name}”`}
                intent="secondary"
                onClick={() => {
                  onDelete(preset.name);
                  setStatus(`Deleted “${preset.name}”.`);
                }}
                size="icon"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" size={16} />
              </Button>
            </Item>
          ))}
        </List>
      )}
    </Group>
  );
}

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Heading = styled.h3`
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NameLabel = styled.label`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const NameRow = styled.div`
  display: flex;
  gap: 8px;
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 6px 10px;
  border-radius: 6px;
  font: inherit;
  font-size: 0.9rem;
  color: inherit;
  background: light-dark(white, var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 1px;
  }
`;

const Status = styled.p`
  margin: 0;
  min-height: 1lh;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.li`
  display: flex;
  gap: 4px;
`;

const ApplyButton = styled(Button)`
  flex: 1;
  min-width: 0;
  justify-content: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
`;
