"use client";

import { useState } from "react";
import { EntrySchema } from "@/schemas";

interface Props {
  onSubmitted: () => void;
  dueDate: string | null;
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Convert kg → { lb, oz } for schema submission
function kgToLbOz(kg: number): { lb: number; oz: number } {
  const totalOz = kg * 35.274;
  const lb = Math.floor(totalOz / 16);
  const oz = Math.round(totalOz % 16);
  return { lb, oz };
}

// Convert cm → { in, fr } for schema submission
function cmToInFr(cm: number): { inches: number; fr: number } {
  const totalIn = cm / 2.54;
  const inches = Math.floor(totalIn);
  const fr = Math.round((totalIn - inches) * 10) / 10;
  return { inches, fr };
}

export default function GuessForm({ onSubmitted, dueDate }: Props) {
  const [metric, setMetric] = useState(false);
  const [form, setForm] = useState({
    name: "",
    weight_lb: "",
    weight_oz: "",
    weight_kg: "",
    length_in: "",
    length_fr: "",
    length_cm: "",
    dob: dueDate ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    let weight_lb = form.weight_lb;
    let weight_oz = form.weight_oz;
    let length_in = form.length_in;
    let length_fr = form.length_fr || "0";

    if (metric) {
      const kg = parseFloat(form.weight_kg);
      const cm = parseFloat(form.length_cm);
      if (isNaN(kg) || isNaN(cm)) {
        setError("Please enter valid weight and length values.");
        return;
      }
      const { lb, oz } = kgToLbOz(kg);
      const { inches, fr } = cmToInFr(cm);
      weight_lb = String(lb);
      weight_oz = String(oz);
      length_in = String(inches);
      length_fr = String(fr);
    }

    const result = EntrySchema.safeParse({
      name: form.name,
      weight_lb,
      weight_oz,
      length_in,
      length_fr,
      dob: form.dob || null,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const first = Object.values(fieldErrors).flat()[0] as string | undefined;
      setError(first ?? "Please check your entries.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    if (res.ok) {
      onSubmitted();
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Something went wrong.");
    }
    setLoading(false);
  }

  const inputClass =
    "w-full px-3.5 py-2.5 border border-[#F0E0E8] rounded-xl text-sm bg-[#FFF8F0] text-[#3D2C35] outline-none focus:border-[#84A98C] transition-colors";
  const labelClass =
    "block text-xs font-medium tracking-widest uppercase text-[#9A8490] mb-1.5";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-playfair text-[22px] font-bold text-[#3D2C35]">Your Guess</h2>
        <div
          className="flex rounded-full border border-[#F0E0E8] overflow-hidden text-xs font-medium"
          style={{ background: "#FFF8F0" }}
        >
          {(["Imperial", "Metric"] as const).map((unit) => {
            const active = (unit === "Metric") === metric;
            return (
              <button
                key={unit}
                onClick={() => setMetric(unit === "Metric")}
                className="px-3 py-1.5 cursor-pointer border-none transition-colors"
                style={{
                  background: active ? "#84A98C" : "transparent",
                  color: active ? "#fff" : "#9A8490",
                }}
              >
                {unit}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>Your Name</label>
        <input
          className={inputClass}
          placeholder="e.g. Grandma Linda"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Weight Guess</label>
        {metric ? (
          <div className="relative">
            <input
              className={inputClass}
              type="number"
              placeholder="e.g. 3.5"
              min="0.5"
              max="7"
              step="0.1"
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">kg</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                placeholder="Lbs"
                min="1"
                max="15"
                value={form.weight_lb}
                onChange={(e) => setForm({ ...form, weight_lb: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">lb</span>
            </div>
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                placeholder="Oz"
                min="0"
                max="15"
                value={form.weight_oz}
                onChange={(e) => setForm({ ...form, weight_oz: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">oz</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className={labelClass}>Length Guess</label>
        {metric ? (
          <div className="relative">
            <input
              className={inputClass}
              type="number"
              placeholder="e.g. 50"
              min="35"
              max="66"
              step="0.5"
              value={form.length_cm}
              onChange={(e) => setForm({ ...form, length_cm: e.target.value })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">cm</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                placeholder="Inches"
                min="14"
                max="26"
                value={form.length_in}
                onChange={(e) => setForm({ ...form, length_in: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">in</span>
            </div>
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                placeholder="Fraction"
                min="0"
                max="0.9"
                step="0.1"
                value={form.length_fr}
                onChange={(e) => setForm({ ...form, length_fr: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">.in</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl font-semibold text-base text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-opacity border-none"
        style={{
          background: "linear-gradient(135deg, #84A98C, #52796F)",
          boxShadow: "0 6px 20px rgba(132,169,140,0.45)",
          fontFamily: "var(--font-dm)",
        }}
      >
        {loading ? "Submitting..." : "🍼 Submit My Guess!"}
      </button>
    </div>
  );
}
