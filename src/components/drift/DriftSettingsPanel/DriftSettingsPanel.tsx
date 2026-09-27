"use client";

import { styled } from "next-yak";
import { type ReactNode, useId } from "react";
import { Button } from "@/components/Button";
import {
  type DriftSettings,
  PALETTES,
  type PaletteId,
} from "@/lib/drift/settings";

type SliderKey = "speed" | "viscosity" | "trail" | "brushSize" | "swirl";

const SLIDERS: readonly {
  key: SliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  ends: [string, string];
}[] = [
  {
    key: "speed",
    label: "Flow speed",
    min: 0.25,
    max: 2,
    step: 0.05,
    ends: ["Slow", "Quick"],
  },
  {
    key: "viscosity",
    label: "Thickness",
    min: 0,
    max: 1,
    step: 0.05,
    ends: ["Water", "Syrup"],
  },
  {
    key: "trail",
    label: "Trail length",
    min: 0,
    max: 1,
    step: 0.05,
    ends: ["Short", "Long"],
  },
  {
    key: "brushSize",
    label: "Brush size",
    min: 0,
    max: 1,
    step: 0.05,
    ends: ["Fine", "Broad"],
  },
  {
    key: "swirl",
    label: "Swirl",
    min: 0,
    max: 1,
    step: 0.05,
    ends: ["Smooth", "Curly"],
  },
];

type Props = {
  settings: DriftSettings;
  calm: boolean;
  onChange: (change: Partial<DriftSettings>) => void;
  onReset: () => void;
  onClear: () => void;
  onBloom: () => void;
  /** Extra controls, shown above Reset settings (the saved settings). */
  children?: ReactNode;
};

export function DriftSettingsPanel({
  settings,
  calm,
  onChange,
  onReset,
  onClear,
  onBloom,
  children,
}: Props) {
  const id = useId();

  return (
    <Panel aria-labelledby={`${id}-heading`}>
      <PanelHeading id={`${id}-heading`}>Settings</PanelHeading>

      <Actions>
        <Button onClick={onBloom} size="sm">
          Add colour
        </Button>
        <Button
          intent="secondary"
          onClick={onClear}
          size="sm"
          variant="outline"
        >
          Clear water
        </Button>
      </Actions>

      <Group>
        <Legend>Palette</Legend>
        <Swatches>
          {PALETTES.map((palette) => (
            <SwatchLabel key={palette.id}>
              <SwatchInput
                checked={settings.palette === palette.id}
                name={`${id}-palette`}
                onChange={() => onChange({ palette: palette.id as PaletteId })}
                type="radio"
                value={palette.id}
              />
              <Swatch
                aria-hidden="true"
                style={{
                  background: `linear-gradient(135deg, ${palette.colors.join(", ")})`,
                }}
              />
              {palette.name}
            </SwatchLabel>
          ))}
        </Swatches>
      </Group>

      {SLIDERS.map((slider) => (
        <Field key={slider.key}>
          <FieldLabel htmlFor={`${id}-${slider.key}`}>
            {slider.label}
          </FieldLabel>
          <Range
            id={`${id}-${slider.key}`}
            max={slider.max}
            min={slider.min}
            onChange={(event) =>
              onChange({ [slider.key]: Number(event.target.value) })
            }
            step={slider.step}
            type="range"
            value={settings[slider.key]}
          />
          <Ends aria-hidden="true">
            <span>{slider.ends[0]}</span>
            <span>{slider.ends[1]}</span>
          </Ends>
        </Field>
      ))}

      <Toggle>
        <input
          checked={settings.drift && !calm}
          disabled={calm}
          onChange={(event) => onChange({ drift: event.target.checked })}
          type="checkbox"
        />
        Gentle currents
      </Toggle>
      {calm && (
        <Note>
          Your device asks for reduced motion, so the water moves very slowly
          and only when you stir it.
        </Note>
      )}

      {children}

      <Button intent="secondary" onClick={onReset} size="sm" variant="ghost">
        Reset settings
      </Button>
    </Panel>
  );
}

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border-radius: 16px;
  background: light-dark(white, var(--color-grey-900));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-800));
`;

const PanelHeading = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Group = styled.fieldset`
  border: none;
  margin: 0;
  padding: 0;
`;

const Legend = styled.legend`
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Swatches = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
`;

const SwatchInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const SwatchLabel = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));

  &:has(${SwatchInput}:checked) {
    border-color: light-dark(var(--color-primary-600), var(--color-primary-400));
    box-shadow: 0 0 0 1px
      light-dark(var(--color-primary-600), var(--color-primary-400));
  }

  &:has(${SwatchInput}:focus-visible) {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

const Swatch = styled.span`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
`;

const Range = styled.input`
  width: 100%;
  min-height: 32px;
  accent-color: light-dark(var(--color-primary-600), var(--color-primary-400));
`;

const Ends = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;

  & input {
    width: 20px;
    height: 20px;
    accent-color: light-dark(var(--color-primary-600), var(--color-primary-400));
  }

  &:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Note = styled.p`
  margin: -10px 0 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
