"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, collection, orderBy, query, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, googleProvider, storage } from "@/lib/firebase";
import { BabyConfigSchema, RevealSchema } from "@/schemas";
import type { BabyConfig, Entry } from "@/types";
import Image from "next/image";

const MAX_SCORE = 10_000;

function computeScore(entry: Entry, config: BabyConfig): number {
  const actualWeightG = config.actualWeight_g!;
  const actualLengthCm = config.actualLength_cm!;
  let dobPoints = 0;
  if (config.actualDob && entry.dob) {
    const actualDob = new Date(config.actualDob).getTime();
    const entryDob = new Date(entry.dob).getTime();
    const daysDiff = Math.abs((actualDob - entryDob) / (1000 * 60 * 60 * 24));
    dobPoints = daysDiff * 500;
  }
  const penalty =
    Math.abs(actualWeightG - entry.weight_g) * 4.4 +
    Math.abs(actualLengthCm - entry.length_cm) * 250 +
    dobPoints;
  return Math.max(0, MAX_SCORE - penalty);
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [config, setConfig] = useState<BabyConfig | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  const [configForm, setConfigForm] = useState({
    babyName: "",
    headerText: "",
    emoji: "",
    dueDate: "",
  });
  const [revealForm, setRevealForm] = useState({
    actualWeight_lb: "",
    actualWeight_oz: "",
    actualLength_in: "",
    actualLength_fr: "",
    actualDob: "",
  });

  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrLabel, setQrLabel] = useState("");
  const [qrMessage, setQrMessage] = useState("");
  const [qrLinkUrl, setQrLinkUrl] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const [qrMsg, setQrMsg] = useState("");

  const [configMsg, setConfigMsg] = useState("");
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [revealMsg, setRevealMsg] = useState("");
  const [revealErrors, setRevealErrors] = useState<Record<string, string>>({});
  const [toggleMsg, setToggleMsg] = useState("");

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthed(!!u && u.email === adminEmail);
      setAuthChecking(false);
    });
    return () => unsub();
  }, [adminEmail]);

  useEffect(() => {
    if (!authed) return;

    const unsubConfig = onSnapshot(doc(db, "config", "baby"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BabyConfig;
        setConfig(data);
        setConfigForm({
          babyName: data.babyName,
          headerText: data.headerText,
          emoji: data.emoji,
          dueDate: data.dueDate ?? "",
        });
        setQrLabel(data.qrCodeLabel ?? "");
        setQrMessage(data.qrCodeMessage ?? "");
        setQrLinkUrl(data.qrCodeLinkUrl ?? "");
        if (data.actualWeight_lb != null) {
          setRevealForm({
            actualWeight_lb: String(data.actualWeight_lb),
            actualWeight_oz: String(data.actualWeight_oz ?? 0),
            actualLength_in: String(data.actualLength_in ?? 0),
            actualLength_fr: String(data.actualLength_fr ?? 0),
            actualDob: data.actualDob ?? "",
          });
        }
      }
    });

    const q = query(collection(db, "entries"), orderBy("submittedAt", "asc"));
    const unsubEntries = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Entry)));
    });

    return () => {
      unsubConfig();
      unsubEntries();
    };
  }, [authed]);

  async function handleGoogleLogin() {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== adminEmail) {
        await signOut(auth);
        setAuthError("This Google account is not authorized.");
      }
    } catch {
      setAuthError("Sign-in failed. Please try again.");
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await signOut(auth);
    setAuthed(false);
    setUser(null);
    setConfig(null);
    setEntries([]);
  }

  async function handleUploadQr() {
    if (!qrFile) return;
    setQrUploading(true);
    setQrMsg("");
    try {
      const storageRef = ref(storage, "qr-codes/venmo");
      await uploadBytes(storageRef, qrFile);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "config", "baby"), {
        qrCodeUrl: url,
        qrCodeLabel: qrLabel || null,
        qrCodeMessage: qrMessage || null,
        qrCodeLinkUrl: qrLinkUrl || null,
      });
      setQrMsg("QR code uploaded!");
      setQrFile(null);
    } catch (err) {
      setQrMsg(err instanceof Error ? err.message : "Upload failed.");
    }
    setQrUploading(false);
    setTimeout(() => setQrMsg(""), 4000);
  }

  async function handleSaveQrText() {
    try {
      await updateDoc(doc(db, "config", "baby"), {
        qrCodeLabel: qrLabel || null,
        qrCodeMessage: qrMessage || null,
        qrCodeLinkUrl: qrLinkUrl || null,
      });
      setQrMsg("Saved!");
    } catch (err) {
      setQrMsg(err instanceof Error ? err.message : "Error saving.");
    }
    setTimeout(() => setQrMsg(""), 3000);
  }

  async function handleRemoveQr() {
    try {
      await updateDoc(doc(db, "config", "baby"), {
        qrCodeUrl: null,
        qrCodeLabel: null,
        qrCodeMessage: null,
        qrCodeLinkUrl: null,
      });
      setQrMsg("QR code removed.");
      setQrLabel("");
      setQrMessage("");
      setQrLinkUrl("");
    } catch (err) {
      setQrMsg(err instanceof Error ? err.message : "Error removing QR code.");
    }
    setTimeout(() => setQrMsg(""), 3000);
  }

  async function handleInitConfig() {
    try {
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
          qrCodeLinkUrl: null,
          showDobGuess: null,
          actualWeight_g: null,
          actualLength_cm: null,
          actualWeight_lb: null,
          actualWeight_oz: null,
          actualLength_in: null,
          actualLength_fr: null,
          actualDob: null,
          isRevealed: false,
        },
        { merge: true }
      );
      setConfigMsg("Config initialized!");
    } catch (err) {
      setConfigMsg(err instanceof Error ? err.message : "Error initializing config.");
    }
    setTimeout(() => setConfigMsg(""), 3000);
  }

  async function handleSaveConfig() {
    setConfigErrors({});
    const parsed = BabyConfigSchema.safeParse({
      babyName: configForm.babyName,
      headerText: configForm.headerText,
      emoji: configForm.emoji,
      dueDate: configForm.dueDate || null,
      qrCodeUrl: config?.qrCodeUrl ?? null,
      qrCodeLabel: qrLabel || null,
      qrCodeMessage: qrMessage || null,
      qrCodeLinkUrl: config?.qrCodeLinkUrl ?? null,
      showDobGuess: config?.showDobGuess ?? null,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setConfigErrors(Object.fromEntries(
        Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? "Invalid"])
      ));
      return;
    }
    try {
      await updateDoc(doc(db, "config", "baby"), parsed.data);
      setConfigMsg("Saved!");
    } catch (err) {
      setConfigMsg(err instanceof Error ? err.message : "Error saving config.");
    }
    setTimeout(() => setConfigMsg(""), 5000);
  }

  async function handleSaveResults() {
    setRevealErrors({});
    const parsed = RevealSchema.safeParse({
      actualWeight_lb: revealForm.actualWeight_lb,
      actualWeight_oz: revealForm.actualWeight_oz,
      actualLength_in: revealForm.actualLength_in,
      actualLength_fr: revealForm.actualLength_fr || "0",
      actualDob: revealForm.actualDob,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setRevealErrors(Object.fromEntries(
        Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? "Invalid"])
      ));
      return;
    }
    const { actualWeight_lb, actualWeight_oz, actualLength_in, actualLength_fr, actualDob } = parsed.data;
    const actualWeight_g = Math.round(actualWeight_lb * 453.592 + actualWeight_oz * 28.3495);
    const actualLength_cm = Math.round((actualLength_in + actualLength_fr) * 2.54 * 10) / 10;
    try {
      await updateDoc(doc(db, "config", "baby"), {
        actualWeight_g, actualLength_cm, actualDob,
        actualWeight_lb, actualWeight_oz, actualLength_in, actualLength_fr,
      });
      setRevealMsg("Results saved!");
    } catch (err) {
      setRevealMsg(err instanceof Error ? err.message : "Error saving results.");
    }
    setTimeout(() => setRevealMsg(""), 5000);
  }

  async function handleToggleReveal() {
    const newVal = !config?.isRevealed;
    try {
      await updateDoc(doc(db, "config", "baby"), { isRevealed: newVal });
      setToggleMsg(`Results ${newVal ? "revealed" : "hidden"}.`);
    } catch (err) {
      setToggleMsg(err instanceof Error ? err.message : "Error toggling reveal.");
    }
    setTimeout(() => setToggleMsg(""), 3000);
  }

  const inputClass =
    "w-full px-3 py-2 border border-[#F0E0E8] rounded-lg text-sm bg-[#FFF8F0] text-[#3D2C35] outline-none focus:border-[#84A98C] transition-colors";
  const labelClass =
    "block text-xs font-medium tracking-wider uppercase text-[#9A8490] mb-1";
  const sectionClass = "bg-white rounded-2xl p-6 mb-4 shadow-sm border border-[#F0E0E8]";
  const btnClass =
    "px-5 py-2 rounded-xl text-sm font-medium text-white border-none cursor-pointer transition-opacity disabled:opacity-60";

  if (authChecking) {
    const s = "animate-pulse bg-[#F0E0E8] rounded-lg";
    const sec = "bg-white rounded-2xl p-6 mb-4 shadow-sm border border-[#F0E0E8]";
    return (
      <div className="min-h-screen bg-[#FFF8F0] px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className={`w-40 h-8 ${s}`} />
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full ${s}`} />
              <div className={`w-12 h-4 ${s}`} />
            </div>
          </div>
          <div className={sec}>
            <div className={`w-28 h-5 mb-4 ${s}`} />
            <div className={`w-24 h-3 mb-2 ${s}`} />
            <div className={`w-full h-9 mb-3 ${s}`} />
            <div className={`w-24 h-3 mb-2 ${s}`} />
            <div className={`w-full h-9 mb-3 ${s}`} />
            <div className={`w-16 h-3 mb-2 ${s}`} />
            <div className={`w-full h-9 mb-4 ${s}`} />
            <div className={`w-24 h-9 rounded-xl ${s}`} />
          </div>
          <div className={sec}>
            <div className={`w-36 h-5 mb-4 ${s}`} />
            <div className="flex gap-2 mb-3">
              <div className={`flex-1 h-9 ${s}`} />
              <div className={`flex-1 h-9 ${s}`} />
            </div>
            <div className={`w-24 h-9 rounded-xl ${s}`} />
          </div>
          <div className={sec}>
            <div className={`w-28 h-5 mb-4 ${s}`} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[#F0E0E8] last:border-0">
                <div>
                  <div className={`w-24 h-4 mb-1 ${s}`} />
                  <div className={`w-40 h-3 ${s}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-lg border border-[#F0E0E8]">
          <div className="text-3xl mb-4 text-center">🔐</div>
          <h1 className="font-playfair text-2xl font-bold text-[#3D2C35] text-center mb-2">
            Admin Login
          </h1>
          <p className="text-[#9A8490] text-xs text-center mb-6">
            Sign in with your authorized Google account
          </p>

          {authError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-700">
              ⚠️ {authError}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#F0E0E8] bg-white text-[#3D2C35] text-sm font-medium cursor-pointer hover:bg-[#FFF8F0] transition-colors disabled:opacity-60"
          >
            <GoogleIcon />
            {authLoading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  const isRevealed = config?.isRevealed && config.actualWeight_g != null;
  const sortedEntries = isRevealed && config
    ? [...entries]
        .map((e) => ({ ...e, score: computeScore(e, config) }))
        .sort((a, b) => b.score - a.score)
    : entries;

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-playfair text-3xl font-bold text-[#3D2C35]">Admin Panel</h1>
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? ""}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full"
              />
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-[#9A8490] underline cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Init */}
        {!config && (
          <div className={sectionClass}>
            <h2 className="font-playfair text-lg font-bold text-[#3D2C35] mb-3">First-Time Setup</h2>
            <p className="text-sm text-[#9A8490] mb-4">No config found. Initialize the Firestore document to get started.</p>
            <button
              onClick={handleInitConfig}
              className={btnClass}
              style={{ background: "#84A98C" }}
            >
              Initialize Config
            </button>
          </div>
        )}

        {/* Baby Config */}
        {config && (
          <div className={sectionClass}>
            <h2 className="font-playfair text-lg font-bold text-[#3D2C35] mb-4">Baby Details</h2>
            <div className="mb-3">
              <label className={labelClass}>Baby Name / Title</label>
              <input className={inputClass} value={configForm.babyName}
                onChange={(e) => setConfigForm({ ...configForm, babyName: e.target.value })} />
              {configErrors.babyName && <p className="text-xs text-red-500 mt-1">{configErrors.babyName}</p>}
            </div>
            <div className="mb-3">
              <label className={labelClass}>Header Text</label>
              <input className={inputClass} value={configForm.headerText}
                onChange={(e) => setConfigForm({ ...configForm, headerText: e.target.value })} />
              {configErrors.headerText && <p className="text-xs text-red-500 mt-1">{configErrors.headerText}</p>}
            </div>
            <div className="mb-3">
              <label className={labelClass}>Emoji</label>
              <input className={inputClass} value={configForm.emoji}
                onChange={(e) => setConfigForm({ ...configForm, emoji: e.target.value })} />
              {configErrors.emoji && <p className="text-xs text-red-500 mt-1">{configErrors.emoji}</p>}
            </div>
            <div className="mb-4">
              <label className={labelClass}>Due Date (optional)</label>
              <input className={inputClass} type="date" value={configForm.dueDate}
                onChange={(e) => setConfigForm({ ...configForm, dueDate: e.target.value })} />
              {configErrors.dueDate && <p className="text-xs text-red-500 mt-1">{configErrors.dueDate}</p>}
            </div>
            <div className="mb-4">
              <label className={labelClass}>Show Birth Date Guess</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const current = config?.showDobGuess;
                    const newVal = current === null ? true : current ? false : null;
                    if (config) {
                      updateDoc(doc(db, "config", "baby"), { showDobGuess: newVal });
                    }
                  }}
                  className="relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none"
                  style={{
                    background:
                      config?.showDobGuess === true ? "#84A98C"
                        : config?.showDobGuess === false ? "#F0E0E8"
                        : "#D1C4C9",
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{
                      transform: config?.showDobGuess === true ? "translateX(20px)" : "translateX(0)",
                    }}
                  />
                </button>
                <span className="text-xs text-[#9A8490]">
                  {config?.showDobGuess === true ? "Always shown"
                    : config?.showDobGuess === false ? "Always hidden"
                    : "Auto (hidden when due date is set)"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveConfig} className={btnClass}
                style={{ background: "linear-gradient(135deg, #84A98C, #52796F)" }}>
                Save Details
              </button>
              {configMsg && <span className="text-sm text-[#9A8490]">{configMsg}</span>}
            </div>
          </div>
        )}

        {/* QR Code */}
        {config && (
          <div className={sectionClass}>
            <h2 className="font-playfair text-lg font-bold text-[#3D2C35] mb-1">QR Code (optional)</h2>
            <p className="text-xs text-[#9A8490] mb-4">
              Upload as PNG or JPG. To use a Venmo PDF, take a screenshot of the QR code first.
            </p>

            {config.qrCodeUrl && (
              <Image
                src={config.qrCodeUrl}
                alt="Current QR code"
                width={128}
                height={128}
                className="w-32 h-32 object-contain rounded-xl border border-[#F0E0E8] mb-3"
              />
            )}

            <div className="mb-3">
              <label className={labelClass}>Caption (e.g. @venmo-username)</label>
              <input
                className={inputClass}
                placeholder="@yourhandle"
                value={qrLabel}
                onChange={(e) => setQrLabel(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className={labelClass}>Message (optional)</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="e.g. All guesses will go to help fund Rowan's 529 plan. Please scan to donate!"
                value={qrMessage}
                onChange={(e) => setQrMessage(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className={labelClass}>Payment Link URL (optional)</label>
              <input
                className={inputClass}
                placeholder="https://venmo.com/code?user_id=..."
                value={qrLinkUrl}
                onChange={(e) => setQrLinkUrl(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className={labelClass}>Image file</label>
              <label
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#F0E0E8] bg-[#FFF8F0] text-sm text-[#3D2C35] cursor-pointer hover:border-[#84A98C] transition-colors"
              >
                Choose File
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {qrFile && <span className="ml-2 text-sm text-[#9A8490]">{qrFile.name}</span>}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleUploadQr}
                disabled={!qrFile || qrUploading}
                className={btnClass}
                style={{ background: "linear-gradient(135deg, #84A98C, #52796F)" }}
              >
                {qrUploading ? "Uploading…" : "Upload QR Code"}
              </button>
              {config.qrCodeUrl && (
                <>
                  <button
                    onClick={handleSaveQrText}
                    className={btnClass}
                    style={{ background: "#84A98C" }}
                  >
                    Save Caption & Message
                  </button>
                  <button
                    onClick={handleRemoveQr}
                    className={btnClass}
                    style={{ background: "#F0E0E8", color: "#3D2C35" }}
                  >
                    Remove
                  </button>
                </>
              )}
              {qrMsg && <span className="text-sm text-[#9A8490]">{qrMsg}</span>}
            </div>
          </div>
        )}

        {/* Actual Results */}
        {config && (
          <div className={sectionClass}>
            <h2 className="font-playfair text-lg font-bold text-[#3D2C35] mb-4">Enter Actual Results</h2>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className={labelClass}>Weight (lb)</label>
                <input className={inputClass} type="number" min="1" max="15"
                  value={revealForm.actualWeight_lb}
                  onChange={(e) => setRevealForm({ ...revealForm, actualWeight_lb: e.target.value })} />
                {revealErrors.actualWeight_lb && <p className="text-xs text-red-500 mt-1">{revealErrors.actualWeight_lb}</p>}
              </div>
              <div className="flex-1">
                <label className={labelClass}>Weight (oz)</label>
                <input className={inputClass} type="number" min="0" max="15"
                  value={revealForm.actualWeight_oz}
                  onChange={(e) => setRevealForm({ ...revealForm, actualWeight_oz: e.target.value })} />
                {revealErrors.actualWeight_oz && <p className="text-xs text-red-500 mt-1">{revealErrors.actualWeight_oz}</p>}
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className={labelClass}>Length (in)</label>
                <input className={inputClass} type="number" min="14" max="26"
                  value={revealForm.actualLength_in}
                  onChange={(e) => setRevealForm({ ...revealForm, actualLength_in: e.target.value })} />
                {revealErrors.actualLength_in && <p className="text-xs text-red-500 mt-1">{revealErrors.actualLength_in}</p>}
              </div>
              <div className="flex-1">
                <label className={labelClass}>Length (.in fraction)</label>
                <input className={inputClass} type="number" min="0" max="0.9" step="0.1"
                  value={revealForm.actualLength_fr}
                  onChange={(e) => setRevealForm({ ...revealForm, actualLength_fr: e.target.value })} />
                {revealErrors.actualLength_fr && <p className="text-xs text-red-500 mt-1">{revealErrors.actualLength_fr}</p>}
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Actual Birth Date</label>
              <input className={inputClass} type="date" value={revealForm.actualDob}
                onChange={(e) => setRevealForm({ ...revealForm, actualDob: e.target.value })} />
              {revealErrors.actualDob && <p className="text-xs text-red-500 mt-1">{revealErrors.actualDob}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveResults} className={btnClass}
                style={{ background: "#84A98C" }}>
                Save Results
              </button>
              {revealMsg && <span className="text-sm text-[#9A8490]">{revealMsg}</span>}
            </div>
          </div>
        )}

        {/* Toggle Reveal */}
        {config && (
          <div className={sectionClass}>
            <h2 className="font-playfair text-lg font-bold text-[#3D2C35] mb-2">Results Visibility</h2>
            <p className="text-sm text-[#9A8490] mb-4">
              Currently: <strong>{config.isRevealed && config.actualWeight_g != null ? "Revealed ✅" : "Hidden 🙈"}</strong>
            </p>
            {config.actualWeight_g == null && (
              <p role="alert" className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Enter and save actual results above before revealing scores.
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleReveal}
                disabled={config.actualWeight_g == null}
                className={btnClass}
                style={{
                  background: config.isRevealed ? "#B4CDB8" : "#84A98C",
                  color: config.isRevealed ? "#3D2C35" : "#fff",
                }}
              >
                {config.isRevealed ? "Hide Results" : "Reveal Results"}
              </button>
              {toggleMsg && <span className="text-sm text-[#9A8490]">{toggleMsg}</span>}
            </div>
          </div>
        )}

        {/* All Entries */}
        <div className={sectionClass}>
          <h2 className="font-playfair text-lg font-bold text-[#3D2C35] mb-4">
            All Entries ({entries.length})
          </h2>
          {entries.length === 0 && (
            <p className="text-[#9A8490] text-sm">No entries yet.</p>
          )}
          {sortedEntries.map((e, i) => (
            <div key={e.id} className="flex justify-between items-center py-2 border-b border-[#F0E0E8] last:border-0">
              <div>
                {"score" in e && <span className="text-xs font-bold text-[#84A98C] mr-2">#{i + 1}</span>}
                <span className="font-medium text-sm text-[#3D2C35]">{e.name}</span>
                <div className="text-xs text-[#9A8490]">
                  {e.weight_lb} lb {e.weight_oz} oz · {e.length_in}.{e.length_fr || 0} in · {e.dob}
                </div>
              </div>
              {"score" in e && (
                <div className="text-xs text-[#9A8490] shrink-0">
                  {Math.round((e as typeof e & { score: number }).score).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
