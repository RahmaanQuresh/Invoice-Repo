import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Valid email is required").max(255),
  company: z.string().max(255).optional().default(""),
  phone: z.string().max(50).optional().default(""),
  notes: z.string().optional().default(""),
});

export type ClientSchemaType = z.infer<typeof clientSchema>;
