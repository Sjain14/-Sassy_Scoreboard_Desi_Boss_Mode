"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SCORBOARD · SASSY SCOREBOARD: DESI BOSS EDITION
// Visual Contract from Stitch · Design System: "Midnight Stadium High-Octane"
// STATE: Zustand-powered. All data from useGameStore.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import { useEffect, useState } from "react";
import { useGameStore, type BallOutcome, type BossEmotion } from "@/store/useGameStore";

// ── BOSS MOOD MAP ────────────────────────────────────────────────────────────
const BOSS_MOODS: Record<BossEmotion, { emoji: string; label: string; color: string }> = {
  angry: { emoji: "🤬", label: "FURIOUS",           color: "#ef4444" },
  smirk: { emoji: "😏", label: "BARELY AMUSED",     color: "#f59e0b" },
  happy: { emoji: "😤", label: "GRUDGINGLY IMPRESSED", color: "#facc15" },
};

// ── BALL BADGE ───────────────────────────────────────────────────────────────
function BallBadge({ value }: { value: BallOutcome }) {
  const styles: Record<BallOutcome, string> = {
    "0": "bg-slate-800 text-slate-400 border-slate-700",
    "1": "bg-amber-950 text-amber-400 border-amber-800",
    "2": "bg-slate-800 text-slate-300 border-slate-600",
    "3": "bg-slate-800 text-slate-300 border-slate-600",
    "4": "bg-green-950 text-green-400 border-green-800",
    "6": "bg-yellow-950 text-yellow-400 border-yellow-700 shadow-[0_0_8px_rgba(234,179,8,0.5)]",
    "W": "bg-red-950 text-red-400 border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 text-sm font-black font-mono border ${styles[value]}`}
      style={{ borderRadius: 0 }}
    >
      {value}
    </span>
  );
}

// ── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
      <span className="text-xs font-black tracking-[0.15em] text-blue-400 font-mono uppercase">
        {children}
      </span>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  // ── Hydration guard & Onboarding Tooltips ──
  const [isMounted, setIsMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 

    if (!localStorage.getItem('guideSeen')) {
      setShowGuide(true);
      localStorage.setItem('guideSeen', 'true');
      const t = setTimeout(() => setShowGuide(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Zustand selectors ──
  const teamBatting     = useGameStore((s) => s.teamBatting);
  const innings         = useGameStore((s) => s.innings);
  const totalRuns       = useGameStore((s) => s.totalRuns);
  const totalWickets    = useGameStore((s) => s.totalWickets);
  const striker         = useGameStore((s) => s.striker);
  const nonStriker      = useGameStore((s) => s.nonStriker);
  const bowler          = useGameStore((s) => s.bowler);
  const recentBalls     = useGameStore((s) => s.recentBalls);
  const partnershipRuns = useGameStore((s) => s.partnershipRuns);
  const partnershipBalls = useGameStore((s) => s.partnershipBalls);
  const lastWicketScore = useGameStore((s) => s.lastWicketScore);
  const lastWicketOver  = useGameStore((s) => s.lastWicketOver);
  const bossEmotion     = useGameStore((s) => s.bossEmotion);
  const bossVerdict     = useGameStore((s) => s.bossVerdict);
  const bossLoading     = useGameStore((s) => s.bossLoading);
  const logs            = useGameStore((s) => s.logs);

  // ── Derived values (call store methods) ──
  const isDemoRunning    = useGameStore((s) => s.isDemoRunning);
  const targetValue      = useGameStore((s) => s.target);
  const toggleDemo       = useGameStore((s) => s.toggleDemo);
  const oversDisplay     = useGameStore((s) => s.oversDisplay());
  const crr              = useGameStore((s) => s.crr());
  const projectedScore   = useGameStore((s) => s.projectedScore());
  const strikerSR        = useGameStore((s) => s.strikerSR());
  const nonStrikerSR     = useGameStore((s) => s.nonStrikerSR());
  const bowlerEcon       = useGameStore((s) => s.bowlerEcon());
  const bowlerOvDisp     = useGameStore((s) => s.bowlerOversDisplay());
  const roiPercent       = useGameStore((s) => s.roiPercent());

  const teamBattingInitials = teamBatting === "Delhi Capitals" ? "DC" : "GT";

  const playBall = useGameStore((s) => s.playBall);

  const moodConfig = (
    bossEmotion === "angry" ? { color: "#ef4444", label: "FURIOUS" } :
    bossEmotion === "smirk" ? { color: "#eab308", label: "UNIMPRESSED" } :
    bossEmotion === "happy" ? { color: "#22c55e", label: "TOLERANT" } :
    { color: "#94a3b8", label: "EVALUATING" }
  );
  const sr = (r: number, b: number) => (b === 0 ? "—" : ((r / b) * 100).toFixed(1));

  // ── Partnership overs display ──
  const pOvers = `${Math.floor(partnershipBalls / 6)}.${partnershipBalls % 6}`;

  // ── ROI label ──
  const roiLabel =
    roiPercent >= 80
      ? "ACCEPTABLE — UNDER REVIEW"
      : roiPercent >= 40
      ? "BELOW EXPECTATIONS — PIP DRAFTED"
      : "NOTICE PERIOD IMMINENT";

  // ── Hydration gate ──
  if (!isMounted) return null;

  return (
    <>
      <div className="ambient-bg" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1 · MATCH HEADER BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <header
          className="card"
          style={{
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span className="font-display" style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase" }}>DC</span>
              <span className="font-mono" style={{ fontSize: "11px", color: "#475569" }}>vs</span>
              <span className="font-display" style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.15em", color: "#facc15", textTransform: "uppercase" }}>GT</span>
            </span>
            <span className="font-display" style={{ fontSize: "13px", fontWeight: 600, color: "#e4e1e9" }}>
              Delhi Capitals vs Gujarat Titans
            </span>
            <span className="font-mono" style={{ fontSize: "11px", color: "#475569" }}>|</span>
            <span className="font-mono" style={{ fontSize: "11px", color: "#64748b", letterSpacing: "0.05em" }}>
              Arun Jaitley Stadium, New Delhi
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={toggleDemo}
              className="font-display pulse-live"
              style={{
                padding: "6px 16px",
                background: isDemoRunning 
                    ? "transparent" 
                    : "linear-gradient(90deg, rgba(34, 197, 94, 0.15), rgba(21, 128, 61, 0.15))",
                border: isDemoRunning 
                    ? "1px solid rgba(239, 68, 68, 0.6)" 
                    : "1px solid rgba(34, 197, 94, 0.4)",
                boxShadow: isDemoRunning 
                    ? "0 0 16px rgba(239, 68, 68, 0.2)" 
                    : "0 0 16px rgba(34, 197, 94, 0.3)",
                color: isDemoRunning ? "#ef4444" : "#4ade80",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: "0.1em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isDemoRunning ? "🛑 STOP & RESET" : "▶ START 12-BALL CLIMAX (GT vs DC)"}
            </button>
            {showGuide && (
              <div 
                onClick={() => setShowGuide(false)}
                className="absolute z-50 bg-slate-900/90 backdrop-blur-md text-white border border-blue-500/50 p-3 rounded-lg shadow-xl text-sm animate-pulse cursor-pointer" 
                style={{ top: "120%", right: 0, width: "max-content", maxWidth: "250px" }}
              >
                👋 Start Here! Watch the epic 12-ball climax!
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="pulse-live"
              style={{
                width: 8, height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px rgba(34,197,94,0.8)",
                display: "inline-block",
              }}
            />
            <span className="font-mono" style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.12em" }}>
              LIVE · {innings === 1 ? "1ST INNINGS" : "2ND INNINGS"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span className="font-mono" style={{ fontSize: "11px", color: "#64748b" }}>OVER</span>
            <span className="font-display" style={{ fontSize: "15px", fontWeight: 800, color: "#e4e1e9" }}>
              {oversDisplay} <span style={{ color: "#334155" }}>/</span> <span style={{ color: "#475569" }}>20</span>
            </span>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2 · THREE-COLUMN GRID
        ═══════════════════════════════════════════════════════════════════ */}
        <main style={{ flex: 1, display: "grid", gridTemplateColumns: "35% 35% 30%", overflow: "hidden" }}>

          {/* ─── COLUMN 1 · ACTION BOARD ─────────────────────────────────── */}
          <section style={{ padding: "24px", overflow: "auto", borderRight: "1px solid rgba(255,255,255,0.04)" }}>

            <div style={{ marginBottom: "4px" }}>
              <span
                className="font-display score-glow"
                style={{ fontSize: "clamp(72px, 9vw, 120px)", fontWeight: 900, color: "#3b82f6", lineHeight: 1, display: "block" }}
              >
                {teamBattingInitials} {totalRuns}/{totalWickets}
              </span>
            </div>

            <div className="font-mono" style={{ fontSize: "13px", color: "#64748b", marginBottom: "32px", letterSpacing: "0.05em", display: "flex", gap: "20px" }}>
              <span>{oversDisplay} <span style={{ color: "#334155" }}>OV</span></span>
              <span style={{ color: "#334155" }}>|</span>
              <span>CRR <span style={{ color: "#94a3b8" }}>{crr}</span></span>
              <span style={{ color: "#334155" }}>|</span>
              <span>{innings === 2 && targetValue ? "TARGET" : "PROJ"} <span style={{ color: "#94a3b8" }}>{innings === 2 && targetValue ? targetValue : projectedScore}</span></span>
            </div>

            {/* Batting Table */}
            <div style={{ marginBottom: "24px" }}>
              <SectionLabel>Batting</SectionLabel>
              <div className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 0 }}>
                  {["BATTER", "R", "B", "4s", "SR"].map((h) => (
                    <div key={h} className="font-mono" style={{ fontSize: "9px", color: "#334155", padding: "8px 12px", letterSpacing: "0.12em", fontWeight: 700 }}>
                      {h}
                    </div>
                  ))}
                  {[striker, nonStriker].map((b) => (
                    <div key={b.name} style={{ display: "contents" }}>
                      <div className="font-display" style={{ fontSize: "13px", fontWeight: 600, color: "#e4e1e9", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px", background: b.isStriker ? "rgba(59,130,246,0.04)" : "transparent" }}>
                        {b.isStriker && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 6px rgba(59,130,246,0.9)", display: "inline-block", flexShrink: 0 }} />
                        )}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{b.name}</span>
                        {b.isStriker && <span className="font-mono" style={{ fontSize: "10px", color: "#3b82f6" }}>*</span>}
                      </div>
                      <div className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: b.isStriker ? "#e4e1e9" : "#94a3b8", padding: "10px 12px", background: b.isStriker ? "rgba(59,130,246,0.04)" : "transparent", textAlign: "right" }}>{b.runs}</div>
                      <div className="font-mono" style={{ fontSize: "12px", color: "#64748b", padding: "10px 12px", background: b.isStriker ? "rgba(59,130,246,0.04)" : "transparent", textAlign: "right" }}>{b.balls}</div>
                      <div className="font-mono" style={{ fontSize: "12px", color: "#64748b", padding: "10px 12px", background: b.isStriker ? "rgba(59,130,246,0.04)" : "transparent", textAlign: "right" }}>{b.fours}</div>
                      <div className="font-mono" style={{ fontSize: "12px", color: "#475569", padding: "10px 12px", background: b.isStriker ? "rgba(59,130,246,0.04)" : "transparent", textAlign: "right" }}>{b.isStriker ? strikerSR : nonStrikerSR}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bowling Table */}
            <div style={{ marginBottom: "24px" }}>
              <SectionLabel>Bowling</SectionLabel>
              <div className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 0 }}>
                  {["BOWLER", "O", "R", "W", "ECON"].map((h) => (
                    <div key={h} className="font-mono" style={{ fontSize: "9px", color: "#334155", padding: "8px 12px", letterSpacing: "0.12em", fontWeight: 700 }}>
                      {h}
                    </div>
                  ))}
                  <div className="font-display" style={{ fontSize: "13px", fontWeight: 600, color: "#e4e1e9", padding: "10px 12px" }}>{bowler.name}</div>
                  <div className="font-mono" style={{ fontSize: "12px", color: "#94a3b8", padding: "10px 12px", textAlign: "right" }}>{bowlerOvDisp}</div>
                  <div className="font-mono" style={{ fontSize: "12px", color: "#94a3b8", padding: "10px 12px", textAlign: "right" }}>{bowler.runs}</div>
                  <div className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: "#ef4444", padding: "10px 12px", textAlign: "right" }}>{bowler.wickets}</div>
                  <div className="font-mono" style={{ fontSize: "12px", color: "#64748b", padding: "10px 12px", textAlign: "right" }}>{bowlerEcon}</div>
                </div>
              </div>
            </div>

            {/* Recent Balls */}
            <div>
              <SectionLabel>Recent</SectionLabel>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {recentBalls.length === 0 ? (
                  <span className="font-mono" style={{ fontSize: "10px", color: "#334155" }}>No deliveries yet</span>
                ) : (
                  recentBalls.map((b, i) => <BallBadge key={i} value={b} />)
                )}
              </div>
            </div>
          </section>

          {/* ─── COLUMN 2 · MATCH CONTEXT & CONTROLS ─────────────────────── */}
          <section style={{ padding: "24px", overflow: "auto", borderRight: "1px solid rgba(255,255,255,0.04)" }}>

            <div style={{ marginBottom: "24px" }}>
              <SectionLabel>Match Situation</SectionLabel>
              <div className="card" style={{ padding: "16px", marginBottom: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: "PARTNERSHIP", value: `${partnershipRuns} runs`, sub: `${pOvers} overs` },
                    { label: targetValue ? "TARGET" : "PROJECTED", value: targetValue ? targetValue : projectedScore, sub: targetValue ? `${targetValue - totalRuns} runs needed` : "at current CRR" },
                    { label: "LAST WKT FELL", value: lastWicketScore, sub: lastWicketOver === "—" ? "—" : `over ${lastWicketOver}` },
                    { label: "CURRENT RR", value: crr, sub: "runs per over" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
                      <div className="font-mono" style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.14em", marginBottom: "6px" }}>{item.label}</div>
                      <div className="font-display" style={{ fontSize: "20px", fontWeight: 800, color: "#e4e1e9" }}>{item.value}</div>
                      <div className="font-mono" style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Over Progress */}
            <div style={{ marginBottom: "24px" }}>
              <SectionLabel>Over Progress · {oversDisplay} / 20</SectionLabel>
              <div className="card" style={{ padding: "12px" }}>
                <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                  {Array.from({ length: 20 }, (_, i) => {
                    const overNum = i + 1;
                    const completedOvers = useGameStore.getState().completedOvers;
                    const ballsInOver = useGameStore.getState().ballsInCurrentOver;
                    const currentOver = ballsInOver > 0 ? completedOvers + 1 : completedOvers;
                    const isComplete = overNum <= completedOvers;
                    const isCurrent = overNum === currentOver && ballsInOver > 0;
                    return (
                      <div
                        key={i}
                        style={{
                          width: "calc((100% - 57px) / 20)",
                          height: "28px",
                          background: isComplete
                            ? "rgba(59,130,246,0.25)"
                            : isCurrent
                            ? "rgba(59,130,246,0.5)"
                            : "rgba(255,255,255,0.03)",
                          border: isCurrent ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span className="font-mono" style={{ fontSize: "8px", color: isComplete ? "#3b82f6" : isCurrent ? "#93c5fd" : "#1e293b" }}>{overNum}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Developer Controls */}
            <div style={{ position: "relative" }}>
              {showGuide && (
                <div 
                  onClick={() => setShowGuide(false)}
                  className="absolute z-50 bg-slate-900/90 backdrop-blur-md text-white border border-blue-500/50 p-3 rounded-lg shadow-xl text-sm animate-pulse cursor-pointer" 
                  style={{ bottom: "105%", left: "50%", transform: "translateX(-50%)", width: "max-content", maxWidth: "250px" }}
                >
                  🛠️ Or click these to simulate the match manually!
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span className="font-mono" style={{ fontSize: "9px", color: "#1e3a5f", letterSpacing: "0.2em" }}>[ DEVELOPER CONTROLS ]</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                <button className="btn-terminal btn-dot" style={{ width: "100%" }} onClick={() => playBall("0")}>
                  DOT BALL
                </button>
                <button className="btn-terminal btn-single" style={{ width: "100%" }} onClick={() => playBall("1")}>
                  SINGLE
                </button>
                <button className="btn-terminal btn-four" style={{ width: "100%" }} onClick={() => playBall("4")}>
                  FOUR ◈
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button className="btn-terminal btn-six" style={{ width: "100%", padding: "12px 4px" }} onClick={() => playBall("6")}>
                  SIX ✦
                </button>
                <button className="btn-terminal btn-wicket" style={{ width: "100%", padding: "12px 4px" }} onClick={() => playBall("W")}>
                  WICKET ✕
                </button>
              </div>

              {/* System Log */}
              <div className="card" style={{ marginTop: "16px", padding: "12px" }}>
                <div className="font-mono" style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.12em", marginBottom: "8px" }}>SYSTEM_LOG</div>
                {logs.length === 0 ? (
                  <div className="font-mono" style={{ fontSize: "10px", color: "#334155" }}>&gt; Awaiting first delivery...</div>
                ) : (
                  logs.slice(0, 6).map((log, i) => (
                    <div key={i} className="font-mono" style={{ fontSize: "10px", color: i === 0 ? "#94a3b8" : "#334155", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      &gt; {log.over}: {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ─── COLUMN 3 · THE BOSS'S CABIN ──────────────────────────────── */}
          <section className="boss-cabin" style={{ padding: "24px", overflow: "auto" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "16px" }}>💼</span>
              <span className="font-mono" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", color: "#facc15", textTransform: "uppercase" }}>
                The Boss&apos;s Cabin
              </span>
            </div>

            {/* Boss Avatar */}
            <div className="card" style={{ padding: "16px", marginBottom: "16px", background: "rgba(250,204,21,0.03)", border: "1px solid rgba(250,204,21,0.1)", display: "flex", flexDirection: "row", alignItems: "center", gap: "16px" }}>
              <Image src={`/avatars/${bossEmotion}.png`} alt={bossEmotion} width={160} height={160} style={{ objectFit: "contain", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="font-mono" style={{ fontSize: "9px", color: "#475569", letterSpacing: "0.15em", marginBottom: "6px" }}>CURRENT MOOD</div>
                <div className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: moodConfig.color, letterSpacing: "0.1em" }}>
                  {moodConfig.label}
                </div>
              </div>
            </div>

            {/* Currently Evaluating */}
            <div style={{ marginBottom: "16px" }}>
              <div className="font-mono" style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.15em", marginBottom: "8px" }}>
                CURRENTLY EVALUATING:
              </div>
              <div className="card" style={{ padding: "14px", border: "1px solid rgba(250,204,21,0.12)" }}>
                <div className="font-display" style={{ fontSize: "18px", fontWeight: 800, color: "#e4e1e9", marginBottom: "4px" }}>
                  {striker.name}
                </div>
                <div className="font-mono" style={{ fontSize: "13px", fontWeight: 700, color: "#facc15", marginBottom: "6px" }}>
                  Billed at ₹{striker.priceCr ? striker.priceCr.toFixed(2) : "5.00"} Cr {!striker.priceCr ? "(Estimated)" : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ padding: "2px 8px", background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", fontSize: "10px" }} className="font-mono">
                    Delhi Capitals
                  </span>
                  <span className="font-mono" style={{ fontSize: "10px", color: "#64748b" }}>
                    {striker.runs}({striker.balls}) · SR {strikerSR}
                  </span>
                </div>
              </div>
            </div>

            {/* The Verdict */}
            <div style={{ marginBottom: "16px" }}>
              <div className="font-mono" style={{ fontSize: "9px", color: "#92400e", letterSpacing: "0.15em", marginBottom: "8px" }}>
                ▸ THE VERDICT:
              </div>
              <div className="verdict-box" style={{ padding: "16px", marginBottom: "8px" }}>
                <p className="font-mono" style={{ fontSize: "11px", color: bossLoading ? "#64748b" : "#fbbf24", lineHeight: "1.7", margin: 0 }}>
                  &ldquo;{bossLoading ? "Evaluating performance..." : bossVerdict}&rdquo;
                </p>
              </div>

              <style>{`
                @keyframes tweetFlash {
                  0% { background: rgba(34, 197, 94, 0.3); color: #fff; box-shadow: 0 0 12px rgba(34, 197, 94, 0.4); }
                  100% { background: rgba(255, 255, 255, 0.03); color: #475569; box-shadow: 0 0 0px transparent; }
                }
              `}</style>
              <div 
                key={bossVerdict} 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  padding: "4px 8px", 
                  borderRadius: "4px", 
                  border: "1px solid rgba(255,255,255,0.05)",
                  animation: "tweetFlash 1.2s ease-out forwards"
                }}
              >
                <span style={{ fontSize: "12px" }}>𝕏</span>
                <span className="font-mono" style={{ fontSize: "9px", letterSpacing: "0.05em" }}>Auto-publishing to 𝕏...</span>
              </div>
            </div>

            {/* ROI Meter */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div className="font-mono" style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.15em" }}>ROI METER</div>
                <div className="font-mono" style={{ fontSize: "10px", fontWeight: 700, color: roiPercent >= 60 ? "#facc15" : "#ef4444" }}>{roiPercent}%</div>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.04)", position: "relative", marginBottom: "6px" }}>
                <div
                  style={{
                    width: `${roiPercent}%`,
                    height: "100%",
                    background: roiPercent >= 60
                      ? "linear-gradient(90deg, #854d0e, #facc15)"
                      : "linear-gradient(90deg, #991b1b, #ef4444)",
                    boxShadow: roiPercent >= 60
                      ? "0 0 8px rgba(250,204,21,0.5)"
                      : "0 0 8px rgba(239,68,68,0.5)",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <div className="font-mono" style={{ fontSize: "10px", color: roiPercent >= 60 ? "#facc15" : "#ef4444", letterSpacing: "0.08em" }}>
                {roiPercent}% ROI — {roiLabel}
              </div>
            </div>

            {/* HR Alert */}
            <div
              style={{
                marginTop: "20px",
                padding: "10px 14px",
                background: totalWickets > 0 ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)",
                border: totalWickets > 0 ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "14px" }}>{totalWickets > 0 ? "📋" : "📁"}</span>
              <div>
                <div className="font-mono" style={{ fontSize: "9px", color: totalWickets > 0 ? "#ef4444" : "#475569", letterSpacing: "0.12em", marginBottom: "2px" }}>
                  {totalWickets > 0 ? "HR NOTIFICATIONS SENT" : "HR STATUS: STANDBY"}
                </div>
                <div className="font-mono" style={{ fontSize: "9px", color: "#475569" }}>
                  {totalWickets > 0 ? `${totalWickets} employee(s) terminated this innings` : "No termination actions pending"}
                </div>
              </div>
            </div>

            {/* Footer stamp */}
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <span className="font-mono" style={{ fontSize: "8px", color: "#1e293b", letterSpacing: "0.2em" }}>SCORBOARD · REV 2026.04 · CORP-ROAST-EDITION</span>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
