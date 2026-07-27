import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTodayDateString } from "@/lib/date";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
  makePlanting,
  makePlot,
  PLOT_ID_A,
} from "@/lib/meadowmere/testFixtures";
import { PlotTile } from "./PlotTile";

vi.mock("@/lib/meadowmere/context");

const TODAY = "2026-06-15";

const plantSeed = vi.fn();
const waterPlot = vi.fn();
const harvestPlot = vi.fn();

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ plantSeed, waterPlot, harvestPlot, ...overrides }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("empty plot", () => {
  it("prompts for a seed when none is chosen", () => {
    mock();
    render(<PlotTile index={0} plot={makePlot()} selectedCropId={null} />);

    expect(screen.getByText("Bare soil")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pick a seed" })).toBeDisabled();
  });

  it("offers to plant the chosen seed when one is in stock", async () => {
    mock({
      state: makeMeadowmereState({
        seeds: { parsnip: 2 },
        plots: [makePlot()],
      }),
    });
    render(<PlotTile index={0} plot={makePlot()} selectedCropId="parsnip" />);

    const button = screen.getByRole("button", { name: "Plant Parsnip" });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(plantSeed).toHaveBeenCalledWith(PLOT_ID_A, "parsnip");
  });

  it("disables planting when the seed packet is empty", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 0 } }) });
    render(<PlotTile index={0} plot={makePlot()} selectedCropId="parsnip" />);

    expect(
      screen.getByRole("button", { name: "Plant Parsnip" }),
    ).toBeDisabled();
  });

  it("numbers plots from one", () => {
    mock();
    render(<PlotTile index={4} plot={makePlot()} selectedCropId={null} />);
    expect(screen.getByText("Plot 5")).toBeInTheDocument();
  });
});

describe("growing plot", () => {
  it("shows the stage and a growth bar", () => {
    mock();
    // Pumpkin matures in 5 days; two days in is the Sprout stage.
    const plot = makePlot({
      planting: makePlanting({ cropId: "pumpkin", plantedDate: "2026-06-13" }),
    });
    render(<PlotTile index={0} plot={plot} selectedCropId={null} />);

    expect(screen.getByText("Sprout")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("waters an unwatered planting", async () => {
    mock();
    const plot = makePlot({
      planting: makePlanting({ cropId: "pumpkin", plantedDate: "2026-06-14" }),
    });
    render(<PlotTile index={0} plot={plot} selectedCropId={null} />);

    await userEvent.click(screen.getByRole("button", { name: /Water/ }));
    expect(waterPlot).toHaveBeenCalledWith(PLOT_ID_A);
  });

  it("disables watering once done for the day", () => {
    mock();
    const plot = makePlot({
      planting: makePlanting({
        cropId: "pumpkin",
        plantedDate: "2026-06-14",
        lastWateredDate: TODAY,
      }),
    });
    render(<PlotTile index={0} plot={plot} selectedCropId={null} />);

    expect(screen.getByRole("button", { name: /Watered/ })).toBeDisabled();
  });

  it("shows the yield a harvest would give", () => {
    mock();
    const plot = makePlot({
      planting: makePlanting({
        cropId: "pumpkin",
        plantedDate: "2026-06-14",
        wateredDays: 2,
      }),
    });
    render(<PlotTile index={0} plot={plot} selectedCropId={null} />);

    expect(screen.getByText(/Yields 4/)).toBeInTheDocument();
  });
});

describe("ripe plot", () => {
  it("offers a harvest and hides the growth bar", async () => {
    mock();
    const plot = makePlot({
      planting: makePlanting({ plantedDate: "2026-06-10" }),
    });
    render(<PlotTile index={0} plot={plot} selectedCropId={null} />);

    expect(screen.getByText("Ready to harvest")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Harvest" }));
    expect(harvestPlot).toHaveBeenCalledWith(PLOT_ID_A);
  });

  it("is still ripe after days away rather than withered", () => {
    mock();
    const plot = makePlot({
      planting: makePlanting({ plantedDate: "2026-05-01" }),
    });
    render(<PlotTile index={0} plot={plot} selectedCropId={null} />);

    expect(screen.getByText("Ready to harvest")).toBeInTheDocument();
  });
});

describe("today's date", () => {
  it("reads the current day when deciding ripeness", () => {
    expect(getTodayDateString()).toBe(TODAY);
  });
});
