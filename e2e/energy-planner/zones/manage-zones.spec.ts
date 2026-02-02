import {
  expect,
  test,
  violationFingerprints,
} from "../../utils/accessibility-test";

test.describe("Zone Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/energy-planner");
  });

  test("should allow adding, renaming, and removing zones", async ({
    page,
    makeAxeBuilder,
  }) => {
    const manageButton = page
      .getByRole("button", { name: "Manage Zones" })
      .first();

    // 1. Open manager
    await manageButton.click();
    const modal = page.getByRole("dialog", { name: "Manage Zones" });
    await expect(modal).toBeVisible();

    // 2. Add a new zone
    // Start adding
    await modal.getByRole("button", { name: "Add Zone" }).click();

    const addModal = page.getByRole("dialog", { name: "Add New Zone" });
    await expect(addModal).toBeVisible();

    const firstAccessibilityScanResults = await makeAxeBuilder().analyze();
    expect(firstAccessibilityScanResults.violations).toEqual([]);

    // Fill input
    await addModal.getByPlaceholder("e.g., Morning Focus").fill("Late Night");
    await addModal
      .getByPlaceholder("What kind of tasks happen here?")
      .fill("Quiet focused work");

    // Click Create
    await addModal
      .getByRole("button", { name: "Create Zone", exact: true })
      .click();
    await expect(addModal).not.toBeVisible();

    // Verify added to list via Edit button presence
    await expect(
      modal.getByRole("button", { name: "Edit Late Night" }),
    ).toBeVisible();

    // Verify it is at the bottom of the list
    const editButtons = modal.locator('button[aria-label^="Edit "]');
    await expect(editButtons.last()).toHaveAttribute(
      "aria-label",
      "Edit Late Night",
    );

    // Verify description preview
    await expect(modal.getByText("Quiet focused work")).toBeVisible();

    // 3. Close and verify in main view
    await modal.getByRole("button", { name: "Close modal" }).click();

    // Verify "Late Night" zone exists
    await expect(page.getByText("Late Night", { exact: true })).toBeVisible();
    await expect(page.getByText("Quiet focused work")).toBeVisible();

    // 4. Rename zone
    await manageButton.click();
    await expect(modal).toBeVisible();

    const secondAccessibilityScanResults = await makeAxeBuilder().analyze();
    expect(
      violationFingerprints(secondAccessibilityScanResults),
    ).toMatchSnapshot();

    // Click edit
    await modal.getByRole("button", { name: "Edit Late Night" }).click();

    const editModal = page.getByRole("dialog", { name: "Edit Zone" });
    await expect(editModal).toBeVisible();

    // Update name
    await editModal.getByLabel("Name").fill("Deep Work");
    await editModal.getByRole("button", { name: "Save Changes" }).click();
    await expect(editModal).not.toBeVisible();

    // Verify rename in list
    await expect(
      modal.getByRole("button", { name: "Edit Deep Work" }),
    ).toBeVisible();

    // 5. Remove the zone
    // Click remove button
    await modal.getByRole("button", { name: "Remove Deep Work" }).click();

    // Expect confirmation modal
    const confirmModal = page.getByRole("dialog", { name: "Delete Zone?" });
    await expect(confirmModal).toBeVisible();

    const thirdAccessibilityScanResults = await makeAxeBuilder().analyze();
    expect(
      violationFingerprints(thirdAccessibilityScanResults),
    ).toMatchSnapshot();

    // Click Delete in confirmation modal
    await confirmModal.getByRole("button", { name: "Delete" }).click();
    await expect(confirmModal).not.toBeVisible();

    // Verify "Deep Work" is gone from modal
    await expect(modal.getByText("Deep Work")).not.toBeVisible();

    // Close and verify gone from main view
    await modal.getByRole("button", { name: "Close modal" }).click();
    await expect(page.getByText("Deep Work")).not.toBeVisible();
  });
});
