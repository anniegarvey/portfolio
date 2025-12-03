import { styled } from "next-yak";
import type React from "react";

const COLOUR_SHADES = {
  primary: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  secondary: [100, 300, 500, 700, 900],
  grey: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
};

export default function ColourPalettePage() {
  return (
    <>
      <h1>Colour Palette</h1>

      {Object.entries(COLOUR_SHADES).map(([colour, shades]) => (
        <ColourSection
          key={colour}
          style={{
            color: `light-dark(var(--color-${colour}-700), var(--color-${colour}-100))`,
          }}
        >
          <h2>{colour}</h2>
          <SwatchWrapper>
            {shades.map((shade) => (
              <Swatch
                key={shade}
                style={
                  {
                    "--background-color": `var(--color-${colour}-${shade})`,
                    color:
                      shade > 300
                        ? "var(--color-grey-100)"
                        : "var(--color-grey-900)",
                  } as React.CSSProperties
                }
              >
                {shade}
              </Swatch>
            ))}
          </SwatchWrapper>
        </ColourSection>
      ))}
      <Alert colour="secondary">
        <b>Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <Alert>
        <b>Primary Testing</b> 1 ... 2 ... <em>3</em> ...
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
        "--button-colour": `var(--color-${colour ?? "primary"}-500)`,
        "--button-hover-colour": `var(--color-${colour ?? "primary"}-700)`,
      } as React.CSSProperties
    }
  >
    {children}
  </BaseAlert>
);

const ColourSection = styled.section`
  padding-block: 32px;
  text-transform: capitalize;
`;

const SwatchWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding-block: 16px;
`;

const Swatch = styled.div`
  width: 4.5rem;
  aspect-ratio: 1;
  background-color: var(--background-color);
  display: grid;
  place-items: center;
  font-weight: bold;
`;

const BaseAlert = styled.div`
  padding: 16px;
  background-color: var(--background-colour);
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

  &:hover {
    background-color: var(--button-hover-colour);
  }
`;
