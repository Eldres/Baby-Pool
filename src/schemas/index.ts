import { z } from "zod";

export const EntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  weight_lb: z.coerce.number().int().min(1, "Min 1 lb").max(15, "Max 15 lb"),
  weight_oz: z.coerce.number().int().min(0, "Min 0 oz").max(15, "Max 15 oz"),
  length_in: z.coerce.number().int().min(14, "Min 14 inches").max(26, "Max 26 inches"),
  length_fr: z.coerce.number().min(0).max(0.9),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date required").nullable().optional(),
});

export const BabyConfigSchema = z.object({
  babyName: z.string().min(1, "Baby name is required"),
  headerText: z.string().min(1, "Header text is required"),
  emoji: z.string().min(1, "Emoji is required"),
  dueDate: z.string().nullable(),
  qrCodeUrl: z.string().url().nullable(),
  qrCodeLabel: z.string().nullable(),
  qrCodeMessage: z.string().nullable(),
  qrCodeLinkUrl: z.string().url().nullable(),
  showDobGuess: z.boolean().nullable(),
});

export const RevealSchema = z.object({
  actualWeight_lb: z.coerce.number().int().min(1).max(15),
  actualWeight_oz: z.coerce.number().int().min(0).max(15),
  actualLength_in: z.coerce.number().int().min(14).max(26),
  actualLength_fr: z.coerce.number().min(0).max(0.9),
  actualDob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date required"),
});

export const ToggleRevealSchema = z.object({
  isRevealed: z.boolean(),
});
