import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type GladeContextType, useGlade } from "@/lib/glade/context";
import type { Resident } from "@/lib/glade/schema";
import { makeGladeContext, makeGladeState } from "@/lib/glade/testFixtures";
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
  vi.mocked(useGlade).mockReturnValue(
    makeGladeContext({
      state: makeGladeState({ residents: [rabbit, fox] }),
      ...overrides,
    }),
  );
}

/** jsdom has no matchMedia; the scene only asks it about reduced motion. */
function setReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/**
 * Hands the wander loop's frames to the test, and gives the glade a size (jsdom
 * lays nothing out, and the loop waits for a size before moving anyone).
 */
function driveFrames() {
  let pending: FrameRequestCallback[] = [];
  let now = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pending.push(callback);
    return pending.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(2000);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(320);
  return (count: number) =>
    act(() => {
      for (let i = 0; i < count; i++) {
        const due = pending;
        pending = [];
        for (const callback of due) callback(now);
        now += 100;
      }
    });
}

/** The layer the wander loop moves, for the resident behind this button. */
function spotOf(button: HTMLElement) {
  // biome-ignore lint/style/noNonNullAssertion: every resident has a spot
  return button.closest<HTMLElement>("[data-walking]")!;
}

function xOf(spot: HTMLElement) {
  return Number(/translate\(([\d.]+)%/.exec(spot.style.transform)?.[1]);
}

beforeEach(() => {
  vi.clearAllMocks();
  setReducedMotion(false);
  mockGlade();
});

afterEach(() => {
  vi.unstubAllGlobals();
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
    expect(
      screen.getByRole("button", { name: "Rabbit — Forager" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rusty — Beacon" }),
    ).toBeInTheDocument();
  });

  it("greeting a resident opens its detail card and marks the button expanded", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    const rabbitButton = screen.getByRole("button", {
      name: "Rabbit — Forager",
    });
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

    await user.click(screen.getByRole("button", { name: "Rabbit — Forager" }));
    await user.click(screen.getByRole("button", { name: "Rabbit — Forager" }));

    expect(
      screen.queryByText(/Gathers an ingredient each day/),
    ).not.toBeInTheDocument();
  });

  it("greeting another resident switches the detail card", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    await user.click(screen.getByRole("button", { name: "Rabbit — Forager" }));
    await user.click(screen.getByRole("button", { name: "Rusty — Beacon" }));

    expect(screen.getByText(/Attracts rarer visitors/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Gathers an ingredient each day/),
    ).not.toBeInTheDocument();
  });

  it("the detail card's close button closes it", async () => {
    const user = userEvent.setup();
    render(<GladeScene />);

    await user.click(screen.getByRole("button", { name: "Rabbit — Forager" }));
    await user.click(screen.getByRole("button", { name: "Close details" }));

    expect(
      screen.queryByText(/Gathers an ingredient each day/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rabbit — Forager" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("gives each resident its species' idle motion, phase-shifted by position", () => {
    render(<GladeScene />);

    const rabbitButton = screen.getByRole("button", {
      name: "Rabbit — Forager",
    });
    const rabbitIdle = rabbitButton.querySelector('[data-motion="hop"]');
    expect(rabbitIdle).not.toBeNull();
    // Rabbit hops for 3.8s at x=20 → phase offset of -0.76s.
    expect(rabbitIdle).toHaveStyle({ "--idle-delay": "-0.76s" });

    const foxButton = screen.getByRole("button", { name: "Rusty — Beacon" });
    expect(foxButton.querySelector('[data-motion="prowl"]')).not.toBeNull();
  });

  it("hides a resident that is still flying in from a tame celebration", () => {
    mockGlade({
      celebration: {
        speciesId: "rabbit",
        creatureName: "Rabbit",
        fromRect: new DOMRect(0, 0, 10, 10),
        toX: 0,
        toY: 0,
        scrollX: 0,
        scrollY: 0,
        newResidentId: rabbit.id,
      },
    });
    render(<GladeScene />);

    const rabbitButton = screen.getByRole("button", {
      name: "Rabbit — Forager",
    });
    // biome-ignore lint/style/noNonNullAssertion: buttons always have a parent
    expect(rabbitButton.parentElement!).toHaveAttribute(
      "data-entering",
      "true",
    );
  });

  it("settles the resident the flight just put down, in the same render that reveals it", () => {
    const celebration = {
      speciesId: "rabbit" as const,
      creatureName: "Rabbit",
      fromRect: new DOMRect(0, 0, 10, 10),
      toX: 0,
      toY: 0,
      scrollX: 0,
      scrollY: 0,
      newResidentId: rabbit.id,
    };
    mockGlade({ celebration });
    const { rerender } = render(<GladeScene />);

    const rabbitButton = () =>
      screen.getByRole("button", { name: "Rabbit — Forager" });
    expect(rabbitButton().querySelector('[data-landing="true"]')).toBeNull();

    // The flight ends: the celebration clears, and the resident it carried has
    // to be revealed and settling together — a reveal without the settle, even
    // for one paint, is the pop this animation exists to avoid.
    mockGlade({ celebration: null });
    rerender(<GladeScene />);

    // biome-ignore lint/style/noNonNullAssertion: buttons always have a parent
    expect(rabbitButton().parentElement!).not.toHaveAttribute("data-entering");
    expect(
      rabbitButton().querySelector('[data-landing="true"]'),
    ).not.toBeNull();
    // Only the arriving resident settles.
    const foxButton = screen.getByRole("button", { name: "Rusty — Beacon" });
    expect(foxButton.querySelector('[data-landing="true"]')).toBeNull();
  });

  it("keeps one resident's settle when another finishes its greet bounce", async () => {
    const user = userEvent.setup();
    const celebration = {
      speciesId: "rabbit" as const,
      creatureName: "Rabbit",
      fromRect: new DOMRect(0, 0, 10, 10),
      toX: 0,
      toY: 0,
      scrollX: 0,
      scrollY: 0,
      newResidentId: rabbit.id,
    };
    mockGlade({ celebration });
    const { rerender } = render(<GladeScene />);
    mockGlade({ celebration: null });
    rerender(<GladeScene />);

    // The rabbit is mid-settle. Greeting the fox starts its own bounce; when
    // that bounce ends it must not clear an animation it does not own.
    const foxButton = screen.getByRole("button", { name: "Rusty — Beacon" });
    await user.click(foxButton);
    const foxGreet = foxButton.querySelector('[data-greeting="true"]');
    expect(foxGreet).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    fireEvent.animationEnd(foxGreet!);

    const rabbitButton = screen.getByRole("button", {
      name: "Rabbit — Forager",
    });
    expect(rabbitButton.querySelector('[data-landing="true"]')).not.toBeNull();
    expect(foxButton.querySelector('[data-greeting="true"]')).toBeNull();
  });

  describe("wandering", () => {
    it("starts each resident at its home spot", () => {
      render(<GladeScene />);
      const rabbitSpot = spotOf(
        screen.getByRole("button", { name: "Rabbit — Forager" }),
      );
      expect(rabbitSpot.style.transform).toBe("translate(20%, 40%)");
      expect(rabbitSpot).toHaveAttribute("data-walking", "false");
    });

    it("walks residents off after a rest, in their walking gait", () => {
      // Every draw at 0: no rest to begin with, then the shortest rest, then
      // an outing heading straight right.
      vi.spyOn(Math, "random").mockReturnValue(0);
      const runFrames = driveFrames();
      render(<GladeScene />);
      const rabbitSpot = spotOf(
        screen.getByRole("button", { name: "Rabbit — Forager" }),
      );

      // The rabbit's shortest rest is 3s; frames here are 100ms apart.
      runFrames(40);

      expect(xOf(rabbitSpot)).toBeGreaterThan(20);
      expect(rabbitSpot).toHaveAttribute("data-walking", "true");
      expect(rabbitSpot.style.getPropertyValue("--facing")).toBe("1");
    });

    it("keeps a resident still while it is pointed at", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const runFrames = driveFrames();
      render(<GladeScene />);
      const foxButton = screen.getByRole("button", { name: "Rusty — Beacon" });

      fireEvent.pointerEnter(foxButton);
      runFrames(80);

      expect(xOf(spotOf(foxButton))).toBe(60);
      expect(spotOf(foxButton)).toHaveAttribute("data-walking", "false");

      // Once the pointer leaves it goes on its way.
      fireEvent.pointerLeave(foxButton);
      runFrames(80);
      expect(xOf(spotOf(foxButton))).toBeGreaterThan(60);
    });

    it("keeps a focused resident still", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const runFrames = driveFrames();
      render(<GladeScene />);
      const foxButton = screen.getByRole("button", { name: "Rusty — Beacon" });

      act(() => foxButton.focus());
      runFrames(80);
      expect(xOf(spotOf(foxButton))).toBe(60);

      act(() => foxButton.blur());
      runFrames(80);
      expect(xOf(spotOf(foxButton))).toBeGreaterThan(60);
    });

    it("keeps everyone at home under reduced motion", () => {
      setReducedMotion(true);
      vi.spyOn(Math, "random").mockReturnValue(0);
      const runFrames = driveFrames();
      render(<GladeScene />);

      runFrames(80);

      const rabbitSpot = spotOf(
        screen.getByRole("button", { name: "Rabbit — Forager" }),
      );
      expect(rabbitSpot.style.transform).toBe("translate(20%, 40%)");
      expect(rabbitSpot).toHaveAttribute("data-walking", "false");
    });
  });
});
