import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type GladeContextType, useGlade } from "@/lib/glade/context";
import type { DailyGladeReport } from "@/lib/glade/gladeEngine";
import type { Resident } from "@/lib/glade/schema";
import { makeGladeState } from "@/lib/glade/testFixtures";
import { DailyDigest } from "./DailyDigest";

vi.mock("@/lib/glade/context");

const rabbit: Resident = {
  id: "00000000-0000-4000-8000-000000000101",
  speciesId: "rabbit",
  tamedDate: "2026-06-01",
  position: { x: 20, y: 40 },
};

const fernmother: Resident = {
  id: "00000000-0000-4000-8000-000000000102",
  speciesId: "fernmother",
  tamedDate: "2026-06-02",
  position: { x: 60, y: 50 },
};

const emptyReport: DailyGladeReport = {
  soothedTrust: 0,
  soothedVisitors: 0,
  foraged: [],
  arrivalSpeciesId: null,
};

const clearDailyReport = vi.fn();

function mockGlade(overrides: Partial<GladeContextType> = {}) {
  vi.mocked(useGlade).mockReturnValue({
    state: makeGladeState({ residents: [rabbit, fernmother] }),
    lastAction: null,
    celebration: null,
    clearCelebration: vi.fn(),
    dailyReport: null,
    clearDailyReport,
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

describe("DailyDigest", () => {
  it("renders nothing when no daily advance ran this session", () => {
    const { container } = render(<DailyDigest />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the advance produced no visible events", () => {
    mockGlade({ dailyReport: emptyReport });
    const { container } = render(<DailyDigest />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists the arrival, gathered ingredients per resident, and soothed visitors", () => {
    mockGlade({
      dailyReport: {
        soothedTrust: 6,
        soothedVisitors: 2,
        foraged: [
          { residentId: rabbit.id, ingredientId: "oats" },
          { residentId: fernmother.id, ingredientId: "berries" },
          { residentId: fernmother.id, ingredientId: "berries" },
        ],
        arrivalSpeciesId: "fox",
      },
    });

    render(<DailyDigest />);

    expect(screen.getByText("Overnight in the glade")).toBeInTheDocument();
    expect(screen.getByText("A wild Fox wandered in!")).toBeInTheDocument();
    expect(screen.getByText("Rabbit gathered Oats")).toBeInTheDocument();
    expect(
      screen.getByText("Fernmother gathered Berries ×2"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your soothers calmed 2 wild visitors (+6 trust)"),
    ).toBeInTheDocument();
  });

  it("joins distinct gathered ingredients with 'and'", () => {
    mockGlade({
      dailyReport: {
        ...emptyReport,
        foraged: [
          { residentId: fernmother.id, ingredientId: "cream" },
          { residentId: fernmother.id, ingredientId: "honey" },
        ],
      },
    });

    render(<DailyDigest />);

    expect(
      screen.getByText("Fernmother gathered Cream and Honey"),
    ).toBeInTheDocument();
  });

  it("uses the singular form for one soothed visitor", () => {
    mockGlade({
      dailyReport: { ...emptyReport, soothedTrust: 3, soothedVisitors: 1 },
    });

    render(<DailyDigest />);

    expect(
      screen.getByText("Your soothers calmed 1 wild visitor (+3 trust)"),
    ).toBeInTheDocument();
  });

  it("dismisses via the Dismiss button", async () => {
    const user = userEvent.setup();
    mockGlade({
      dailyReport: { ...emptyReport, arrivalSpeciesId: "robin" },
    });

    render(<DailyDigest />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(clearDailyReport).toHaveBeenCalled();
  });
});
