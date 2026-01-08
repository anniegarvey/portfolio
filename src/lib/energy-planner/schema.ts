import { z } from "zod";

export const EnergyTypeEnum = z.enum(["physical", "social", "executive"]);
export type EnergyType = z.infer<typeof EnergyTypeEnum>;

export const EnergyLevelSchema = z.number().min(0).max(100);

export const EnergyCostSchema = z.object({
  physical: EnergyLevelSchema.default(0),
  social: EnergyLevelSchema.default(0),
  executive: EnergyLevelSchema.default(0),
});

export type EnergyCost = z.infer<typeof EnergyCostSchema>;

export const TaskFactorSchema = z.object({
  initiationDifficulty: z
    .number()
    .min(1)
    .max(10)
    .describe("How hard it is to start (1-10)"),
  terminationDifficulty: z
    .number()
    .min(1)
    .max(10)
    .describe("How hard it is to stop (1-10)"),
  isRestorative: z
    .boolean()
    .default(false)
    .describe("Does this task restore energy?"),
});

export type TaskFactor = z.infer<typeof TaskFactorSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  energyCost: EnergyCostSchema,
  factors: TaskFactorSchema,
  createdAt: z.date(),
});

export type Task = z.infer<typeof TaskSchema>;

export const DayPlanSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  selectedTaskIds: z.array(z.string()),
  completedTaskIds: z.array(z.string()).default([]),
  dailyCapacity: EnergyCostSchema,
});

export type DayPlan = z.infer<typeof DayPlanSchema>;
