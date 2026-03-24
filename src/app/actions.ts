"use server";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntrySchema } from "@/schemas";

export interface SubmitEntryState {
  error?: string;
  success?: boolean;
}

export async function submitEntry(
  _prevState: SubmitEntryState | null,
  formData: FormData
): Promise<SubmitEntryState> {
  const isMetric = formData.get("metric") === "true";

  let weight_lb: string | number;
  let weight_oz: string | number;
  let length_in: string | number;
  let length_fr: string | number;

  if (isMetric) {
    const kg = parseFloat(formData.get("weight_kg") as string);
    const cm = parseFloat(formData.get("length_cm") as string);
    if (isNaN(kg) || isNaN(cm)) {
      return { error: "Please enter valid weight and length values." };
    }
    const totalOz = kg * 35.274;
    weight_lb = Math.floor(totalOz / 16);
    weight_oz = Math.round(totalOz % 16);
    const totalIn = cm / 2.54;
    length_in = Math.floor(totalIn);
    length_fr = Math.round((totalIn - Math.floor(totalIn)) * 10) / 10;
  } else {
    weight_lb = formData.get("weight_lb") as string;
    weight_oz = formData.get("weight_oz") as string;
    length_in = formData.get("length_in") as string;
    length_fr = (formData.get("length_fr") as string) || "0";
  }

  const result = EntrySchema.safeParse({
    name: formData.get("name"),
    weight_lb,
    weight_oz,
    length_in,
    length_fr,
    dob: (formData.get("dob") as string) || null,
  });

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const first = Object.values(fieldErrors).flat()[0] as string | undefined;
    return { error: first ?? "Please check your entries." };
  }

  const { name, weight_lb: lb, weight_oz: oz, length_in: inches, length_fr: fr, dob } = result.data;
  const weight_g = Math.round(lb * 453.592 + oz * 28.3495);
  const length_cm = Math.round((inches + (fr ?? 0)) * 2.54 * 10) / 10;

  await addDoc(collection(db, "entries"), {
    name,
    weight_lb: lb,
    weight_oz: oz,
    weight_g,
    length_in: inches,
    length_fr: fr ?? 0,
    length_cm,
    dob,
    submittedAt: serverTimestamp(),
  });

  return { success: true };
}
