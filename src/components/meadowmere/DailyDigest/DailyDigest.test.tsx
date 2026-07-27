import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import type { DailyFarmReport } from "@/lib/meadowmere/meadowmereEngine";
import { makeMeadowmereContext } from "@/lib/meadowmere/testFixtures";
import { DailyDigest } from "./DailyDigest";

vi.mock("@/lib/meadowmere/context");

const clearDailyReport = vi.fn();

const emptyReport: DailyFarmReport = {
  daysPassed: 1,
  ripened: [],
  stillGrowing: 0,
  foragesRefilled: 0,
};

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ clearDailyReport, ...overrides }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ripened wording", () => {
  const ripenedText = (ripened: DailyFarmReport["ripened"]) => {
    mock({ dailyReport: { ...emptyReport, ripened } });
    const { unmount } = render(<DailyDigest />);
    const text = screen.getByText(/^Ready to harvest:/).textContent ?? "";
    unmount();
    return text;
  };

  it("pluralises a single crop", () => {
    expect(ripenedText([{ cropId: "parsnip", count: 1 }])).toBe(
      "Ready to harvest: 1 Parsnip.",
    );
    expect(ripenedText([{ cropId: "parsnip", count: 3 }])).toBe(
      "Ready to harvest: 3 Parsnips.",
    );
  });

  it("joins two crops with 'and'", () => {
    expect(
      ripenedText([
        { cropId: "parsnip", count: 2 },
        { cropId: "pumpkin", count: 1 },
      ]),
    ).toBe("Ready to harvest: 2 Parsnips and 1 Pumpkin.");
  });

  it("comma-separates three or more", () => {
    expect(
      ripenedText([
        { cropId: "parsnip", count: 1 },
        { cropId: "pumpkin", count: 1 },
        { cropId: "strawberry", count: 1 },
      ]),
    ).toBe("Ready to harvest: 1 Parsnip, 1 Pumpkin and 1 Strawberry.");
  });
});

describe("DailyDigest", () => {
  it("renders nothing without a report", () => {
    mock();
    const { container } = render(<DailyDigest />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the report has no news", () => {
    mock({ dailyReport: emptyReport });
    const { container } = render(<DailyDigest />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reports what ripened overnight", () => {
    mock({
      dailyReport: {
        ...emptyReport,
        ripened: [{ cropId: "parsnip", count: 2 }],
      },
    });
    render(<DailyDigest />);

    expect(
      screen.getByText("Ready to harvest: 2 Parsnips."),
    ).toBeInTheDocument();
  });

  it("mentions time away when several days passed", () => {
    mock({ dailyReport: { ...emptyReport, daysPassed: 4 } });
    render(<DailyDigest />);

    expect(
      screen.getByText("4 days have passed since your last visit."),
    ).toBeInTheDocument();
  });

  it("counts plantings still growing, agreeing in number", () => {
    mock({ dailyReport: { ...emptyReport, stillGrowing: 1 } });
    const { rerender } = render(<DailyDigest />);
    expect(screen.getByText(/1 planting is still/)).toBeInTheDocument();

    mock({ dailyReport: { ...emptyReport, stillGrowing: 3 } });
    rerender(<DailyDigest />);
    expect(screen.getByText(/3 plantings are still/)).toBeInTheDocument();
  });

  it("notes refilled forage trips", () => {
    mock({ dailyReport: { ...emptyReport, foragesRefilled: 2 } });
    render(<DailyDigest />);

    expect(
      screen.getByText("Your forage trips have refilled."),
    ).toBeInTheDocument();
  });

  it("can be dismissed", async () => {
    mock({ dailyReport: { ...emptyReport, foragesRefilled: 1 } });
    render(<DailyDigest />);

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(clearDailyReport).toHaveBeenCalled();
  });
});
