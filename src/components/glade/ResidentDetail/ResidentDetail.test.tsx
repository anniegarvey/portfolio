import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GladeContextType } from "@/lib/glade/context";
import { useGlade } from "@/lib/glade/context";
import type { Resident } from "@/lib/glade/schema";
import { makeGladeContext, makeGladeState } from "@/lib/glade/testFixtures";
import { ResidentDetail } from "./ResidentDetail";

vi.mock("@/lib/glade/context");
vi.mock("@/components/glade/CreatureSVG", () => ({
  CreatureSVG: () => null,
}));

const rabbit: Resident = {
  id: "00000000-0000-4000-8000-000000000101",
  speciesId: "rabbit",
  tamedDate: "2026-06-15",
  position: { x: 20, y: 40 },
};

const nameResident = vi.fn();
const onClose = vi.fn();

function mockGlade(overrides: Partial<GladeContextType> = {}) {
  vi.mocked(useGlade).mockReturnValue(
    makeGladeContext({
      state: makeGladeState({ residents: [rabbit] }),
      nameResident,
      ...overrides,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGlade();
});

describe("ResidentDetail", () => {
  it("shows the species name, rarity, tamed date, and benefit", () => {
    render(<ResidentDetail onClose={onClose} resident={rabbit} />);

    expect(screen.getByRole("heading", { name: "Rabbit" })).toBeInTheDocument();
    expect(
      screen.getByText(/common · tamed June 15, 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText("Forager")).toBeInTheDocument();
    expect(
      screen.getByText(/Gathers an ingredient each day/),
    ).toBeInTheDocument();
  });

  it("shows the personal name with the species as a note", () => {
    render(
      <ResidentDetail
        onClose={onClose}
        resident={{ ...rabbit, name: "Clover" }}
      />,
    );

    const heading = screen.getByRole("heading", { name: /Clover/ });
    expect(heading).toHaveTextContent("Clover the Rabbit");
  });

  it("renames the resident through the rename form", async () => {
    const user = userEvent.setup();
    render(
      <ResidentDetail
        onClose={onClose}
        resident={{ ...rabbit, name: "Clover" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rename" }));
    const input = screen.getByLabelText("New name");
    expect(input).toHaveValue("Clover");

    await user.clear(input);
    await user.type(input, "Biscuit");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(nameResident).toHaveBeenCalledWith(rabbit.id, "Biscuit");
    expect(screen.queryByLabelText("New name")).not.toBeInTheDocument();
    // Focus returns to the Rename button after the form unmounts.
    expect(screen.getByRole("button", { name: "Rename" })).toHaveFocus();
  });

  it("disables saving a blank name", async () => {
    const user = userEvent.setup();
    render(<ResidentDetail onClose={onClose} resident={rabbit} />);

    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("calls onClose from the close button", async () => {
    const user = userEvent.setup();
    render(<ResidentDetail onClose={onClose} resident={rabbit} />);

    await user.click(screen.getByRole("button", { name: "Close details" }));
    expect(onClose).toHaveBeenCalled();
  });
});
