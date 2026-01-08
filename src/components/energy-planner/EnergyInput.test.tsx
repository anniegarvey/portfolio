import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import { EnergyInput } from "./EnergyInput";

// Mock styled components if necessary, but usually jsdom handles them fine unless they use specific layout properties.
// next-yak styled components should just render divs/inputs.

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
);

describe("EnergyInput", () => {
  it("renders sliders for all energy types", () => {
    render(<EnergyInput />, { wrapper });

    expect(screen.getByLabelText(/physical/i)).toBeDefined();
    expect(screen.getByLabelText(/social/i)).toBeDefined();
    expect(screen.getByLabelText(/executive/i)).toBeDefined();
  });

  it("updates value when slider changes", () => {
    render(<EnergyInput />, { wrapper });

    const slider = screen.getByLabelText(/physical/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "80" } });

    expect(slider.value).toBe("80");
    expect(screen.getByText("80%")).toBeDefined();
  });
});
