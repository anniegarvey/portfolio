"use client";

import { styled } from "next-yak";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useActivityForm } from "@/hooks/useActivityForm";
import { QUERIES } from "@/lib/constants";
import type { Activity, RepeatUnit } from "@/lib/energy-planner/schema";
import { ActivityFactorFields } from "../ActivityFactorFields";
import { EnergyCostFields } from "../EnergyCostFields";

interface ActivityFormProps {
  initialData?: Activity;
  initialContext?: {
    date: string;
    zoneId?: string;
  };
  onClose?: () => void;
  // Called after a new one-off activity is successfully created with context
  onCreated?: () => void;
  focusRef?: React.RefObject<HTMLInputElement | null>;
  // Called when the suggestions dropdown opens or closes (create mode only)
  onSuggestionsChange?: (open: boolean) => void;
}

export function ActivityForm({
  initialData,
  initialContext,
  onClose,
  onCreated,
  focusRef,
  onSuggestionsChange,
}: ActivityFormProps) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    energyCost,
    setEnergyCost,
    factors,
    setFactors,
    isRepeating,
    setIsRepeating,
    frequency,
    setFrequency,
    unit,
    setUnit,
    nextDueDate,
    setNextDueDate,
    handleSubmit,
    formId,
    isLoading,
    zones,
    defaultZoneId,
    setDefaultZoneId,
    suggestions,
    populateFromActivity,
  } = useActivityForm({ initialData, initialContext, onClose, onCreated });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Notify parent so it can intercept Escape before the dialog closes
  useEffect(() => {
    onSuggestionsChange?.(showSuggestions);
  }, [showSuggestions, onSuggestionsChange]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setActiveIndex(-1);
    setShowSuggestions(true);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      populateFromActivity(suggestions[activeIndex]);
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleSuggestionSelect = (activity: Activity) => {
    populateFromActivity(activity);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor={`${formId}-title`}>Activity Name</Label>
        <TitleWrapper>
          <TextInput
            autoComplete="off"
            id={`${formId}-title`}
            onBlur={() => {
              // Delay so mousedown on a suggestion fires first
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            onChange={handleTitleChange}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={!initialData ? handleTitleKeyDown : undefined}
            placeholder="e.g., Do Laundry"
            ref={focusRef}
            required
            value={title}
          />
          {!initialData && showSuggestions && suggestions.length > 0 && (
            <SuggestionsList role="listbox">
              {suggestions.map((activity, index) => (
                <SuggestionItem
                  $isActive={index === activeIndex}
                  aria-selected={index === activeIndex}
                  key={activity.id}
                  onMouseDown={() => handleSuggestionSelect(activity)}
                  role="option"
                >
                  {activity.title}
                </SuggestionItem>
              ))}
            </SuggestionsList>
          )}
        </TitleWrapper>
      </Field>

      <Field>
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <TextArea
          autoComplete="off"
          id={`${formId}-description`}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details…"
          value={description}
        />
      </Field>

      <EnergyCostFields energyCost={energyCost} onChange={setEnergyCost} />

      <ActivityFactorFields factors={factors} onChange={setFactors} />

      <Field>
        <Label htmlFor={`${formId}-defaultZoneId`}>Default Zone</Label>
        <Select
          onValueChange={(val) =>
            setDefaultZoneId(val === "none" ? undefined : val)
          }
          value={defaultZoneId || "none"}
        >
          <SelectTrigger id={`${formId}-defaultZoneId`}>
            <SelectValue placeholder="Select a default zone..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <CheckboxLabel>
          <input
            checked={isRepeating}
            onChange={(e) => setIsRepeating(e.target.checked)}
            type="checkbox"
          />
          Repeat this activity
        </CheckboxLabel>
      </Field>

      {isRepeating && (
        <RepeatConfigRow>
          <RepeatFrequency>
            <div>Every</div>
            <FrequencyInput
              aria-label="Frequency"
              data-testid="frequency-input"
              max={31}
              min={1}
              onChange={(e) => setFrequency(parseInt(e.target.value, 10) || 1)}
              type="number"
              value={frequency}
            />
            <Select
              onValueChange={(val: RepeatUnit) => setUnit(val)}
              value={unit}
            >
              <SelectTrigger aria-label="Repeat Unit">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
                <SelectItem value="years">Years</SelectItem>
              </SelectContent>
            </Select>
          </RepeatFrequency>
          <RepeatNextDate>
            <Label
              htmlFor={`${formId}-nextDueDate`}
              style={{ fontSize: "0.8rem" }}
            >
              Next:
            </Label>
            <FrequencyInput
              aria-label="Next Due Date"
              id={`${formId}-nextDueDate`}
              onChange={(e) => setNextDueDate(e.target.value)}
              style={{ width: "auto" }}
              type="date"
              value={nextDueDate}
            />
          </RepeatNextDate>
        </RepeatConfigRow>
      )}

      <Button disabled={isLoading} loading={isLoading} type="submit">
        {initialData ? "Update Activity" : "Add Activity"}
      </Button>
    </Form>
  );
}

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
`;

const RepeatConfigRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-left: 0;
    flex-wrap: wrap;

    @media (${QUERIES.PHONE_UP}) {
        padding-left: 1.5rem;
        gap: 0.75rem;
    }
`;

const RepeatFrequency = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const RepeatNextDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (${QUERIES.PHONE_UP}) {
    margin-left: auto;
  }
`;

const FrequencyInput = styled.input`
    padding: 0.25rem 0.5rem;
    width: 60px;
    height: 36px; /* Match Select height */
    border: 1px solid var(--color-grey-300);
    border-radius: 6px;
    background: transparent;
    color: inherit;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const Label = styled.label`
    text-transform: capitalize;
    font-size: 0.875rem;
    font-weight: 500;
`;

const TitleWrapper = styled.div`
  position: relative;
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  border: 1px solid var(--color-grey-300);
  border-radius: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
`;

const SuggestionItem = styled.li<{ $isActive: boolean }>`
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  background: ${({ $isActive }) =>
    $isActive ? "var(--color-grey-100)" : "transparent"};

  &:hover {
    background: var(--color-grey-100);
  }
`;

const TextInput = styled.input`
    padding: 0.5rem;
    border: 1px solid var(--color-grey-300);
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
    width: 100%;
    box-sizing: border-box;
`;

const TextArea = styled.textarea`
    padding: 0.5rem;
    border: 1px solid var(--color-grey-300);
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
    min-height: 80px;
    resize: vertical;
    font-family: inherit;
`;
