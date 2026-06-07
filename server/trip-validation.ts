import { z } from "zod";
import { insertTripSchema, updateTripSchema } from "@shared/schema";

const optionalBudget = z.preprocess(
  (v) =>
    v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v),
  z.number().int().min(0).optional(),
);

export const createTripBodySchema = insertTripSchema
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    budgetMin: optionalBudget,
    budgetMax: optionalBudget,
    inviteUserIds: z.array(z.string().uuid()).max(20).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Дата окончания должна быть не раньше даты начала",
    path: ["endDate"],
  });

export function parseCreateTripBody(body: unknown, userId: string) {
  const parsed = createTripBodySchema.parse({ ...(body as object), userId });
  const { inviteUserIds, ...tripData } = parsed;
  return { tripData, inviteUserIds: inviteUserIds ?? [] };
}

export function parseUpdateTripBody(body: unknown) {
  return updateTripSchema.parse(body);
}
