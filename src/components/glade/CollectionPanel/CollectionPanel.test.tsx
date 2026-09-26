import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type GladeContextType, useGlade } from "@/lib/glade/context";
import type { Resident } from "@/lib/glade/schema";
import { playCreatureSound } from "@/lib/glade/sounds";
import { makeGladeContext, makeGladeState } from "@/lib/glade/testFixtures";
import { CollectionPanel } from "./CollectionPanel";

vi.mock("@/lib/glade/context");
vi.mock("@/lib/glade/sounds", () => ({ playCreatureSound: vi.fn() }));
vi.mock("@/components/glade/CreatureSVG", () => ({
  CreatureSVG: () => null,
}));

const fox: Resident = {
  id: "00000000-0000-4000-8000-000000000102",
  speciesId: "fox",
  name: "Rusty",
  tamedDate: "2026-06-02",
  position: { x: 60, y: 50 },
};

function mockGlade(overrides: Partial<GladeContextType> = {}) {
  vi.mocked(useGlade).mockReturnValue(
    makeGladeContext({
      state: makeGladeState({ residents: [fox] }),
      ...overrides,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGlade();
});

describe("CollectionPanel", () => {
  it("shows tamed creatures by name and the rest as silhouettes", () => {
    render(<CollectionPanel />);

    expect(screen.getByRole("button", { name: /Rusty/ })).toBeInTheDocument();
    // Untamed entries aren't buttons: there is nothing to open yet.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getAllByText("???").length).toBeGreaterThan(0);
  });

  it("opens a tamed creature's details in a modal, and closes it", async () => {
    const user = userEvent.setup();
    render(<CollectionPanel />);

    await user.click(screen.getByRole("button", { name: /Rusty/ }));

    expect(playCreatureSound).toHaveBeenCalledWith("fox");
    const dialog = screen.getByRole("dialog", { name: "Rusty" });
    expect(dialog).toHaveTextContent("The Fox");
    expect(dialog).toHaveTextContent(/Attracts rarer visitors/);

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
