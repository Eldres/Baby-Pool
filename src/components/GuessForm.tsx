"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { submitEntry, type SubmitEntryState } from "@/app/actions";

interface Props {
  onSubmitted: () => void;
  dueDate: string | null;
  showDobGuess: boolean | null;
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 rounded-2xl font-semibold text-base text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-opacity border-none"
      style={{
        background: "linear-gradient(135deg, #84A98C, #52796F)",
        boxShadow: "0 6px 20px rgba(132,169,140,0.45)",
        fontFamily: "var(--font-dm)",
      }}
    >
      {pending ? "Submitting..." : "🍼 Submit My Guess!"}
    </button>
  );
}

export default function GuessForm({ onSubmitted, dueDate, showDobGuess }: Props) {
  const showDob = showDobGuess ?? !dueDate;
  const [metric, setMetric] = useState(false);
  const [state, formAction] = useActionState<SubmitEntryState | null, FormData>(
    submitEntry,
    null
  );

  useEffect(() => {
    if (state?.success) onSubmitted();
  }, [state, onSubmitted]);

  const inputClass =
    "w-full px-3.5 py-2.5 border border-[#F0E0E8] rounded-xl text-sm bg-[#FFF8F0] text-[#3D2C35] outline-none focus:border-[#84A98C] transition-colors";
  const labelClass =
    "block text-xs font-medium tracking-widest uppercase text-[#9A8490] mb-1.5";

  return (
    <form action={formAction}>
      <input type="hidden" name="metric" value={String(metric)} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
                type="button"
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
          name="name"
          placeholder="e.g. Grandma Linda"
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Weight Guess</label>
        {metric ? (
          <div className="relative">
            <input
              className={inputClass}
              type="number"
              name="weight_kg"
              placeholder="e.g. 3.5"
              min="0.5"
              max="7"
              step="0.1"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">kg</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                name="weight_lb"
                placeholder="Lbs"
                min="1"
                max="15"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">lb</span>
            </div>
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                name="weight_oz"
                placeholder="Oz"
                min="0"
                max="15"
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
              name="length_cm"
              placeholder="e.g. 50"
              min="35"
              max="66"
              step="0.5"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">cm</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                name="length_in"
                placeholder="Inches"
                min="14"
                max="26"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">in</span>
            </div>
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="number"
                name="length_fr"
                placeholder="Fraction"
                min="0"
                max="0.9"
                step="0.1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8490] text-xs">.in</span>
            </div>
          </div>
        )}
      </div>

      {showDob && (
        <div className="mb-6">
          <label className={labelClass}>Birth Date Guess</label>
          <input
            className={inputClass}
            type="date"
            name="dob"
            defaultValue={dueDate ?? undefined}
            min={dueDate ? offsetDate(dueDate, -42) : undefined}
            max={dueDate ? offsetDate(dueDate, 42) : undefined}
          />
        </div>
      )}

      {state?.error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
