import { v5 as uuidv5 } from "uuid";
import type { Activity, PlannedInstance } from "@/lib/energy-planner/schema";

export function checkIsActivityDue(activity: Activity, date: string): boolean {
  if (!activity.repeatConfig?.nextDueDate) return false;
  const start = new Date(activity.repeatConfig.nextDueDate);
  const target = new Date(date);

  // Ignore time components
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - start.getTime();
  if (diffTime < 0) return false;

  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const { frequency, unit } = activity.repeatConfig;

  if (unit === "days") {
    return diffDays % frequency === 0;
  }
  if (unit === "weeks") {
    return diffDays % (frequency * 7) === 0;
  }
  if (unit === "months") {
    if (target.getDate() !== start.getDate()) return false;
    const months =
      (target.getFullYear() - start.getFullYear()) * 12 +
      (target.getMonth() - start.getMonth());
    return months % frequency === 0;
  }
  if (unit === "years") {
    if (target.getDate() !== start.getDate()) return false;
    if (target.getMonth() !== start.getMonth()) return false;
    const years = target.getFullYear() - start.getFullYear();
    return years % frequency === 0;
  }
  return false;
}

// UUID v5 URL namespace — gives projected instances a stable, deterministic ID
// so activityOrder entries survive page reloads.
const PROJECTED_INSTANCE_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export function projectedInstanceId(
  sourceActivityId: string,
  date: string,
): string {
  return uuidv5(`${sourceActivityId}:${date}`, PROJECTED_INSTANCE_NAMESPACE);
}

/**
 * Merge instances into a persisted order.
 * Instances in storedOrder are placed first in their stored positions,
 * then any new instances (not in storedOrder) are appended.
 */
export function mergeInstancesWithOrder(
  instances: PlannedInstance[],
  storedOrder: string[] | undefined,
): PlannedInstance[] {
  if (!storedOrder || storedOrder.length === 0) {
    return instances;
  }

  const instanceMap = new Map(instances.map((i) => [i.id, i]));
  const ordered: PlannedInstance[] = [];

  for (const id of storedOrder) {
    const instance = instanceMap.get(id);
    if (instance) {
      ordered.push(instance);
      instanceMap.delete(id);
    }
  }

  // Append any instances not in the stored order (newly projected)
  for (const instance of instanceMap.values()) {
    ordered.push(instance);
  }

  return ordered;
}

export function calculateNextDueDate(
  currentDueDate: string | undefined,
  config: Activity["repeatConfig"],
): string | undefined {
  if (!(config && currentDueDate)) return;
  const date = new Date(currentDueDate);
  const { frequency, unit } = config;

  // Use UTC methods to stay on the correct calendar date regardless of local time
  if (unit === "days") date.setUTCDate(date.getUTCDate() + frequency);
  if (unit === "weeks") date.setUTCDate(date.getUTCDate() + frequency * 7);
  if (unit === "months") date.setUTCMonth(date.getUTCMonth() + frequency);
  if (unit === "years") date.setUTCFullYear(date.getUTCFullYear() + frequency);

  return date.toISOString().split("T")[0];
}
