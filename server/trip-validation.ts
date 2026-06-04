import { z } from "zod";
import { insertTripSchema, updateTripSchema } from "@shared/schema";

const optionalBudget = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
  z.number().int().min(0).optional(),
);

export const createTripBodySchema = insertTripSchema
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    budgetMin: optionalBudget,
    budgetMax: optionalBudget,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Дата окончания должна быть не раньше даты начала",
    path: ["endDate"],
  });

export function parseCreateTripBody(body: unknown, userId: string) {
  return createTripBodySchema.parse({ ...(body as object), userId });
}

export function parseUpdateTripBody(body: unknown) {
  return updateTripSchema.parse(body);
}
