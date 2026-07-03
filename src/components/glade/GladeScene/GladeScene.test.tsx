import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type GladeContextType, useGlade } from "@/lib/glade/context";
import type { Resident } from "@/lib/glade/schema";
import { makeGladeState } from "@/lib/glade/testFixtures";
import { GladeScene } from "./GladeScene";

vi.mock("@/lib/glade/context");
vi.mock("@/components/glade/CreatureSVG", () => ({
  CreatureSVG: () => null,
}));

const rabbit: Resident = {
  id: "00000000-0000-4000-8000-000000000101",
  speciesId: "rabbit",
  tamedDate: "2026-06-01",
  position: { x: 20, y: 40 },
};

const fox: Resident = {
  id: "00000000-0000-4000-8000-000000000102",
  speciesId: "fox",
  name: "Rusty",
  tamedDate: "2026-06-02",
  position: { x: 60, y: 50 },
};

function mockGlade(overrides: Partial<GladeContextType> = {}) {
  vi.mocked(useGlade).mockReturnValue({
    state: makeGladeState({ residents: [rabbit, fox] }),
    lastAction: null,
    celebration: null,
    clearCelebration: vi.fn(),
    dailyReport: null,
    clearDailyReport: vi.fn(),
    tamedVisitor: null,
    tamedVisitorIndex: null,
    tamedResidentId: null,
    clearTamedVisitor: vi.fn(),
    nameResident: vi.fn(),
    gladeSceneRef: { current: null },
    offerTreat: vi.fn(),
    approachVisitor: vi.fn(),
    petVisitor: vi.fn(),
    cookTreat: vi.fn(),
    buyIngredient: vi.fn().mockReturnValue(false),
    buyLesson: vi.fn().mockReturnValue(false),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGlade();
});

describe("GladeScene", () => {
  it("shows the empty message when there are no residents", () => {
    mockGlade({ state: makeGladeState() });
    render(<GladeScene />);
    expect(screen.getByText(/The glade is quiet/)).toBeInTheDocument();
  });

  it("renders a greet button per resident, using the given name when set", () => {
    render(<GladeScene />);

    const region = screen.getByRole("region", { name: "Glade ecosystem" });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rabbit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rusty" })).toBeInTheDocument();
  });

  it("greeting a resident opens its detail card and marks the button expanded", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    const rabbitButton = screen.getByRole("button", { name: "Rabbit" });
    expect(rabbitButton).toHaveAttribute("aria-expanded", "false");

    await user.click(rabbitButton);

    expect(rabbitButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Gathers an ingredient each day/),
    ).toBeInTheDocument();
  });

  it("greeting the open resident again closes the detail card", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    await user.click(screen.getByRole("button", { name: "Rabbit" }));
    await user.click(screen.getByRole("button", { name: "Rabbit" }));

    expect(
      screen.queryByText(/Gathers an ingredient each day/),
    ).not.toBeInTheDocument();
  });

  it("greeting another resident switches the detail card", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    await user.click(screen.getByRole("button", { name: "Rabbit" }));
    await user.click(screen.getByRole("button", { name: "Rusty" }));

    expect(screen.getByText(/Attracts rarer visitors/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Gathers an ingredient each day/),
    ).not.toBeInTheDocument();
  });

  it("the detail card's close button closes it", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    await user.click(screen.getByRole("button", { name: "Rabbit" }));
    await user.click(screen.getByRole("button", { name: "Close details" }));

    expect(
      screen.queryByText(/Gathers an ingredient each day/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rabbit" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("hides a resident that is still flying in from a tame celebration", () => {
    mockGlade({
      celebration: {
        speciesId: "rabbit",
        creatureName: "Rabbit",
        fromRect: new DOMRect(0, 0, 10, 10),
        toX: 0,
        toY: 0,
        newResidentId: rabbit.id,
      },
    });
    render(<GladeScene />);

    const rabbitButton = screen.getByRole("button", { name: "Rabbit" });
    // biome-ignore lint/style/noNonNullAssertion: buttons always have a parent
    expect(rabbitButton.parentElement!).toHaveAttribute(
      "data-entering",
      "true",
    );
  });
});
