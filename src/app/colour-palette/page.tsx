import { styled } from "next-yak";
import type React from "react";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const COLOUR_CONTRAST_SWITCH_POINTS = {
  primary: 500,
  secondary: 500,
  teal: 600,
  orange: 600,
  rose: 500,
  grey: 500,
} as const;

export default function ColourPalettePage() {
  return (
    <>
      <h1>Colour Palette</h1>

      {Object.keys(COLOUR_CONTRAST_SWITCH_POINTS).map((colour) => (
        <ColourSection
          key={colour}
          style={{
            color: `light-dark(var(--color-${colour}-700), var(--color-${colour}-300))`,
          }}
        >
          <h2>{colour}</h2>
          <SwatchWrapper>
            {SHADES.map((shade) => (
              <Swatch
                key={shade}
                style={
                  {
                    "--background-color": `var(--color-${colour}-${shade})`,
                    color:
                      shade >
                      COLOUR_CONTRAST_SWITCH_POINTS[
                        colour as keyof typeof COLOUR_CONTRAST_SWITCH_POINTS
                      ]
                        ? "white"
                        : "black",
                  } as React.CSSProperties
                }
              >
                {shade}
              </Swatch>
            ))}
          </SwatchWrapper>
        </ColourSection>
      ))}
      <Alert>
        <b>Primary Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <Alert colour="secondary">
        <b>Secondary Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <Alert colour="teal">
        <b>Teal Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <Alert colour="orange">
        <b>Orange Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <Alert colour="rose">
        <b>Rose Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <Alert colour="grey">
        <b>Grey Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
    </>
  );
}

const Alert: React.FC<{ colour?: string; children: React.ReactNode }> = ({
  colour,
  children,
}) => (
  <BaseAlert
    style={
      {
        "--background-colour": `var(--color-${colour ?? "primary"}-100)`,
        "--text-colour": `var(--color-${colour ?? "primary"}-900)`,
        "--button-colour": `var(--color-${colour ?? "primary"}-700)`,
        "--button-hover-colour": `var(--color-${colour ?? "primary"}-800)`,
      } as React.CSSProperties
    }
  >
    {children}
  </BaseAlert>
);

const ColourSection = styled.section`
  padding: 32px;
  margin-inline: -32px;
  text-transform: capitalize;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-600));
`;

const SwatchWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding-block: 16px;
`;

const Swatch = styled.div`
  width: 4rem;
  aspect-ratio: 1;
  background-color: var(--background-color);
  display: grid;
  place-items: center;
  font-weight: bold;
  font-size: 1.25rem;
`;

const BaseAlert = styled.div`
  padding: 16px;
  background-color: var(--background-colour);
  /* slightly reducing opacity helps reduce brightness in dark mode without entire restyle, retaining enough contrast */
  opacity: 0.9;
  border: 1px solid var(--button-colour);
  color: var(--text-colour);
  width: fit-content;
  border-radius: 8px;
  display: flex;
  align-items: center;
  margin-block: 32px;

  & b, & em {
    margin-inline: 0.5rem;
  }
`;

const AlertButton = styled.button`
  background-color: var(--button-colour);
  color: var(--color-grey-50);
  border: none;
  padding: 8px 16px;
  margin-left: 16px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;

  &:hover {
    background-color: var(--button-hover-colour);
  }
`;
