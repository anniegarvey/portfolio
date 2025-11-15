import { styled } from "next-yak";

const COLOUR_SHADES = {
  primary: [100, 300, 500, 700, 900],
  secondary: [100, 300, 500, 700, 900],
  grey: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
};

export default function Home() {
  return (
    <Wrapper>
      <Title>Annie Garvey Portfolio</Title>

      {Object.entries(COLOUR_SHADES).map(([colour, shades]) => (
        <ColourSection key={colour}>
          <h2>{colour}</h2>
          <SwatchWrapper>
            {shades.map((shade) => (
              <Swatch
                key={shade}
                style={
                  {
                    "--background-color": `var(--color-${colour}-${shade})`,
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
        <b>Testing</b> 1 ... 2 ... <em>3</em> ...
        <AlertButton>Click me</AlertButton>
      </Alert>
      <PrimaryAlert>
        <b>Primary Testing</b> 1 ... 2 ... <em>3</em> ...
        <PrimaryAlertButton>Click me</PrimaryAlertButton>
      </PrimaryAlert>
    </Wrapper>
  );
}

const Wrapper = styled.main`
  padding: 32px;
`;

const Title = styled.h1`
  color: var(--color-primary-500);
  font-size: 2.5rem;
`;

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
  width: 100px;
  height: 100px;
  background-color: var(--background-color);
  display: grid;
  place-items: center;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
`;

const Alert = styled.div`
  padding: 16px;
  background-color: var(--color-secondary-100);
  border: 1px solid var(--color-secondary-500);
  color: var(--color-secondary-900);
  width: fit-content;
  border-radius: 8px;
  display: flex;
  align-items: center;
  margin-block: 32px;
`;

const AlertButton = styled.button`
  background-color: var(--color-secondary-500);
  color: var(--color-grey-50);
  border: none;
  padding: 8px 16px;
  margin-left: 16px;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: var(--color-secondary-700);
  }
`;

const PrimaryAlert = styled(Alert)`
  background-color: var(--color-primary-100);
  border-color: var(--color-primary-500);
  color: var(--color-primary-900);
`;

const PrimaryAlertButton = styled(AlertButton)`
  background-color: var(--color-primary-500);
  color: var(--color-grey-50);

  &:hover {
    background-color: var(--color-primary-700);
  }
`;
