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

export const ActivityFactorSchema = z.object({
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
    .describe("Does this activity restore energy?"),
});

export type ActivityFactor = z.infer<typeof ActivityFactorSchema>;

export const RepeatUnitSchema = z.enum(["days", "weeks", "months", "years"]);
export type RepeatUnit = z.infer<typeof RepeatUnitSchema>;

export const RepeatConfigSchema = z.object({
  frequency: z.number().int().min(1),
  unit: RepeatUnitSchema,
  nextDueDate: z.string().optional(),
  defaultZoneId: z.string().optional(), // Zone to auto-assign new projected instances
});
export type RepeatConfig = z.infer<typeof RepeatConfigSchema>;

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  energyCost: EnergyCostSchema,
  factors: ActivityFactorSchema,
  createdAt: z.date(),
  repeatConfig: RepeatConfigSchema.optional(),
  defaultZoneId: z.string().optional(),
});
export type Activity = z.infer<typeof ActivitySchema>;

// A planned instance is a lightweight reference linking an activity to a day plan.
// Activity data (title, energy cost, etc.) is derived live from the activity store.
export const PlannedInstanceSchema = z.object({
  id: z.string().uuid(),
  sourceActivityId: z.string().uuid(),
  zoneId: z.string().optional(),
  completed: z.boolean().default(false),
  isProjected: z.boolean().optional(), // Transient flag for virtual instances
});
export type PlannedInstance = z.infer<typeof PlannedInstanceSchema>;

// Convenience type pairing an instance with its resolved activity definition,
// used by components that need both for display.
export type ResolvedActivity = {
  instance: PlannedInstance;
  activity: Activity;
};

export const DayPlanSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  plannedInstances: z.array(PlannedInstanceSchema).default([]),
  dailyCapacity: EnergyCostSchema,
  activityOrder: z.array(z.string()).optional(), // Persisted order of instance IDs
});

export type DayPlan = z.infer<typeof DayPlanSchema>;

// Legacy types used only during storage migration from the old format.
export const LegacyPlannedActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  energyCost: EnergyCostSchema,
  factors: ActivityFactorSchema,
  createdAt: z.date(),
  repeatConfig: RepeatConfigSchema.optional(),
  completed: z.boolean().default(false),
  defaultZoneId: z.string().optional(),
  zoneId: z.string().optional(),
  repeatingActivityId: z.string().optional(),
  isProjected: z.boolean().optional(),
});
export type LegacyPlannedActivity = z.infer<typeof LegacyPlannedActivitySchema>;
