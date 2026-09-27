import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReminderTimeField } from "./ReminderTimeField";

const FIELD_ID = "reminder";

describe("ReminderTimeField", () => {
  let permission: NotificationPermission;
  const requestPermission = vi.fn(async () => {
    permission = "granted";
    return permission;
  });

  beforeEach(() => {
    permission = "default";
    requestPermission.mockClear();
    vi.stubGlobal("Notification", {
      get permission() {
        return permission;
      },
      requestPermission,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("asks for notification permission when a time is set", async () => {
    const onChange = vi.fn();
    render(
      <ReminderTimeField id={FIELD_ID} onChange={onChange} value={undefined} />,
    );

    fireEvent.change(screen.getByLabelText("Remind me at"), {
      target: { value: "09:30" },
    });

    expect(onChange).toHaveBeenCalledWith("09:30");
    await waitFor(() => expect(requestPermission).toHaveBeenCalledTimes(1));
  });

  it("clears the reminder without asking for permission", () => {
    const onChange = vi.fn();
    render(
      <ReminderTimeField id={FIELD_ID} onChange={onChange} value="09:30" />,
    );

    fireEvent.change(screen.getByLabelText("Remind me at"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("doesn't ask again once permission is granted", async () => {
    permission = "granted";
    render(
      <ReminderTimeField id={FIELD_ID} onChange={vi.fn()} value={undefined} />,
    );

    fireEvent.change(screen.getByLabelText("Remind me at"), {
      target: { value: "09:30" },
    });

    expect(requestPermission).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Remind me at")).toHaveAccessibleDescription(
      /while the planner is open/,
    );
  });

  it("explains when notifications are blocked", async () => {
    permission = "denied";
    render(
      <ReminderTimeField id={FIELD_ID} onChange={vi.fn()} value={undefined} />,
    );
    expect(await screen.findByText(/Notifications are blocked/)).toBeVisible();
  });

  it("explains when the browser can't notify", async () => {
    vi.stubGlobal("Notification", undefined);
    render(
      <ReminderTimeField id={FIELD_ID} onChange={vi.fn()} value={undefined} />,
    );
    expect(
      await screen.findByText(/This browser can't show notifications/),
    ).toBeVisible();
  });
});
