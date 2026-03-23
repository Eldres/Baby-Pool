import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntrySchema } from "@/schemas";

export async function GET() {
  const q = query(collection(db, "entries"), orderBy("submittedAt", "asc"));
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = EntrySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, weight_lb, weight_oz, length_in, length_fr, dob } = result.data;
  const weight_g = Math.round(weight_lb * 453.592 + weight_oz * 28.3495);
  const length_cm = Math.round((length_in + length_fr) * 2.54 * 10) / 10;

  const docRef = await addDoc(collection(db, "entries"), {
    name,
    weight_lb,
    weight_oz,
    weight_g,
    length_in,
    length_fr,
    length_cm,
    dob,
    submittedAt: serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
