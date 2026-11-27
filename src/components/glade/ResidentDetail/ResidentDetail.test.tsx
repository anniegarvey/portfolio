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
  it("shows the rarity, tamed date, and benefit", () => {
    render(<ResidentDetail resident={rabbit} />);

    expect(
      screen.getByText(/common · tamed June 15, 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText("Forager")).toBeInTheDocument();
    expect(
      screen.getByText(/Gathers an ingredient each day/),
    ).toBeInTheDocument();
  });

  it("shows a new friend's friendship at level 0, with how to grow it", () => {
    render(<ResidentDetail resident={rabbit} />);

    expect(screen.getByText(/Friendship level 0/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("max", "2");
    expect(
      screen.getByText(
        /0 of 2 daily greets to level 1\. Tap them in the glade/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/stronger/)).not.toBeInTheDocument();
  });

  it("shows the friendship level, how much stronger it makes the role, and today's greet", () => {
    vi.useFakeTimers({
      now: new Date("2026-06-20T12:00:00"),
      toFake: ["Date"],
    });
    render(
      <ResidentDetail
        resident={{ ...rabbit, friendship: 9, lastGreetedDate: "2026-06-20" }}
      />,
    );
    vi.useRealTimers();

    expect(screen.getByText(/Friendship level 2/)).toBeInTheDocument();
    expect(screen.getByText(/Forager 20% stronger/)).toBeInTheDocument();
    expect(
      screen.getByText(/3 of 8 daily greets to level 3\. Greeted today\./),
    ).toBeInTheDocument();
  });

  it("names the species when the resident has a name of its own", () => {
    render(<ResidentDetail resident={{ ...rabbit, name: "Clover" }} />);

    expect(screen.getByText("The Rabbit")).toBeInTheDocument();
  });

  it("renames the resident through the rename form", async () => {
    const user = userEvent.setup();
    render(<ResidentDetail resident={{ ...rabbit, name: "Clover" }} />);

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
    render(<ResidentDetail resident={rabbit} />);

    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
