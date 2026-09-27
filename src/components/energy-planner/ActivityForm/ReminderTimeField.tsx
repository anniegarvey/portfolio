"use client";

import { styled } from "next-yak";
import { useEffect, useState } from "react";
import { canNotify } from "@/lib/energy-planner/reminders";

interface ReminderTimeFieldProps {
  id: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function ReminderTimeField({
  id,
  value,
  onChange,
}: ReminderTimeFieldProps) {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    setPermission(canNotify() ? Notification.permission : "unsupported");
  }, []);

  const handleChange = async (time: string) => {
    onChange(time || undefined);
    // Ask while the user is interacting: browsers ignore unprompted requests.
    if (time && permission === "default") {
      setPermission(await Notification.requestPermission());
    }
  };

  const hintId = `${id}-hint`;

  return (
    <>
      <Label htmlFor={id}>Remind me at</Label>
      <TimeInput
        aria-describedby={hintId}
        id={id}
        onChange={(e) => handleChange(e.target.value)}
        type="time"
        value={value ?? ""}
      />
      <Hint id={hintId}>
        {permission === "unsupported"
          ? "This browser can't show notifications."
          : permission === "denied"
            ? "Notifications are blocked. Allow them for this site in your browser settings to get reminders."
            : "Sends a notification on days it's planned and not yet done, while the planner is open."}
      </Hint>
    </>
  );
}

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
`;

const TimeInput = styled.input`
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  height: 36px;
  border: 1px solid var(--color-grey-500);
  border-radius: 6px;
  background: transparent;
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;
