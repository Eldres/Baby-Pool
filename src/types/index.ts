import type { z } from "zod";
import type { Timestamp } from "firebase/firestore";
import type { EntrySchema, BabyConfigSchema } from "@/schemas";

export type EntryInput = z.infer<typeof EntrySchema>;
export type BabyConfigInput = z.infer<typeof BabyConfigSchema>;

export interface BabyConfig extends BabyConfigInput {
  actualWeight_g: number | null;
  actualLength_cm: number | null;
  actualWeight_lb: number | null;
  actualWeight_oz: number | null;
  actualLength_in: number | null;
  actualLength_fr: number | null;
  actualDob: string | null;
  isRevealed: boolean;
}

export interface Entry {
  id: string;
  name: string;
  weight_lb: number;
  weight_oz: number;
  weight_g: number;
  length_in: number;
  length_fr: number;
  length_cm: number;
  dob: string;
  submittedAt: Timestamp | null;
}

export interface ScoredEntry extends Entry {
  score: number;
  rank: number;
}
