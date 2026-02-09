import { z } from "zod";

// Energy Type Configuration
export const EnergyTypeConfigSchema = z.object({
  id: z.string().min(1, "ID is required"),
  label: z.string().min(1, "Label is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  isPreset: z.boolean().default(false),
});

export type EnergyTypeConfig = z.infer<typeof EnergyTypeConfigSchema>;

// Default energy types for backward compatibility
export const DEFAULT_ENERGY_TYPES: EnergyTypeConfig[] = [
  { id: "physical", label: "Physical", color: "#14b8a6", isPreset: true },
  { id: "social", label: "Social", color: "#f43f5e", isPreset: true },
  { id: "executive", label: "Executive", color: "#f97316", isPreset: true },
];

// Preset suggestions for users
export const PRESET_ENERGY_TYPES = [
  { label: "Executive Functioning", color: "#f97316" },
  { label: "Social", color: "#f43f5e" },
  { label: "Physical", color: "#14b8a6" },
];

// Zone Configuration
export const ZoneConfigSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

export type ZoneConfig = z.infer<typeof ZoneConfigSchema>;

export const DEFAULT_ZONES: ZoneConfig[] = [
  { id: "morning", name: "Morning", order: 0 },
  { id: "afternoon", name: "Afternoon", order: 1 },
  { id: "evening", name: "Evening", order: 2 },
];

export const EnergyLevelSchema = z.number().min(0).max(100);

// EnergyCost is now a dynamic record based on configured energy types
export const EnergyCostSchema = z.record(z.string(), EnergyLevelSchema);

export type EnergyCost = z.infer<typeof EnergyCostSchema>;

export const TaskFactorSchema = z.object({
  initiationDifficulty: z
    .number()
    .min(0)
    .max(10)
    .describe("How hard it is to start (0-10)"),
  terminationDifficulty: z
    .number()
    .min(0)
    .max(10)
    .describe("How hard it is to stop (0-10)"),
  isRestorative: z
    .boolean()
    .default(false)
    .describe("Does this task restore energy?"),
});

export type TaskFactor = z.infer<typeof TaskFactorSchema>;

export const RepeatUnitSchema = z.enum(["days", "weeks", "months", "years"]);
export type RepeatUnit = z.infer<typeof RepeatUnitSchema>;

export const RepeatConfigSchema = z.object({
  frequency: z.number().int().min(1),
  unit: RepeatUnitSchema,
  nextDueDate: z.string().optional(),
  defaultZoneId: z.string().optional(), // Zone to auto-assign new projected instances
});
export type RepeatConfig = z.infer<typeof RepeatConfigSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  energyCost: EnergyCostSchema,
  factors: TaskFactorSchema,
  createdAt: z.date(),
  repeatConfig: RepeatConfigSchema.optional(),
  completed: z.boolean().default(false),
});
export type Task = z.infer<typeof TaskSchema>;

export const PlannedTaskSchema = TaskSchema.extend({
  completed: z.boolean().default(false),
  zoneId: z.string().optional(),
  repeatingTaskId: z.string().optional(), // Link back to the definition
  isProjected: z.boolean().optional(), // Transient flag for virtual instances
});
export type PlannedTask = z.infer<typeof PlannedTaskSchema>;

export const DayPlanSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  tasks: z.array(PlannedTaskSchema).default([]),
  dailyCapacity: EnergyCostSchema,
});

export type DayPlan = z.infer<typeof DayPlanSchema>;
