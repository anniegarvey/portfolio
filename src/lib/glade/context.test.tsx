import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLayoutEffect, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePoints } from "@/lib/points/context";
import { LESSON_COSTS, XP_THRESHOLDS } from "./catalog";
import { GladeProvider, useGlade } from "./context";
import type { GladeState } from "./schema";
import { createInitialState, loadGladeState } from "./storage";
import { makeVisitor } from "./testFixtures";

vi.mock("@/lib/points/context", () => ({
  usePoints: vi.fn(),
}));

// Real storage throughout, except where a test needs the mount load to
// return a snapshot older than what is on disk (see the reset-race test).
vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return { ...actual, loadGladeState: vi.fn(actual.loadGladeState) };
});

const GLADE_KEY = "glade-game-state";
const TODAY = new Date().toISOString().split("T")[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupMockPoints(spendResult = true) {
  const mockSpend = vi.fn().mockReturnValue(spendResult);
  vi.mocked(usePoints).mockReturnValue({
    points: 200,
    spendPoints: mockSpend,
    awardPoints: vi.fn(),
  });
  return mockSpend;
}

function seedLocalStorage(overrides?: object) {
  const base = createInitialState();
  // Mark today as already advanced so mount doesn't spawn extra visitors.
  // Body Language and Petting Technique default to tier 2 so Petting
  // Technique and Treat Cooking start unlocked — most tests exercise
  // pet/cook/offer as generic taming actions, not the unlock gating itself.
  const merged = {
    ...base,
    lastAdvanceDate: TODAY,
    skills: {
      "treat-cooking": { tier: 1, xp: 0 },
      "body-language": { tier: 2, xp: 0 },
      "petting-technique": { tier: 2, xp: 0 },
    },
    ...overrides,
  };
  localStorage.setItem(GLADE_KEY, JSON.stringify(merged));
  return merged as GladeState;
}

// ─── Test Component ───────────────────────────────────────────────────────────

function GladeDebug() {
  const ctx = useGlade();
  const visitor = ctx.state.visitors[0] ?? null;
  return (
    <div>
      <span data-testid="visitor-count">{ctx.state.visitors.length}</span>
      <span data-testid="resident-count">{ctx.state.residents.length}</span>
      <span data-testid="trust">{visitor?.trust ?? "none"}</span>
      <span data-testid="berries">
        {ctx.state.pantry.ingredients.berries ?? 0}
      </span>
      <span data-testid="honey">{ctx.state.pantry.ingredients.honey ?? 0}</span>
      <span data-testid="hazelnuts">
        {ctx.state.pantry.ingredients.hazelnuts ?? 0}
      </span>
      <span data-testid="berry-bites">
        {ctx.state.pantry.treats["berry-bites"] ?? 0}
      </span>
      <span data-testid="cooking-tier">
        {ctx.state.skills["treat-cooking"].tier}
      </span>
      <span data-testid="petting-xp">
        {ctx.state.skills["petting-technique"].xp}
      </span>
      <span data-testid="last-action">
        {ctx.lastAction === null
          ? "none"
          : `${ctx.lastAction.trustGained}:${ctx.lastAction.matched}`}
      </span>
      <span data-testid="celebration-name">
        {ctx.celebration?.creatureName ?? "none"}
      </span>
      <span data-testid="tamed-visitor-species">
        {ctx.tamedVisitor?.speciesId ?? "none"}
      </span>
      <span data-testid="tamed-resident-id">
        {ctx.tamedResidentId ?? "none"}
      </span>
      <span data-testid="resident-name">
        {ctx.state.residents[0]?.name ?? "none"}
      </span>
      <button onClick={() => ctx.cookTreat("berry-bites")} type="button">
        Cook
      </button>
      <button
        onClick={() => visitor && ctx.offerTreat(visitor.id, "berry-bites")}
        type="button"
      >
        Offer
      </button>
      <button
        onClick={() => {
          if (!visitor) return;
          const rect = new DOMRect(100, 200, 200, 300);
          ctx.offerTreat(visitor.id, "berry-bites", rect);
        }}
        type="button"
      >
        Offer With Rect
      </button>
      <button
        onClick={() => visitor && ctx.petVisitor(visitor.id, "back")}
        type="button"
      >
        Pet Back
      </button>
      <button
        onClick={() => {
          if (!visitor) return;
          const rect = new DOMRect(100, 200, 200, 300);
          ctx.petVisitor(visitor.id, "back", rect);
        }}
        type="button"
      >
        Pet Back With Rect
      </button>
      <button
        onClick={() => visitor && ctx.approachVisitor(visitor.id, "sit-still")}
        type="button"
      >
        Approach
      </button>
      <button onClick={() => ctx.clearCelebration()} type="button">
        Clear Celebration
      </button>
      <button onClick={() => ctx.clearTamedVisitor()} type="button">
        Clear Tamed Visitor
      </button>
      <button
        onClick={() =>
          ctx.tamedResidentId && ctx.nameResident(ctx.tamedResidentId, " Pip ")
        }
        type="button"
      >
        Name Pip
      </button>
      <button
        onClick={() =>
          ctx.tamedResidentId && ctx.nameResident(ctx.tamedResidentId, "   ")
        }
        type="button"
      >
        Name Blank
      </button>
      <button onClick={() => ctx.buyIngredient("berries")} type="button">
        Buy Berries
      </button>
      <button
        onClick={() => ctx.buyMissingIngredients("honey-drops")}
        type="button"
      >
        Buy Missing Honey Drops
      </button>
      <button
        onClick={() => ctx.buyMissingIngredients("nut-clusters")}
        type="button"
      >
        Buy Missing Nut Clusters
      </button>
      <button onClick={() => ctx.buyLesson("petting-technique")} type="button">
        Buy Lesson
      </button>
      <button onClick={() => ctx.resetGlade()} type="button">
        Reset Glade
      </button>
    </div>
  );
}

function renderGlade() {
  return render(
    <GladeProvider>
      <GladeDebug />
    </GladeProvider>,
  );
}

/**
 * Resets during the commit that mounts the provider. Layout effects run
 * before the provider's passive mount effect, so the reset lands while the
 * load is still in flight — the ordering a replayed pre-hydration click
 * produces in the browser.
 */
function ResetDuringMount() {
  const { resetGlade } = useGlade();
  const reset = useRef(false);
  useLayoutEffect(() => {
    if (reset.current) return;
    reset.current = true;
    resetGlade();
  }, [resetGlade]);
  return null;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setupMockPoints();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GladeProvider", () => {
  it("creates an initial state with one visitor on first load", async () => {
    renderGlade();
    expect(await screen.findByTestId("visitor-count")).toHaveTextContent("1");
  });

  it("runs the daily advance on mount (draws 1-3 visitors on a new day)", async () => {
    seedLocalStorage({ lastAdvanceDate: "2020-01-01", visitors: [] });
    renderGlade();
    expect(await screen.findByTestId("visitor-count")).toHaveTextContent(
      /^[123]$/,
    );
  });

  it("cooks a treat from pantry ingredients", async () => {
    seedLocalStorage();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("berries");

    await user.click(screen.getByRole("button", { name: "Cook" }));
    expect(screen.getByTestId("berry-bites")).toHaveTextContent("1");
    expect(screen.getByTestId("berries")).toHaveTextContent("2");
  });

  it("offering a cooked treat raises visitor trust and records lastAction", async () => {
    seedLocalStorage();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Cook" }));
    await user.click(screen.getByRole("button", { name: "Offer" }));
    // Robin's favourite is berry-bites: potency 5 × 2 = 10
    expect(screen.getByTestId("trust")).toHaveTextContent("10");
    expect(screen.getByTestId("last-action")).toHaveTextContent("10:true");
  });

  it("petting grants XP and persists state to localStorage", async () => {
    seedLocalStorage();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Pet Back" }));
    expect(screen.getByTestId("petting-xp")).toHaveTextContent("1");

    const stored = JSON.parse(localStorage.getItem(GLADE_KEY) ?? "{}");
    expect(stored.skills["petting-technique"].xp).toBe(1);
  });

  it("approaching a visitor records lastAction", async () => {
    seedLocalStorage();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Approach" }));
    expect(screen.getByTestId("last-action")).not.toHaveTextContent("none");
  });

  it("taming moves the visitor to residents", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Pet Back" }));
    expect(screen.getByTestId("visitor-count")).toHaveTextContent("0");
    expect(screen.getByTestId("resident-count")).toHaveTextContent("1");
  });

  it("buying an ingredient spends points", async () => {
    seedLocalStorage();
    const mockSpend = setupMockPoints();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("berries");

    await user.click(screen.getByRole("button", { name: "Buy Berries" }));
    expect(mockSpend).toHaveBeenCalledWith(3);
    expect(screen.getByTestId("berries")).toHaveTextContent("5");
  });

  it("does not add the ingredient when points are insufficient", async () => {
    seedLocalStorage();
    setupMockPoints(false);
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("berries");

    await user.click(screen.getByRole("button", { name: "Buy Berries" }));
    expect(screen.getByTestId("berries")).toHaveTextContent("4");
  });

  it("buying missing ingredients spends points for the shortfall and stocks the pantry", async () => {
    // Default pantry has no honey; honey-drops needs 1 (cost 5).
    seedLocalStorage();
    const mockSpend = setupMockPoints();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("honey");

    await user.click(
      screen.getByRole("button", { name: "Buy Missing Honey Drops" }),
    );
    expect(mockSpend).toHaveBeenCalledWith(5);
    expect(screen.getByTestId("honey")).toHaveTextContent("1");
  });

  it("buys a multi-ingredient shortfall in a single purchase", async () => {
    // Nut Clusters needs 2 hazelnuts (cost 5 each) and 1 honey (cost 5);
    // default pantry has neither, so the whole shortfall is missing.
    seedLocalStorage({
      skills: {
        "treat-cooking": { tier: 3, xp: 0 },
        "body-language": { tier: 1, xp: 0 },
        "petting-technique": { tier: 1, xp: 0 },
      },
    });
    const mockSpend = setupMockPoints();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("hazelnuts");

    await user.click(
      screen.getByRole("button", { name: "Buy Missing Nut Clusters" }),
    );
    expect(mockSpend).toHaveBeenCalledWith(15);
    expect(screen.getByTestId("hazelnuts")).toHaveTextContent("2");
    expect(screen.getByTestId("honey")).toHaveTextContent("1");
  });

  it("does not spend points when the recipe has no missing ingredients", async () => {
    seedLocalStorage({
      pantry: { ingredients: { berries: 4, oats: 4, honey: 1 }, treats: {} },
    });
    const mockSpend = setupMockPoints();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("honey");

    await user.click(
      screen.getByRole("button", { name: "Buy Missing Honey Drops" }),
    );
    expect(mockSpend).not.toHaveBeenCalled();
  });

  it("does not stock the pantry when points are insufficient for missing ingredients", async () => {
    seedLocalStorage();
    setupMockPoints(false);
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("honey");

    await user.click(
      screen.getByRole("button", { name: "Buy Missing Honey Drops" }),
    );
    expect(screen.getByTestId("honey")).toHaveTextContent("0");
  });

  it("buying a lesson spends points and advances the tier", async () => {
    seedLocalStorage({
      skills: {
        "treat-cooking": { tier: 1, xp: 0 },
        "body-language": { tier: 2, xp: 0 },
        "petting-technique": { tier: 1, xp: XP_THRESHOLDS[0] },
      },
    });
    const mockSpend = setupMockPoints();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Buy Lesson" }));
    expect(mockSpend).toHaveBeenCalledWith(LESSON_COSTS[0]);
    expect(screen.getByTestId("petting-xp")).toHaveTextContent("0");
  });

  it("does not spend points when the lesson isn't earned yet", async () => {
    seedLocalStorage();
    const mockSpend = setupMockPoints();
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Buy Lesson" }));
    expect(mockSpend).not.toHaveBeenCalled();
  });

  it("taming via treat offer sets tamedVisitor when a fromRect is provided", async () => {
    // Berry-bites are Robin's favourite: 5 × 2 = 10 trust → 59 + 10 = 69 ≥ 60 → tamed
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
      pantry: { ingredients: {}, treats: { "berry-bites": 1 } },
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(screen.getByRole("button", { name: "Offer With Rect" }));
    expect(screen.getByTestId("tamed-visitor-species")).toHaveTextContent(
      "robin",
    );
  });

  it("sets celebration and tamedVisitor when taming succeeds with a fromRect", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(
      screen.getByRole("button", { name: "Pet Back With Rect" }),
    );
    expect(screen.getByTestId("visitor-count")).toHaveTextContent("0");
    expect(screen.getByTestId("celebration-name")).toHaveTextContent("Robin");
    expect(screen.getByTestId("tamed-visitor-species")).toHaveTextContent(
      "robin",
    );
  });

  it("clearCelebration resets celebration to null", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(
      screen.getByRole("button", { name: "Pet Back With Rect" }),
    );
    expect(screen.getByTestId("celebration-name")).toHaveTextContent("Robin");

    await user.click(screen.getByRole("button", { name: "Clear Celebration" }));
    expect(screen.getByTestId("celebration-name")).toHaveTextContent("none");
  });

  it("clearTamedVisitor resets tamedVisitor to null", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(
      screen.getByRole("button", { name: "Pet Back With Rect" }),
    );
    expect(screen.getByTestId("tamed-visitor-species")).toHaveTextContent(
      "robin",
    );

    await user.click(
      screen.getByRole("button", { name: "Clear Tamed Visitor" }),
    );
    expect(screen.getByTestId("tamed-visitor-species")).toHaveTextContent(
      "none",
    );
  });

  it("naming the tamed resident trims and persists the name", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(
      screen.getByRole("button", { name: "Pet Back With Rect" }),
    );
    expect(screen.getByTestId("tamed-resident-id")).not.toHaveTextContent(
      "none",
    );

    await user.click(screen.getByRole("button", { name: "Name Pip" }));
    expect(screen.getByTestId("resident-name")).toHaveTextContent("Pip");

    const stored = JSON.parse(localStorage.getItem(GLADE_KEY) ?? "{}");
    expect(stored.residents[0].name).toBe("Pip");
  });

  it("ignores a blank resident name", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(
      screen.getByRole("button", { name: "Pet Back With Rect" }),
    );
    await user.click(screen.getByRole("button", { name: "Name Blank" }));
    expect(screen.getByTestId("resident-name")).toHaveTextContent("none");
  });

  it("clearTamedVisitor also clears tamedResidentId", async () => {
    seedLocalStorage({
      visitors: [makeVisitor({ speciesId: "robin", trust: 59 })],
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");

    await user.click(
      screen.getByRole("button", { name: "Pet Back With Rect" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Clear Tamed Visitor" }),
    );
    expect(screen.getByTestId("tamed-resident-id")).toHaveTextContent("none");
  });

  it("resetGlade wipes progress back to a fresh state and persists it", async () => {
    seedLocalStorage({
      residents: [
        {
          id: "00000000-0000-4000-8000-000000000050",
          speciesId: "rabbit",
          tamedDate: TODAY,
          position: { x: 30, y: 70 },
        },
      ],
      skills: {
        "treat-cooking": { tier: 3, xp: 0 },
        "body-language": { tier: 3, xp: 0 },
        "petting-technique": { tier: 3, xp: 2 },
      },
    });
    const user = userEvent.setup();
    renderGlade();
    await screen.findByTestId("trust");
    expect(screen.getByTestId("resident-count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Reset Glade" }));

    expect(screen.getByTestId("visitor-count")).toHaveTextContent("1");
    expect(screen.getByTestId("resident-count")).toHaveTextContent("0");
    expect(screen.getByTestId("petting-xp")).toHaveTextContent("0");

    const stored = JSON.parse(localStorage.getItem(GLADE_KEY) ?? "{}");
    expect(stored.residents).toEqual([]);
    expect(stored.skills["body-language"]).toEqual({ tier: 1, xp: 0 });
  });

  it("does not let a stale mount load revert a reset that landed first", async () => {
    const seeded = seedLocalStorage({
      residents: [
        {
          id: "00000000-0000-4000-8000-000000000050",
          speciesId: "rabbit",
          tamedDate: TODAY,
          position: { x: 30, y: 70 },
        },
      ],
      skills: {
        "treat-cooking": { tier: 3, xp: 0 },
        "body-language": { tier: 3, xp: 0 },
        "petting-technique": { tier: 2, xp: 0 },
      },
    });

    // The mount load reads the save before its update is applied, so it can
    // hold a snapshot taken before the reset wrote — that is the whole race.
    vi.mocked(loadGladeState).mockReturnValueOnce(seeded);

    render(
      <GladeProvider>
        <ResetDuringMount />
        <GladeDebug />
      </GladeProvider>,
    );

    // Replaying that snapshot would bring the rabbit and tier-3 skills back.
    expect(await screen.findByTestId("resident-count")).toHaveTextContent("0");
    expect(screen.getByTestId("cooking-tier")).toHaveTextContent("1");

    const stored = JSON.parse(localStorage.getItem(GLADE_KEY) ?? "{}");
    expect(stored.residents).toEqual([]);
    expect(stored.skills["treat-cooking"]).toEqual({ tier: 1, xp: 0 });
  });

  it("useGlade throws outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<GladeDebug />)).toThrow(
      "useGlade must be used within a GladeProvider",
    );
    spy.mockRestore();
  });
});
