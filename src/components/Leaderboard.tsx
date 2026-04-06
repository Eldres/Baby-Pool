"use client";

import type { Entry, BabyConfig, ScoredEntry } from "@/types";

interface Props {
  entries: Entry[];
  config: BabyConfig;
}

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

function formatLength(entry: Entry): string {
  const fr = entry.length_fr
    ? "." + String(entry.length_fr).replace("0.", "")
    : "";
  return `${entry.length_in}${fr} in`;
}

export default function Leaderboard({ entries, config }: Props) {
  const isRevealed = config.isRevealed && config.actualWeight_g != null;

  // Compute guess spread
  const weights = entries.map((e) => e.weight_g);
  const lengths = entries.map((e) => e.length_cm);
  const minW = entries[weights.indexOf(Math.min(...weights))];
  const maxW = entries[weights.indexOf(Math.max(...weights))];
  const minL = entries[lengths.indexOf(Math.min(...lengths))];
  const maxL = entries[lengths.indexOf(Math.max(...lengths))];
  const lightestWeight = minW ? `${minW.weight_lb} lb ${minW.weight_oz} oz` : "";
  const heaviestWeight = maxW ? `${maxW.weight_lb} lb ${maxW.weight_oz} oz` : "";
  const shortestLength = minL ? formatLength(minL) : "";
  const longestLength = maxL ? formatLength(maxL) : "";

  let displayEntries: (Entry & { rank?: number; score?: number })[] = [...entries];

  if (isRevealed) {
    const scored: ScoredEntry[] = entries
      .map((e) => ({ ...e, score: computeScore(e, config), rank: 0 }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    displayEntries = scored;
  }

  const podium = isRevealed
    ? (displayEntries.slice(0, 3) as ScoredEntry[])
    : [];

  function exportCSV() {
    const headers = ["Name", "Weight Guess", "Length Guess", "Birth Date Guess"];
    const rows = entries.map((e) => [
      e.name,
      `${e.weight_lb} lb ${e.weight_oz} oz`,
      formatLength(e),
      e.dob,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "baby_pool_entries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-playfair text-[22px] font-bold text-[#3D2C35]">All Guesses</h2>
        {entries.length > 0 && (
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full text-xs font-medium text-[#3D2C35] cursor-pointer border-none"
            style={{ background: "#C8E0CC", boxShadow: "0 2px 10px rgba(200,224,204,0.4)" }}
          >
            ⬇️ Export CSV
          </button>
        )}
      </div>

      {entries.length >= 2 && (
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-[#FFF8F0] rounded-xl p-3 border border-[#F0E0E8]">
            <div className="text-xs font-medium tracking-wider uppercase text-[#9A8490] mb-2">Weight Spread</div>
            <div className="flex justify-between text-xs text-[#3D2C35] gap-2">
              <div>
                <span className="text-[#9A8490]">Low </span>
                <span className="font-semibold">{lightestWeight}</span>
                <div className="text-[10px] text-[#9A8490]">{minW?.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[#9A8490]">High </span>
                <span className="font-semibold">{heaviestWeight}</span>
                <div className="text-[10px] text-[#9A8490]">{maxW?.name}</div>
              </div>
            </div>
          </div>
          <div className="bg-[#FFF8F0] rounded-xl p-3 border border-[#F0E0E8]">
            <div className="text-xs font-medium tracking-wider uppercase text-[#9A8490] mb-2">Length Spread</div>
            <div className="flex justify-between text-xs text-[#3D2C35] gap-2">
              <div>
                <span className="text-[#9A8490]">Low </span>
                <span className="font-semibold">{shortestLength}</span>
                <div className="text-[10px] text-[#9A8490]">{minL?.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[#9A8490]">High </span>
                <span className="font-semibold">{longestLength}</span>
                <div className="text-[10px] text-[#9A8490]">{maxL?.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRevealed && config.actualWeight_lb != null && (
        <div className="fade-in rounded-xl p-4 mb-5 border border-[#F0E0E8] bg-white text-center">
          <div className="text-xs font-medium tracking-wider uppercase text-[#9A8490] mb-2">Actual Results</div>
          <div className="flex justify-center gap-4 text-sm text-[#3D2C35]">
            <span>⚖️ {config.actualWeight_lb} lb {config.actualWeight_oz} oz</span>
            <span>📏 {config.actualLength_in}{config.actualLength_fr ? `.${String(config.actualLength_fr).replace("0.", "")}` : ""} in</span>
            {config.actualDob && <span>📅 {config.actualDob}</span>}
          </div>
        </div>
      )}

      {podium.length > 0 && (() => {
        const medals = ["🥇", "🥈", "🥉"];
        const labels = ["Gold", "Silver", "Bronze"];
        const borderColors = ["#D4AF37", "#A8A9AD", "#CD7F32"];
        const bgGradients = [
          "linear-gradient(135deg, #FFFBEA, #FFF3C4)",
          "linear-gradient(135deg, #F5F5F5, #E8E8E8)",
          "linear-gradient(135deg, #FFF0E0, #FFE4CC)",
        ];
        const renderCard = (entry: ScoredEntry, i: number) => (
          <div
            key={entry.id}
            className="rounded-2xl p-4 text-center border-2"
            style={{ borderColor: borderColors[i], background: bgGradients[i], boxShadow: `0 4px 16px ${borderColors[i]}33` }}
          >
            <div className="text-2xl mb-1">{medals[i]}</div>
            <div className="text-[10px] font-medium tracking-wider uppercase mb-1" style={{ color: borderColors[i] }}>
              {labels[i]}
            </div>
            <div className="font-playfair font-bold text-base text-[#3D2C35] mb-1 truncate">
              {entry.name}
            </div>
            <div className="text-xs text-[#3D2C35] mb-0.5">
              ⚖️ {entry.weight_lb} lb {entry.weight_oz} oz · 📏 {formatLength(entry)}
            </div>
            {entry.dob && (
              <div className="text-xs text-[#3D2C35] mb-1.5">📅 {entry.dob}</div>
            )}
            <div
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ color: borderColors[i], background: `${borderColors[i]}1A` }}
            >
              {Math.round(entry.score).toLocaleString()} pts
            </div>
          </div>
        );
        return (
          <div className="fade-in mb-5">
            {/* Gold — centered on top */}
            <div className="flex justify-center mb-2.5">
              <div className="w-full sm:w-2/3 md:w-1/2">
                {renderCard(podium[0], 0)}
              </div>
            </div>
            {/* Silver & Bronze — side by side below */}
            {podium.length > 1 && (
              <div className="grid grid-cols-2 gap-2.5">
                {podium[1] && renderCard(podium[1], 1)}
                {podium[2] && renderCard(podium[2], 2)}
              </div>
            )}
          </div>
        );
      })()}

      {entries.length === 0 && (
        <div className="text-center py-8 text-[#9A8490]">
          <div className="text-4xl mb-3">🌸</div>
          <p>No guesses yet — be the first!</p>
        </div>
      )}

      {displayEntries.map((e, i) => (
        <div
          key={e.id}
          className="fade-in bg-[#FFF8F0] rounded-2xl p-4 mb-2.5 border border-[#F0E0E8] flex justify-between items-center gap-3"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="min-w-0">
            {"rank" in e && e.rank != null && (
              <div className="text-xs font-bold text-[#84A98C] mb-0.5">#{e.rank}</div>
            )}
            <div className="font-semibold text-[15px] text-[#3D2C35] mb-0.5 truncate">{e.name}</div>
            <div className="text-xs text-[#9A8490]">
              ⚖️ {e.weight_lb} lb {e.weight_oz} oz &nbsp;·&nbsp; 📏 {formatLength(e)}
            </div>
            <div className="text-xs text-[#9A8490] mt-0.5">📅 {e.dob}</div>
          </div>
          {"score" in e && e.score != null && (
            <div className="text-right shrink-0">
              <div className="text-xs text-[#9A8490]">score</div>
              <div className="text-sm font-semibold text-[#3D2C35]">
                {Math.round(e.score as number).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      ))}

      {entries.length > 0 && (
        <p className="text-xs text-[#9A8490] text-center mt-3">
          The CSV export opens directly in Excel. Enjoy the reveal! 🍼
        </p>
      )}
    </div>
  );
}
