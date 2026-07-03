import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type GladeContextType, useGlade } from "@/lib/glade/context";
import type { Resident } from "@/lib/glade/schema";
import {
  makeGladeContext,
  makeGladeState,
  makeVisitor,
} from "@/lib/glade/testFixtures";
import { TamedCard } from "./TamedCard";

vi.mock("@/lib/glade/context");
vi.mock("@/components/glade/CreatureSVG", () => ({
  CreatureSVG: () => null,
}));

const robinVisitor = makeVisitor({ speciesId: "robin" });

const robinResident: Resident = {
  id: "00000000-0000-4000-8000-000000000201",
  speciesId: "robin",
  tamedDate: "2026-07-01",
  position: { x: 30, y: 50 },
};

const nameResident = vi.fn();

function mockGlade(overrides: Partial<GladeContextType> = {}) {
  vi.mocked(useGlade).mockReturnValue(
    makeGladeContext({
      state: makeGladeState({ residents: [robinResident] }),
      tamedVisitor: robinVisitor,
      tamedVisitorIndex: 0,
      tamedResidentId: robinResident.id,
      nameResident,
      ...overrides,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGlade();
});

describe("TamedCard", () => {
  it("shows the species name, role, and a naming form for the new resident", () => {
    render(<TamedCard visitor={robinVisitor} />);

    expect(screen.getByText("Joined the glade!")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Robin" })).toBeInTheDocument();
    expect(screen.getByText("Now your Muse")).toBeInTheDocument();
    expect(screen.getByLabelText("Give them a name")).toBeInTheDocument();
  });

  it("submits the typed name for the tamed resident", async () => {
    const user = userEvent.setup();
    render(<TamedCard visitor={robinVisitor} />);

    await user.type(screen.getByLabelText("Give them a name"), "Pip");
    await user.click(screen.getByRole("button", { name: "Name" }));

    expect(nameResident).toHaveBeenCalledWith(robinResident.id, "Pip");
  });

  it("disables submission while the name is blank", () => {
    render(<TamedCard visitor={robinVisitor} />);

    expect(screen.getByRole("button", { name: "Name" })).toBeDisabled();
  });

  it("shows the given name instead of the form once named", () => {
    mockGlade({
      state: makeGladeState({
        residents: [{ ...robinResident, name: "Pip" }],
      }),
    });

    render(<TamedCard visitor={robinVisitor} />);

    expect(screen.getByRole("heading", { name: "Pip" })).toBeInTheDocument();
    expect(screen.getByText("Say hello to Pip the Robin!")).toBeInTheDocument();
    expect(screen.queryByLabelText("Give them a name")).not.toBeInTheDocument();
  });

  it("omits the naming form when the tamed resident is unknown", () => {
    mockGlade({ tamedResidentId: null });

    render(<TamedCard visitor={robinVisitor} />);

    expect(screen.queryByLabelText("Give them a name")).not.toBeInTheDocument();
  });
});
