import type { Announcements } from "@dnd-kit/core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Activity, ResolvedActivity } from "@/lib/energy-planner/schema";
import { PlannedActivitiesDndSection } from "./PlannedActivitiesDndSection";

let announcements: Announcements;
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({
      accessibility,
    }: {
      accessibility: { announcements: Announcements };
    }) => {
      announcements = accessibility.announcements;
      return null;
    },
  };
});

const activity = (id: string, title: string): Activity => ({
  id,
  title,
  energyCost: {},
  factors: {
    initiationDifficulty: 0,
    terminationDifficulty: 0,
    isRestorative: false,
  },
  createdAt: new Date(),
});

const planned: ResolvedActivity = {
  instance: { id: "inst-1", sourceActivityId: "a1", completed: false },
  activity: activity("a1", "Answer emails"),
};

function renderSection() {
  render(
    <PlannedActivitiesDndSection
      activeIdea={null}
      activeResolved={null}
      activitiesByZone={
        new Map([
          ["morning", [planned]],
          ["evening", []],
        ])
      }
      dayContext="today"
      ideas={[activity("idea-1", "Repot the monstera")]}
      onAddActivity={vi.fn()}
      onDragEnd={vi.fn()}
      onDragStart={vi.fn()}
      onEditActivity={vi.fn()}
      onManageZones={vi.fn()}
      onMove={vi.fn()}
      onRemove={vi.fn()}
      onToggleCompletion={vi.fn()}
      sensors={[]}
      zones={[
        { id: "morning", name: "Morning", order: 0 },
        { id: "evening", name: "Evening", order: 1 },
      ]}
    />,
  );
}

// Only the ids matter to the announcements
const drag = (activeId: string, overId?: string) =>
  ({
    active: { id: activeId },
    over: overId ? { id: overId } : null,
  }) as Parameters<Announcements["onDragEnd"]>[0];

describe("drag announcements", () => {
  it("name the idea or activity and the zone, not internal ids", () => {
    renderSection();

    expect(announcements.onDragStart(drag("idea:idea-1"))).toBe(
      "Picked up Repot the monstera.",
    );
    expect(announcements.onDragOver(drag("idea:idea-1", "evening"))).toBe(
      "Repot the monstera is over Evening.",
    );
    expect(announcements.onDragOver(drag("idea:idea-1"))).toBe(
      "Repot the monstera is not over a zone.",
    );
    expect(announcements.onDragEnd(drag("inst-1", "inst-1"))).toBe(
      "Dropped Answer emails in Morning.",
    );
    expect(announcements.onDragEnd(drag("inst-1"))).toBe(
      "Dropped Answer emails.",
    );
    expect(announcements.onDragCancel(drag("inst-1"))).toBe(
      "Stopped dragging Answer emails.",
    );
  });
});
