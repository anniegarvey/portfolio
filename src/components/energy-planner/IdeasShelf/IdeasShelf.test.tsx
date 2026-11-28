import { DndContext } from "@dnd-kit/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/lib/energy-planner/schema";
import { IdeasShelf } from "./IdeasShelf";

vi.mock("@/lib/energy-planner/context", () => ({
  useEnergyPlanner: vi.fn(),
}));
vi.mock("@/lib/points/context", () => ({
  usePoints: () => ({ awardPoints: vi.fn() }),
}));

import { useEnergyPlanner } from "@/lib/energy-planner/context";

const DAY = 24 * 60 * 60 * 1000;

const idea = (
  title: string,
  daysAgo: number,
  energyCost: Record<string, number>,
  helpers?: string[],
): Activity => ({
  id: title,
  title,
  createdAt: new Date(Date.now() - daysAgo * DAY),
  energyCost,
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  helpers,
});

const IDEAS = [
  idea("Sort the photo backup", 35, { executive: 25 }),
  idea("Ask Jo about the allotment", 4, { social: 10 }, ["Coffee"]),
  idea("Repot the monstera", 0, { physical: 15, executive: 5 }),
];

const onEdit = vi.fn();

function renderShelf(ideas = IDEAS) {
  return render(
    <DndContext>
      <IdeasShelf ideas={ideas} onEditActivity={onEdit} />
    </DndContext>,
  );
}

const titles = () =>
  within(screen.getByTestId("ideas-shelf"))
    .getAllByRole("button", { name: /^(?!Drag)/ })
    .filter((b) => IDEAS.some((i) => i.title === b.textContent))
    .map((b) => b.textContent);

// jsdom has no pointer-capture API, which Radix Select drives its trigger with
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

describe("IdeasShelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useEnergyPlanner).mockReturnValue({
      energyTypes: [
        { id: "physical", label: "Physical", color: "#14b8a6" },
        { id: "social", label: "Social", color: "#f43f5e" },
        { id: "executive", label: "Executive", color: "#f97316" },
      ],
      // biome-ignore lint/suspicious/noExplicitAny: test mock
    } as any);
  });

  it("explains itself when there are no ideas", () => {
    renderShelf([]);
    expect(
      screen.getByRole("heading", { name: "Waiting to be planned (0)" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/drag them into the day/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("lists ideas newest first, with how long each has waited", () => {
    renderShelf();
    expect(
      screen.getByRole("heading", { name: "Waiting to be planned (3)" }),
    ).toBeInTheDocument();
    expect(titles()).toEqual([
      "Repot the monstera",
      "Ask Jo about the allotment",
      "Sort the photo backup",
    ]);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("4 days")).toBeInTheDocument();
    expect(screen.getByText("5 weeks")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });

  it("gives each idea a drag handle", () => {
    renderShelf();
    expect(
      screen.getByRole("button", {
        name: "Drag into the day: Repot the monstera",
      }),
    ).toBeInTheDocument();
  });

  it("opens an idea for editing from its name", async () => {
    renderShelf();
    await userEvent.click(screen.getByText("Sort the photo backup"));
    expect(onEdit).toHaveBeenCalledWith(IDEAS[0]);
  });

  it("re-sorts and remembers the choice", async () => {
    renderShelf();
    await userEvent.click(screen.getByRole("combobox", { name: "Sort ideas" }));
    await userEvent.click(
      screen.getByRole("option", { name: "Most energy first" }),
    );

    expect(titles()).toEqual([
      "Sort the photo backup",
      "Repot the monstera",
      "Ask Jo about the allotment",
    ]);
    expect(localStorage.getItem("energy-planner-idea-sort")).toBe(
      "most-energy",
    );
  });

  it("offers each helper the ideas use as a sort", async () => {
    localStorage.setItem("energy-planner-idea-sort", "helper:Coffee");
    renderShelf();
    expect(titles()[0]).toBe("Ask Jo about the allotment");

    await userEvent.click(screen.getByRole("combobox", { name: "Sort ideas" }));
    expect(
      screen.getByRole("option", { name: "Coffee first" }),
    ).toBeInTheDocument();
  });

  it("falls back to newest first when a remembered helper is no longer used", () => {
    localStorage.setItem("energy-planner-idea-sort", "helper:Candle");
    renderShelf();
    expect(titles()[0]).toBe("Repot the monstera");
  });

  it("keeps a remembered helper sort when the spelling changes", () => {
    localStorage.setItem("energy-planner-idea-sort", "helper:COFFEE");
    renderShelf();
    expect(titles()[0]).toBe("Ask Jo about the allotment");
    expect(
      screen.getByRole("combobox", { name: "Sort ideas" }),
    ).toHaveTextContent("Coffee first");
  });
});
