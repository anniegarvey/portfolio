"use client";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGlade } from "@/lib/glade/context";
import type { WildVisitor } from "@/lib/glade/schema";
import { makeGladeState, makeVisitor } from "@/lib/glade/testFixtures";
import { usePoints } from "@/lib/points/context";
import { GladePage } from "./GladePage";

vi.mock("@/lib/glade/context");
vi.mock("@/lib/points/context");

// Mock sub-components that aren't relevant to visitor list ordering so they
// don't pull uncovered files into the per-file coverage thresholds.
vi.mock("@/components/glade/GladeScene", () => ({
  GladeScene: () => null,
}));
vi.mock("@/components/glade/TameCelebration", () => ({
  TameCelebration: () => null,
}));
vi.mock("@/components/glade/DailyDigest", () => ({
  DailyDigest: () => null,
}));
vi.mock("@/components/glade/CreatureSVG", () => ({
  CreatureSVG: () => null,
}));
vi.mock("@/components/glade/VisitorCard", () => ({
  VisitorCard: ({ visitor }: { visitor: WildVisitor }) => (
    <div data-testid={`visitor-card-${visitor.speciesId}`} />
  ),
}));
vi.mock("@/components/glade/KitchenPanel", () => ({
  KitchenPanel: () => null,
}));
vi.mock("@/components/glade/SkillsPanel", () => ({
  SkillsPanel: () => null,
}));
vi.mock("@/components/glade/CollectionPanel", () => ({
  CollectionPanel: () => null,
}));

const robin = makeVisitor({ id: "v-1", speciesId: "robin" });
const rabbit = makeVisitor({ id: "v-2", speciesId: "rabbit" });
const squirrel = makeVisitor({ id: "v-3", speciesId: "squirrel" });

function mockGlade(overrides = {}) {
  vi.mocked(useGlade).mockReturnValue({
    state: makeGladeState(),
    lastAction: null,
    celebration: null,
    clearCelebration: vi.fn(),
    dailyReport: null,
    clearDailyReport: vi.fn(),
    tamedVisitor: null,
    tamedVisitorIndex: null,
    clearTamedVisitor: vi.fn(),
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
  vi.mocked(usePoints).mockReturnValue({
    points: 0,
    spendPoints: vi.fn().mockReturnValue(false),
    awardPoints: vi.fn(),
  });
  mockGlade();
});

// Checks whether element `a` precedes element `b` in the DOM.
function isBefore(a: Element, b: Element): boolean {
  return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("GladePage visitor list ordering", () => {
  it("keeps the TamedCard at the original position of the tamed visitor", () => {
    // Rabbit was at index 1 in [robin, rabbit, squirrel]; after taming robin and squirrel remain.
    mockGlade({
      state: makeGladeState({ visitors: [robin, squirrel] }),
      tamedVisitor: rabbit,
      tamedVisitorIndex: 1,
    });

    render(<GladePage />);

    const robinCard = screen.getByTestId("visitor-card-robin");
    const badge = screen.getByText("Joined the glade!");
    const squirrelCard = screen.getByTestId("visitor-card-squirrel");

    expect(isBefore(robinCard, badge)).toBe(true);
    expect(isBefore(badge, squirrelCard)).toBe(true);
  });

  it("places TamedCard at the end when the last visitor was tamed", () => {
    // Squirrel was at index 1; after taming only robin remains.
    mockGlade({
      state: makeGladeState({ visitors: [robin] }),
      tamedVisitor: squirrel,
      tamedVisitorIndex: 1,
    });

    render(<GladePage />);

    const robinCard = screen.getByTestId("visitor-card-robin");
    const badge = screen.getByText("Joined the glade!");

    expect(isBefore(robinCard, badge)).toBe(true);
  });

  it("places TamedCard first when the first visitor was tamed", () => {
    // Robin was at index 0; after taming only squirrel remains.
    mockGlade({
      state: makeGladeState({ visitors: [squirrel] }),
      tamedVisitor: robin,
      tamedVisitorIndex: 0,
    });

    render(<GladePage />);

    const badge = screen.getByText("Joined the glade!");
    const squirrelCard = screen.getByTestId("visitor-card-squirrel");

    expect(isBefore(badge, squirrelCard)).toBe(true);
  });

  it("shows TamedCard alone when it was the only visitor", () => {
    mockGlade({
      state: makeGladeState({ visitors: [] }),
      tamedVisitor: robin,
      tamedVisitorIndex: 0,
    });

    render(<GladePage />);

    expect(screen.getByText("Joined the glade!")).toBeInTheDocument();
    expect(screen.queryByText(/No wild creatures/)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no visitors and no tamed visitor", () => {
    mockGlade({ state: makeGladeState({ visitors: [] }) });

    render(<GladePage />);

    expect(screen.getByText(/No wild creatures right now/)).toBeInTheDocument();
  });
});
