import { expect, test } from "@playwright/test";
import {
  mockPlannedInstance,
  mockRepeatingActivity,
  mockStoredDayPlan,
  TODAY,
} from "../../utils/mocks";
import { goToEnergyPlannerWithSeed } from "../../utils/seed-storage";

// Swaps in a Notification stand-in that records what the page shows, so the
// test can see a reminder fire without depending on the OS notification centre.
async function recordNotifications(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const shown: { title: string; body?: string }[] = [];
    (window as unknown as { shown: typeof shown }).shown = shown;
    class RecordingNotification {
      static permission = "granted";
      static requestPermission = async () => "granted";
      constructor(title: string, options?: NotificationOptions) {
        shown.push({ title, body: options?.body });
      }
    }
    Object.defineProperty(window, "Notification", {
      value: RecordingNotification,
    });
  });
}

const shownTitles = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    (window as unknown as { shown: { title: string }[] }).shown.map(
      (n) => n.title,
    ),
  );

test.describe("Activity reminders", () => {
  test("notifies when a planned activity's reminder time arrives", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date(`${TODAY}T08:59:00`) });
    await recordNotifications(page);
    await goToEnergyPlannerWithSeed(page, {
      activities: [{ ...mockRepeatingActivity, reminderTime: "09:00" }],
    });

    expect(await shownTitles(page)).toEqual([]);

    await page.clock.runFor("01:30");
    await expect
      .poll(() => shownTitles(page))
      .toEqual([mockRepeatingActivity.title]);

    // Once only, even as the check keeps running
    await page.clock.runFor("02:00");
    expect(await shownTitles(page)).toEqual([mockRepeatingActivity.title]);
  });

  test("stays quiet once the activity is done", async ({ page }) => {
    await page.clock.install({ time: new Date(`${TODAY}T08:59:00`) });
    await recordNotifications(page);
    await goToEnergyPlannerWithSeed(page, {
      activities: [{ ...mockRepeatingActivity, reminderTime: "09:00" }],
      dayPlans: {
        [TODAY]: mockStoredDayPlan([
          mockPlannedInstance(mockRepeatingActivity.id),
        ]),
      },
    });

    await page
      .getByTestId("selected-activities")
      .filter({ hasText: mockRepeatingActivity.title })
      .first()
      .getByRole("button", { name: "Mark as done" })
      .click();

    await page.clock.runFor("01:30");
    expect(await shownTitles(page)).toEqual([]);
  });

  test("sets a reminder time from the activity form", async ({ page }) => {
    await recordNotifications(page);
    await goToEnergyPlannerWithSeed(page, {
      activities: [mockRepeatingActivity],
      dayPlans: { [TODAY]: mockStoredDayPlan([]) },
    });

    await page
      .getByTestId("selected-activities")
      .filter({ hasText: mockRepeatingActivity.title })
      .first()
      .getByText(mockRepeatingActivity.title)
      .click();

    const reminder = page.getByLabel("Remind me at");
    await reminder.fill("07:45");
    await expect(reminder).toHaveAccessibleDescription(
      /while the planner is open/,
    );
    await page.getByRole("button", { name: "Update Activity" }).click();

    await page
      .getByTestId("selected-activities")
      .filter({ hasText: mockRepeatingActivity.title })
      .first()
      .getByText(mockRepeatingActivity.title)
      .click();
    await expect(page.getByLabel("Remind me at")).toHaveValue("07:45");
  });
});
