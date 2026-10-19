import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as push from "@/lib/energy-planner/pushReminders";
import { ReminderTimeField } from "./ReminderTimeField";

const FIELD_ID = "reminder";

describe("ReminderTimeField", () => {
  let permission: NotificationPermission;
  const requestPermission = vi.fn(async (): Promise<NotificationPermission> => {
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
    vi.spyOn(push, "getPushSubscription").mockResolvedValue(null);
    vi.spyOn(push, "enablePush").mockResolvedValue(false);
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

  it("turns on push once permission is granted", async () => {
    vi.mocked(push.enablePush).mockResolvedValue(true);
    render(
      <ReminderTimeField id={FIELD_ID} onChange={vi.fn()} value={undefined} />,
    );

    fireEvent.change(screen.getByLabelText("Remind me at"), {
      target: { value: "09:30" },
    });

    await waitFor(() => expect(push.enablePush).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText("Remind me at")).toHaveAccessibleDescription(
        "Sends a notification on days it's planned and not yet done.",
      ),
    );
  });

  it("says reminders work with the planner closed on a subscribed device", async () => {
    vi.mocked(push.getPushSubscription).mockResolvedValue(
      {} as PushSubscription,
    );
    render(
      <ReminderTimeField id={FIELD_ID} onChange={vi.fn()} value="09:30" />,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Remind me at")).toHaveAccessibleDescription(
        "Sends a notification on days it's planned and not yet done.",
      ),
    );
  });

  it("doesn't try push when permission is refused", async () => {
    requestPermission.mockImplementationOnce(async () => {
      permission = "denied";
      return permission;
    });
    render(
      <ReminderTimeField id={FIELD_ID} onChange={vi.fn()} value={undefined} />,
    );

    fireEvent.change(screen.getByLabelText("Remind me at"), {
      target: { value: "09:30" },
    });

    expect(await screen.findByText(/Notifications are blocked/)).toBeVisible();
    expect(push.enablePush).not.toHaveBeenCalled();
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
