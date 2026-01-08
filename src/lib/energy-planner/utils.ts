import type { DayPlan, EnergyCost, Task } from "./schema";

export const calculateEnergyUsage = (
  tasks: Task[],
  dayPlan: DayPlan,
): EnergyCost => {
  const selectedTasks = tasks.filter((t) =>
    dayPlan.selectedTaskIds.includes(t.id),
  );
  return selectedTasks.reduce(
    (acc, task) => ({
      physical: acc.physical + task.energyCost.physical,
      social: acc.social + task.energyCost.social,
      executive: acc.executive + task.energyCost.executive,
    }),
    { physical: 0, social: 0, executive: 0 },
  );
};
