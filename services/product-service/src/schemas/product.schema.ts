import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: optionalText(5000),
  price: z.number().finite().positive().max(9999999999.99),
  currency: z.string().trim().length(3).default("INR"),
  category: z.string().trim().min(2).max(80),
  material: optionalText(80),
  imageUrl: z.string().url().max(2048).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field must be provided" },
);

export const productIdSchema = z.string().uuid();
