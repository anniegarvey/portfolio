import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePoints } from "@/lib/points/context";
import { CROPS, FORAGES_PER_DAY } from "./catalog";
import { MeadowmereProvider, useMeadowmere } from "./context";
import { createInitialState } from "./storage";

vi.mock("@/lib/points/context", () => ({
  usePoints: vi.fn(),
}));

const MEADOWMERE_KEY = "meadowmere-game-state";
const TODAY = new Date().toISOString().split("T")[0];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function setupMockPoints(spendResult = true) {
  const mockSpend = vi.fn().mockReturnValue(spendResult);
  vi.mocked(usePoints).mockReturnValue({
    points: 200,
    spendPoints: mockSpend,
    awardPoints: vi.fn(),
  });
  return mockSpend;
}

/** Seeds storage, marking today as advanced unless a test says otherwise. */
function seedLocalStorage(overrides?: object) {
  const merged = {
    ...createInitialState(),
    lastAdvanceDate: TODAY,
    ...overrides,
  };
  localStorage.setItem(MEADOWMERE_KEY, JSON.stringify(merged));
  return merged;
}

function readStored() {
  return JSON.parse(localStorage.getItem(MEADOWMERE_KEY) ?? "null");
}

// ─── Test Component ───────────────────────────────────────────────────────────

function MeadowmereDebug() {
  const ctx = useMeadowmere();
  const plot = ctx.state.plots[0];
  return (
    <div>
      <span data-testid="plot-count">{ctx.state.plots.length}</span>
      <span data-testid="plot-crop">{plot?.planting?.cropId ?? "empty"}</span>
      <span data-testid="watered">{plot?.planting?.wateredDays ?? "none"}</span>
      <span data-testid="parsnip-seeds">{ctx.state.seeds.parsnip ?? 0}</span>
      <span data-testid="parsnip-root">
        {ctx.state.inventory["parsnip-root"] ?? 0}
      </span>
      <span data-testid="forages">{ctx.state.foragesToday}</span>
      <span data-testid="nessa">
        {ctx.state.neighbours.nessa?.friendship ?? 0}
      </span>
      <span data-testid="completed">
        {ctx.state.completedQuestIds.join(",") || "none"}
      </span>
      <span data-testid="notice">{ctx.notice?.kind ?? "none"}</span>
      <span data-testid="report-days">
        {ctx.dailyReport?.daysPassed ?? "none"}
      </span>

      <button onClick={() => ctx.buySeed("parsnip")} type="button">
        buy
      </button>
      <button
        onClick={() => plot && ctx.plantSeed(plot.id, "parsnip")}
        type="button"
      >
        plant
      </button>
      <button onClick={() => plot && ctx.waterPlot(plot.id)} type="button">
        water
      </button>
      <button onClick={() => plot && ctx.harvestPlot(plot.id)} type="button">
        harvest
      </button>
      <button onClick={() => ctx.forage("hedgerow")} type="button">
        forage
      </button>
      <button
        onClick={() => ctx.giveGift("nessa", "parsnip-root")}
        type="button"
      >
        gift
      </button>
      <button
        onClick={() => ctx.claimQuest("a-bed-for-parsnips")}
        type="button"
      >
        claim
      </button>
      <button onClick={ctx.clearNotice} type="button">
        clear-notice
      </button>
      <button onClick={ctx.clearDailyReport} type="button">
        clear-report
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <MeadowmereProvider>
      <MeadowmereDebug />
    </MeadowmereProvider>,
  );
}

const click = (name: string) =>
  userEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setupMockPoints();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("mount", () => {
  it("starts a fresh farm when nothing is stored", () => {
    renderProvider();

    expect(screen.getByTestId("plot-count")).toHaveTextContent("6");
    expect(screen.getByTestId("parsnip-seeds")).toHaveTextContent("6");
  });

  it("loads a stored farm", () => {
    seedLocalStorage({ seeds: { parsnip: 2 } });
    renderProvider();

    expect(screen.getByTestId("parsnip-seeds")).toHaveTextContent("2");
  });

  it("runs the daily advance and reports days away", () => {
    seedLocalStorage({ lastAdvanceDate: daysAgo(3), foragesToday: 2 });
    renderProvider();

    expect(screen.getByTestId("report-days")).toHaveTextContent("3");
    expect(screen.getByTestId("forages")).toHaveTextContent("0");
  });

  it("does not advance twice on the same day", () => {
    seedLocalStorage({ foragesToday: 1 });
    renderProvider();

    expect(screen.getByTestId("report-days")).toHaveTextContent("none");
    expect(screen.getByTestId("forages")).toHaveTextContent("1");
  });

  it("dismisses the daily report", async () => {
    seedLocalStorage({ lastAdvanceDate: daysAgo(2) });
    renderProvider();

    await click("clear-report");
    expect(screen.getByTestId("report-days")).toHaveTextContent("none");
  });
});

describe("seeds and plots", () => {
  it("buys a seed with points", async () => {
    seedLocalStorage({ seeds: { parsnip: 1 } });
    const spend = setupMockPoints();
    renderProvider();

    await click("buy");
    expect(spend).toHaveBeenCalledWith(CROPS.parsnip.seedCost);
    expect(screen.getByTestId("parsnip-seeds")).toHaveTextContent("2");
  });

  it("does not add a seed when points fall short", async () => {
    seedLocalStorage({ seeds: { parsnip: 1 } });
    setupMockPoints(false);
    renderProvider();

    await click("buy");
    expect(screen.getByTestId("parsnip-seeds")).toHaveTextContent("1");
  });

  it("plants, waters and harvests, persisting each step", async () => {
    seedLocalStorage({ seeds: { parsnip: 1 } });
    renderProvider();

    await click("plant");
    expect(screen.getByTestId("plot-crop")).toHaveTextContent("parsnip");
    expect(readStored().plots[0].planting.cropId).toBe("parsnip");

    await click("water");
    expect(screen.getByTestId("watered")).toHaveTextContent("1");

    // Watering is capped to once a day.
    await click("water");
    expect(screen.getByTestId("watered")).toHaveTextContent("1");
  });

  it("harvests a ripe planting into the larder", async () => {
    const base = createInitialState();
    seedLocalStorage({
      plots: [
        {
          ...base.plots[0],
          planting: {
            cropId: "parsnip",
            plantedDate: daysAgo(5),
            wateredDays: 1,
          },
        },
        ...base.plots.slice(1),
      ],
    });
    renderProvider();

    await click("harvest");
    expect(screen.getByTestId("parsnip-root")).toHaveTextContent("2");
    expect(screen.getByTestId("plot-crop")).toHaveTextContent("empty");
    expect(screen.getByTestId("notice")).toHaveTextContent("harvest");
  });

  it("ignores a harvest on an unripe planting", async () => {
    const base = createInitialState();
    seedLocalStorage({
      plots: [
        {
          ...base.plots[0],
          planting: { cropId: "pumpkin", plantedDate: TODAY, wateredDays: 0 },
        },
        ...base.plots.slice(1),
      ],
    });
    renderProvider();

    await click("harvest");
    expect(screen.getByTestId("notice")).toHaveTextContent("none");
    expect(screen.getByTestId("plot-crop")).toHaveTextContent("pumpkin");
  });
});

describe("foraging", () => {
  it("spends a trip and records the find", async () => {
    seedLocalStorage();
    renderProvider();

    await click("forage");
    expect(screen.getByTestId("forages")).toHaveTextContent("1");
    expect(screen.getByTestId("notice")).toHaveTextContent("forage");
  });

  it("does nothing once the day's trips are spent", async () => {
    seedLocalStorage({ foragesToday: FORAGES_PER_DAY });
    renderProvider();

    await click("forage");
    expect(screen.getByTestId("forages")).toHaveTextContent(
      String(FORAGES_PER_DAY),
    );
    expect(screen.getByTestId("notice")).toHaveTextContent("none");
  });
});

describe("gifting", () => {
  it("gives an item and raises friendship", async () => {
    seedLocalStorage({ inventory: { "parsnip-root": 2 } });
    renderProvider();

    await click("gift");
    expect(screen.getByTestId("nessa")).toHaveTextContent("12");
    expect(screen.getByTestId("parsnip-root")).toHaveTextContent("1");
    expect(screen.getByTestId("notice")).toHaveTextContent("gift");
  });

  it("does nothing without the item", async () => {
    seedLocalStorage();
    renderProvider();

    await click("gift");
    expect(screen.getByTestId("nessa")).toHaveTextContent("0");
    expect(screen.getByTestId("notice")).toHaveTextContent("none");
  });
});

describe("quests", () => {
  it("claims a ready quest and applies its reward", async () => {
    seedLocalStorage({ inventory: { "parsnip-root": 3 } });
    renderProvider();

    await click("claim");
    expect(screen.getByTestId("completed")).toHaveTextContent(
      "a-bed-for-parsnips",
    );
    expect(screen.getByTestId("nessa")).toHaveTextContent("10");
    expect(screen.getByTestId("notice")).toHaveTextContent("quest");
    expect(readStored().unlockedCropIds).toContain("cornflower");
  });

  it("does nothing when the quest is not ready", async () => {
    seedLocalStorage({ inventory: { "parsnip-root": 1 } });
    renderProvider();

    await click("claim");
    expect(screen.getByTestId("completed")).toHaveTextContent("none");
    expect(screen.getByTestId("notice")).toHaveTextContent("none");
  });
});

describe("notices", () => {
  it("can be cleared", async () => {
    seedLocalStorage();
    renderProvider();

    await click("forage");
    expect(screen.getByTestId("notice")).toHaveTextContent("forage");

    await click("clear-notice");
    expect(screen.getByTestId("notice")).toHaveTextContent("none");
  });
});

describe("useMeadowmere", () => {
  it("throws outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<MeadowmereDebug />)).toThrow(
      "useMeadowmere must be used within a MeadowmereProvider",
    );
  });
});
