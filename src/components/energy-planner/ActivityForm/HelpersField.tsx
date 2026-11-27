"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";

interface HelpersFieldProps {
  id: string;
  value: string[];
  options: string[];
  onChange: (helpers: string[]) => void;
}

export function HelpersField({
  id,
  value,
  options,
  onChange,
}: HelpersFieldProps) {
  const [newHelper, setNewHelper] = useState("");

  const toggle = (helper: string, checked: boolean) =>
    onChange(checked ? [...value, helper] : value.filter((h) => h !== helper));

  const addHelper = () => {
    const name = newHelper.trim();
    if (!name) return;
    // Reuse an existing option's spelling so "coffee" doesn't duplicate "Coffee"
    const helper =
      options.find((o) => o.toLowerCase() === name.toLowerCase()) ?? name;
    if (!value.includes(helper)) onChange([...value, helper]);
    setNewHelper("");
  };

  return (
    <>
      <Label id={`${id}-label`}>What would help you start?</Label>
      <Hint id={`${id}-hint`}>
        Something in the background, like music or an audiobook, can carry you
        into a task. Plan activities that share a helper back to back, so it
        keeps going from one to the next.
      </Hint>
      <DropdownMenuPrimitive.Root modal={false}>
        <DropdownMenuPrimitive.Trigger asChild>
          <Trigger
            aria-describedby={`${id}-hint`}
            aria-labelledby={`${id}-label ${id}`}
            id={id}
            type="button"
          >
            <TriggerText $placeholder={value.length === 0}>
              {value.length > 0 ? value.join(", ") : "Choose helpers…"}
            </TriggerText>
            <ChevronDown aria-hidden size={16} style={{ opacity: 0.5 }} />
          </Trigger>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <Content align="start" sideOffset={4}>
            {options.map((option) => (
              <Item
                checked={value.includes(option)}
                key={option}
                onCheckedChange={(checked) => toggle(option, checked === true)}
                // Keep the menu open so several helpers can be picked in a row
                onSelect={(e) => e.preventDefault()}
              >
                <Indicator>
                  <Check size={16} />
                </Indicator>
                {option}
              </Item>
            ))}
          </Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
      <AddRow>
        <TextInput
          aria-label="Add your own helper"
          autoComplete="off"
          onChange={(e) => setNewHelper(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addHelper();
            }
          }}
          placeholder="Add your own, e.g. Podcast"
          value={newHelper}
        />
        <Button
          disabled={!newHelper.trim()}
          intent="secondary"
          onClick={addHelper}
          size="sm"
          type="button"
          variant="outline"
        >
          Add
        </Button>
      </AddRow>
    </>
  );
}

const Label = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: left;
  background-color: light-dark(white, var(--color-grey-700));
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  cursor: pointer;

  &:hover {
    background-color: light-dark(var(--color-grey-50), var(--color-grey-600));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 1px;
  }
`;

const TriggerText = styled.span<{ $placeholder: boolean }>`
  color: ${({ $placeholder }) =>
    $placeholder ? "var(--color-grey-500)" : "inherit"};
`;

const Content = styled(DropdownMenuPrimitive.Content)`
  min-width: var(--radix-dropdown-menu-trigger-width);
  max-height: min(320px, var(--radix-dropdown-menu-content-available-height));
  overflow-y: auto;
  padding: 5px;
  background-color: light-dark(white, var(--color-grey-800));
  border-radius: 6px;
  box-shadow: var(--elevation-md);
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  z-index: 50;
`;

const Item = styled(DropdownMenuPrimitive.CheckboxItem)`
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 10px 0 32px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  user-select: none;
  outline: none;
  cursor: pointer;

  &[data-highlighted] {
    background-color: var(--color-primary-600);
    color: white;
  }
`;

const Indicator = styled(DropdownMenuPrimitive.ItemIndicator)`
  position: absolute;
  left: 8px;
  display: inline-flex;
  align-items: center;
`;

const AddRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const TextInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-grey-500);
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;
