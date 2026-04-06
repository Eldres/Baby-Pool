"use client";

import { useState, useEffect } from "react";
import { doc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BabyConfig, Entry } from "@/types";
import Bubbles from "./Bubbles";
import GuessForm from "./GuessForm";
import Leaderboard from "./Leaderboard";
import Image from "next/image";

const DEFAULT_CONFIG: BabyConfig = {
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
};

function PublicSkeleton() {
  const s = "animate-pulse bg-[#F0E0E8] rounded-lg";
  return (
    <div className="min-h-screen bg-[#FFF8F0] relative overflow-hidden pb-16">
      <div className="text-center px-5 pt-12 pb-6">
        <div className={`w-10 h-10 mx-auto mb-2 rounded-full ${s}`} />
        <div className={`w-48 h-8 mx-auto mb-2 ${s}`} />
        <div className={`w-32 h-4 mx-auto ${s}`} />
      </div>
      <div className="flex justify-center gap-2 mb-7">
        <div className={`w-36 h-10 rounded-full ${s}`} />
        <div className={`w-36 h-10 rounded-full ${s}`} />
      </div>
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}>
          <div className={`w-32 h-6 mb-6 ${s}`} />
          <div className={`w-20 h-3 mb-2 ${s}`} />
          <div className={`w-full h-10 mb-4 ${s}`} />
          <div className={`w-24 h-3 mb-2 ${s}`} />
          <div className="flex gap-2 mb-4">
            <div className={`flex-1 h-10 ${s}`} />
            <div className={`flex-1 h-10 ${s}`} />
          </div>
          <div className={`w-24 h-3 mb-2 ${s}`} />
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-10 ${s}`} />
            <div className={`flex-1 h-10 ${s}`} />
          </div>
          <div className={`w-full h-12 rounded-2xl ${s}`} />
        </div>
      </div>
    </div>
  );
}

export default function BabyPool() {
  const [tab, setTab] = useState<"guess" | "leaderboard">("guess");
  const [submitted, setSubmitted] = useState(false);
  const [config, setConfig] = useState<BabyConfig>(DEFAULT_CONFIG);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "config", "baby"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as BabyConfig);
      setLoading(false);
    });

    const q = query(collection(db, "entries"), orderBy("submittedAt", "asc"));
    const unsubEntries = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Entry)));
    });

    return () => {
      unsubConfig();
      unsubEntries();
    };
  }, []);

  if (loading) return <PublicSkeleton />;

  return (
    <div className="min-h-screen bg-[#FFF8F0] relative overflow-hidden pb-16">
      <Bubbles />

      {/* Header */}
      <div className="text-center px-5 pt-12 pb-6 relative">
        <div className="text-4xl mb-2">{config.emoji}</div>
        <h1
          className="font-playfair font-bold text-[#3D2C35] leading-tight mb-2"
          style={{ fontSize: "clamp(28px, 6vw, 46px)" }}
        >
          {config.babyName}
        </h1>
        <p className="text-[#9A8490] text-sm italic">{config.headerText}</p>
        {config.dueDate && (
          <p className="text-[#9A8490] text-xs mt-1">Due: {config.dueDate}</p>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex justify-center gap-2 mb-7" role="tablist">
        {(
          [
            ["guess", "✏️ Make My Guess"],
            ["leaderboard", `📋 All Guesses (${entries.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className="px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer border-none transition-all"
            style={{
              background: tab === key ? "#84A98C" : "#FFFFFF",
              color: tab === key ? "#fff" : "#9A8490",
              boxShadow:
                tab === key
                  ? "0 4px 16px rgba(132,169,140,0.4)"
                  : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card area — multi-column when side panels are active */}
      {(() => {
        const showScoringPanel = config.isRevealed && config.actualWeight_g != null;
        const hasSidePanel = showScoringPanel || !!config.qrCodeUrl;
        const hasBothPanels = showScoringPanel && !!config.qrCodeUrl;
        const maxWidthClass = hasBothPanels ? "max-w-5xl" : hasSidePanel ? "max-w-3xl" : "max-w-lg";
        return (
      <div className={`mx-auto px-4 ${maxWidthClass}`}>
        <div className={`flex gap-4 ${hasSidePanel ? "flex-col md:flex-row items-start" : ""}`}>
          {/* Scoring Guide panel (left side) */}
          {showScoringPanel && (
            <div
              className="bg-white rounded-3xl p-4 sm:p-6 fade-in w-full md:w-64 shrink-0 flex flex-col items-center text-center"
              style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}
            >
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-playfair font-bold text-[#3D2C35] text-base leading-snug mb-3">
                Scoring Guide
              </h3>
              <p className="text-[11px] text-[#9A8490] mb-3">
                Everyone starts at 10,000 points. Points are deducted for each unit you&apos;re off.
              </p>
              <table className="w-full text-xs text-[#3D2C35] border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[#9A8490]">
                    <th className="text-left pb-2 font-medium">Miss</th>
                    <th className="text-right pb-2 font-medium">Per unit</th>
                    <th className="text-right pb-2 font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E0E8]">
                  <tr>
                    <td className="py-1.5 text-[#9A8490]">Weight</td>
                    <td className="py-1.5 text-right font-semibold">−125 / oz</td>
                    <td className="py-1.5 text-right text-[#9A8490]">4 oz = −500</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-[#9A8490]">Length</td>
                    <td className="py-1.5 text-right font-semibold">−635 / in</td>
                    <td className="py-1.5 text-right text-[#9A8490]">0.5 in = −318</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-[#9A8490]">Date</td>
                    <td className="py-1.5 text-right font-semibold">−500 / day</td>
                    <td className="py-1.5 text-right text-[#9A8490]">2 days = −1,000</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-[#F0E0E8] w-full">
                <p className="text-[10px] text-[#9A8490] italic">Highest score wins!</p>
              </div>
            </div>
          )}

          {/* Main card */}
          <div
            role="tabpanel"
            className="bg-white rounded-3xl p-5 sm:p-8 fade-in flex-1 w-full min-w-0"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}
          >
            {tab === "guess" && !submitted && (
              <GuessForm onSubmitted={() => setSubmitted(true)} dueDate={config.dueDate} showDobGuess={config.showDobGuess} />
            )}

            {tab === "guess" && submitted && (
              <div className="text-center py-5 fade-in">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-playfair text-2xl font-bold text-[#3D2C35] mb-2">
                  You&apos;re in!
                </h2>
                <p className="text-[#9A8490] text-sm mb-6">
                  Your guess has been saved. Check out what everyone else guessed!
                </p>
                <button
                  onClick={() => {
                    setTab("leaderboard");
                    setSubmitted(false);
                  }}
                  className="px-7 py-3 rounded-full text-sm font-medium text-[#3D2C35] cursor-pointer border-none"
                  style={{ background: "#B4CDB8" }}
                >
                  See All Guesses →
                </button>
              </div>
            )}

            {tab === "leaderboard" && (
              <Leaderboard entries={entries} config={config} />
            )}
          </div>

          {/* QR Code panel */}
          {config.qrCodeUrl && (
            <div
              className="bg-white rounded-3xl p-4 sm:p-6 fade-in w-full md:w-52 shrink-0 flex flex-col items-center text-center"
              style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}
            >
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-playfair font-bold text-[#3D2C35] text-base leading-snug mb-3">
                Contribute to<br />{config.babyName}&apos;s 529!
              </h3>
              {config.qrCodeMessage && (
                <p className="text-xs text-[#9A8490] mb-3 leading-relaxed">{config.qrCodeMessage}</p>
              )}
              {config.qrCodeLinkUrl && (
                <a
                  href={config.qrCodeLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 w-full inline-block text-center px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #3D95CE, #008CFF)" }}
                >
                  Support with Venmo
                </a>
              )}
              <Image
                width={100}
                height={100}
                loading="eager"
                src={config.qrCodeUrl}
                alt="Venmo QR code"
                className="w-full rounded-xl mb-3"
              />
              {config.qrCodeLabel && (
                <p className="text-sm font-semibold text-[#3D2C35] mb-1">{config.qrCodeLabel}</p>
              )}
              <p className="text-xs text-[#9A8490]">Scan with Venmo</p>
            </div>
          )}
        </div>
      </div>
        );
      })()}

      <p className="text-center text-[#9A8490] text-xs mt-7 italic">
        Share this page with family &amp; friends so everyone can submit their guess ✨
      </p>

      <p className="text-center text-[#9A8490] text-xs mt-2">
        Made with ❤️ by <a href="https://github.com/Eldres" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#3D2C35] transition-colors">Josh Nagel</a>
      </p>
      <div className="flex justify-center mt-2">
        <a href="https://github.com/Eldres/Baby-Pool" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub" className="text-[#9A8490] hover:text-[#3D2C35] transition-colors">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
