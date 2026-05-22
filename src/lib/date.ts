export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDateForDisplay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

export function getPreviousDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

export function getNextDay(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}
