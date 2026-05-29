import { z } from "zod";

export const WellnessUnitSchema = z.enum(["days", "weeks", "months"]);
export type WellnessUnit = z.infer<typeof WellnessUnitSchema>;

export const WellnessMetricSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  lowLabel: z.string().optional(),
  highLabel: z.string().optional(),
});
export type WellnessMetric = z.infer<typeof WellnessMetricSchema>;

export const WellnessConfigSchema = z.object({
  enabled: z.boolean(),
  anchorDate: z.string(),
  frequency: z.number().int().min(1),
  unit: WellnessUnitSchema,
  metrics: z.array(WellnessMetricSchema),
});
export type WellnessConfig = z.infer<typeof WellnessConfigSchema>;

export const WellnessEntryMetricSchema = z.object({
  metricId: z.string().uuid(),
  label: z.string(),
  value: z.number().int().min(1).max(5).nullable(),
});
export type WellnessEntryMetric = z.infer<typeof WellnessEntryMetricSchema>;

export const WellnessEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  metrics: z.array(WellnessEntryMetricSchema),
});
export type WellnessEntry = z.infer<typeof WellnessEntrySchema>;

export const DEFAULT_WELLNESS_METRIC_ID =
  "a3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6d";

export const DEFAULT_WELLNESS_METRICS: WellnessMetric[] = [
  {
    id: DEFAULT_WELLNESS_METRIC_ID,
    label: "Overall mood",
    lowLabel: "Low",
    highLabel: "Great",
  },
];
