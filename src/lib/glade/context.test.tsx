import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePoints } from "@/lib/points/context";
import { LESSON_COSTS, XP_THRESHOLDS } from "./catalog";
import { GladeProvider, useGlade } from "./context";
import { createInitialState } from "./storage";
import { makeVisitor } from "./testFixtures";

vi.mock("@/lib/points/context", () => ({
  usePoints: vi.fn(),
}));

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
  const merged = { ...base, lastAdvanceDate: TODAY, ...overrides };
  localStorage.setItem(GLADE_KEY, JSON.stringify(merged));
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
      <button onClick={() => ctx.buyIngredient("berries")} type="button">
        Buy Berries
      </button>
      <button onClick={() => ctx.buyLesson("petting-technique")} type="button">
        Buy Lesson
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

  it("runs the daily advance on mount (spawns a visitor on a new day)", async () => {
    seedLocalStorage({ lastAdvanceDate: "2020-01-01", visitors: [] });
    renderGlade();
    expect(await screen.findByTestId("visitor-count")).toHaveTextContent("1");
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

  it("buying a lesson spends points and advances the tier", async () => {
    seedLocalStorage({
      skills: {
        "treat-cooking": { tier: 1, xp: 0 },
        "body-language": { tier: 1, xp: 0 },
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

  it("sets celebration when taming succeeds and a fromRect is provided", async () => {
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

  it("useGlade throws outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<GladeDebug />)).toThrow(
      "useGlade must be used within a GladeProvider",
    );
    spy.mockRestore();
  });
});
