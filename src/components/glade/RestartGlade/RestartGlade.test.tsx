import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_SPECIES_IDS, RESTART_MIN_RESIDENTS } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import { makeGladeContext, makeGladeState } from "@/lib/glade/testFixtures";
import { RestartGlade } from "./RestartGlade";

vi.mock("@/lib/glade/context");

const withResidents = (n: number) =>
  makeGladeState({
    residents: ALL_SPECIES_IDS.slice(0, n).map((speciesId, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      speciesId,
      tamedDate: "2026-06-01",
      position: { x: 50, y: 50 },
    })),
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RestartGlade", () => {
  it("counts down the creatures still to tame", () => {
    vi.mocked(useGlade).mockReturnValue(
      makeGladeContext({ state: withResidents(RESTART_MIN_RESIDENTS - 1) }),
    );
    render(<RestartGlade />);
    expect(
      screen.getByText(/Tame 1 more creature to be able to restart/),
    ).toBeVisible();
  });

  it("says how many creatures are still needed in the plural", () => {
    vi.mocked(useGlade).mockReturnValue(
      makeGladeContext({ state: withResidents(0) }),
    );
    render(<RestartGlade />);
    expect(
      screen.getByText(
        new RegExp(`Tame ${RESTART_MIN_RESIDENTS} more creatures`),
      ),
    ).toBeVisible();
  });

  it("restarts the glade once the player confirms", async () => {
    const restartGlade = vi.fn();
    vi.mocked(useGlade).mockReturnValue(
      makeGladeContext({
        restartGlade,
        state: withResidents(RESTART_MIN_RESIDENTS),
      }),
    );
    render(<RestartGlade />);
    await userEvent.click(
      screen.getByRole("button", { name: "Restart the glade…" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Restart the glade" }),
    );
    expect(restartGlade).toHaveBeenCalled();
  });
});
