import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BabyConfigSchema, RevealSchema, ToggleRevealSchema } from "@/schemas";

async function checkAuth(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    }
  );
  if (!res.ok) return false;
  const data = await res.json();
  const user = data.users?.[0];
  return user?.email === process.env.ADMIN_EMAIL && user?.emailVerified === true;
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "config") {
    const result = BabyConfigSchema.safeParse(body.data);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    await updateDoc(doc(db, "config", "baby"), result.data);
    return NextResponse.json({ ok: true });
  }

  if (action === "reveal") {
    const result = RevealSchema.safeParse(body.data);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { actualWeight_lb, actualWeight_oz, actualLength_in, actualLength_fr, actualDob } =
      result.data;
    const actualWeight_g = Math.round(
      actualWeight_lb * 453.592 + actualWeight_oz * 28.3495
    );
    const actualLength_cm =
      Math.round((actualLength_in + actualLength_fr) * 2.54 * 10) / 10;

    await updateDoc(doc(db, "config", "baby"), {
      actualWeight_g,
      actualLength_cm,
      actualDob,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle-reveal") {
    const result = ToggleRevealSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    await updateDoc(doc(db, "config", "baby"), {
      isRevealed: result.data.isRevealed,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "init-config") {
    await setDoc(
      doc(db, "config", "baby"),
      {
        babyName: "Baby",
        headerText: "Baby Guessing Pool",
        emoji: "🍼",
        dueDate: null,
        qrCodeUrl: null,
        qrCodeLabel: null,
        qrCodeMessage: null,
        actualWeight_g: null,
        actualLength_cm: null,
        actualDob: null,
        isRevealed: false,
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
