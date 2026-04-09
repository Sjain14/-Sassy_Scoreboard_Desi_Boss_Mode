// ─────────────────────────────────────────────────────────────────────────────
// SCORBOARD · Zustand Game State Store
// Handles: Score, Overs, Batters, Bowler, Timeline, Boss Cabin
// Gemini wired: playBall() fires async fetch to /api/boss-reaction
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import playersData from "@/data/players.json";

// ── TYPES ────────────────────────────────────────────────────────────────────
export type BallOutcome = "0" | "1" | "2" | "3" | "4" | "6" | "W";
export type BossEmotion = "angry" | "smirk" | "happy";

export interface PlayerInfo {
  name: string;
  price_cr: number;
  role: string;
}

export interface Batter {
  name: string;
  priceCr: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isStriker: boolean;
}

export interface Bowler {
  name: string;
  priceCr: number;
  completedOvers: number;
  ballsInOver: number;
  runs: number;
  wickets: number;
}

export interface LogEntry {
  over: string;
  outcome: BallOutcome;
  batter: string;
  bowler: string;
  text: string;
}

export interface GameState {
  // ── Match
  teamBatting: "Delhi Capitals" | "Gujarat Titans";
  teamBowling: "Delhi Capitals" | "Gujarat Titans";
  totalRuns: number;
  totalWickets: number;
  completedOvers: number;
  ballsInCurrentOver: number;
  innings: 1 | 2;

  // ── On-field
  striker: Batter;
  nonStriker: Batter;
  bowler: Bowler;
  recentBalls: BallOutcome[];

  // ── Partnership
  partnershipRuns: number;
  partnershipBalls: number;

  // ── Fall of wickets memory
  lastWicketScore: string;
  lastWicketOver: string;

  // ── Boss Cabin
  bossEmotion: BossEmotion;
  bossVerdict: string;
  bossLoading: boolean;

  // ── System Log
  logs: LogEntry[];

  // ── Bench (next batters)
  battingBenchIndex: number;

  isDemoRunning: boolean;
  target?: number;

  // ── Derived helpers (not stored, placed as methods)
  oversDisplay: () => string;
  crr: () => string;
  projectedScore: () => number;
  strikerSR: () => string;
  nonStrikerSR: () => string;
  bowlerEcon: () => string;
  bowlerOversDisplay: () => string;
  roiPercent: () => number;

  // ── Actions
  toggleDemo: () => void;
  playBall: (outcome: BallOutcome, autoplayRoast?: string) => void;
  setBossReaction: (verdict: string, mood: BossEmotion) => void;
}

// ── OUTCOME → LAST ACTION TEXT (for API prompt) ──────────────────────────────
function outcomeToAction(outcome: BallOutcome): string {
  switch (outcome) {
    case "0": return "played a dot ball (zero runs)";
    case "1": return "scored a single (1 run)";
    case "2": return "scored 2 runs";
    case "3": return "scored 3 runs";
    case "4": return "hit a boundary (4 runs)";
    case "6": return "hit a massive six (6 runs)";
    case "W": return "got OUT (wicket fallen)";
  }
}

// ── PLAYER ROSTER HELPERS ────────────────────────────────────────────────────
const dcPlayers: PlayerInfo[] = playersData["Delhi Capitals"];
const gtPlayers: PlayerInfo[] = playersData["Gujarat Titans"];

function getPlayer(team: string, name: string): PlayerInfo {
  const roster = team === "Delhi Capitals" ? dcPlayers : gtPlayers;
  return roster.find((p) => p.name === name) ?? { name, price_cr: 0, role: "unknown" };
}

function getBattingRoster(team: string): PlayerInfo[] {
  return team === "Delhi Capitals" ? dcPlayers : gtPlayers;
}

// ── OUTCOME LOG TEXT ─────────────────────────────────────────────────────────
function logText(outcome: BallOutcome, batter: string, bowler: string): string {
  switch (outcome) {
    case "0": return `Dot ball. ${bowler} beats ${batter}. Silence.`;
    case "1": return `Single taken. ${batter} rotates strike.`;
    case "2": return `Two runs. ${batter} pushes for the double.`;
    case "3": return `Three runs. Good running between the wickets.`;
    case "4": return `FOUR! ${batter} finds the boundary.`;
    case "6": return `SIX! ${batter} launches it into the stands.`;
    case "W": return `WICKET! ${batter} departs. ${bowler} strikes.`;
  }
}

// ── BOSS MOOD LOGIC ──────────────────────────────────────────────────────────
function deriveMood(outcome: BallOutcome): BossEmotion {
  switch (outcome) {
    case "0": return "angry";
    case "W": return "angry";
    case "1":
    case "2":
    case "3": return "smirk";
    case "4":
    case "6": return "happy";
  }
}

// ── PLACEHOLDER VERDICTS ─────────────────────────────────────────────────────
function placeholderVerdict(outcome: BallOutcome, batter: string, price: number): string {
  switch (outcome) {
    case "0":
      return `${batter}. Zero output. Company billed ₹${price.toFixed(2)} Cr for this dot ball. Wasting company time. This meeting should have been an email.`;
    case "1":
      return `${batter} manages a single. ₹${price.toFixed(2)} Cr and this is the deliverable? Bare minimum. Do not expect a promotion cycle.`;
    case "4":
      return `${batter} hits a boundary. Acceptable output for ₹${price.toFixed(2)} Cr. But one quarterly result does not guarantee your retention, employee.`;
    case "6":
      return `${batter} smashes a six. Noted. The ₹${price.toFixed(2)} Cr line item is justified... for this ball only. Resume regular scrutiny immediately.`;
    case "W":
      return `${batter} is OUT. ₹${price.toFixed(2)} Cr investment terminated. HR has been notified. Collect your belongings. Your replacement has been onboarded.`;
    default:
      return `Evaluating ${batter}'s performance against ₹${price.toFixed(2)} Cr. Management is observing.`;
  }
}

// ── CLIMAX DEMO (last 12 balls, hardcoded for offline demo) ──────────────────
const CLIMAX_DEMO =[
  { runs: 2, isWicket: false, action: "2 Runs", striker: "David Miller", roast: "2 runs? Did you expense a cab for that? Hustle harder, Miller. ₹12 Cr demands boundaries.", mood: "smirk" as BossEmotion },
  { runs: 6, isWicket: false, action: "SIX", striker: "David Miller", roast: "Six! Finally, some ROI on your inflated contract. HR is pausing your termination letter.", mood: "happy" as BossEmotion },
  { runs: 4, isWicket: false, action: "FOUR", striker: "David Miller", roast: "Four more. Siraj's bowling valuation is plummeting faster than a crypto crash.", mood: "happy" as BossEmotion },
  { runs: 1, isWicket: false, action: "Single", striker: "David Miller", roast: "A single. Back to mediocrity. Keep rotating the strike, intern.", mood: "smirk" as BossEmotion },
  { runs: 6, isWicket: false, action: "SIX", striker: "Vipraj Nigam", roast: "Vipraj hits a 6! Who even authorized your payroll? Pleasantly surprised.", mood: "happy" as BossEmotion },
  { runs: 4, isWicket: false, action: "FOUR", striker: "Vipraj Nigam", roast: "23 runs in the over! Siraj, please hand in your company laptop and ID badge immediately.", mood: "angry" as BossEmotion },
  { runs: 1, isWicket: false, action: "Single", striker: "Vipraj Nigam", roast: "Perfect yorker. You squeezed out 1 run. Squeezing margins is my job, not yours.", mood: "smirk" as BossEmotion },
  { runs: 0, isWicket: true, action: "Wicket", striker: "Vipraj Nigam", roast: "OUT! Caught. Your performance review is just a picture of a trash can. Pack up.", mood: "angry" as BossEmotion },
  { runs: 1, isWicket: false, action: "Single", striker: "Kuldeep Yadav", roast: "Kuldeep edges for 1. Luck is not a corporate strategy, but we will take the deliverable.", mood: "smirk" as BossEmotion },
  { runs: 6, isWicket: false, action: "SIX", striker: "David Miller", roast: "106 METERS! The only thing bigger than that six is your ego during salary negotiations!", mood: "happy" as BossEmotion },
  { runs: 0, isWicket: false, action: "Dot Ball", striker: "David Miller", roast: "DOT BALL?! 5 needed off 1 and you play a dot?! I'm revoking your ESOPs instantly!", mood: "angry" as BossEmotion },
  { runs: 0, isWicket: true, action: "Run Out", striker: "Kuldeep Yadav", roast: "RUN OUT! MATCH LOST BY 1 RUN! Catastrophic failure! But Miller... fine, you met your KPIs. The rest of you are fired.", mood: "angry" as BossEmotion }
];

// ── INITIAL STATE ────────────────────────────────────────────────────────────
const makeBatter = (name: string, team: string, isStriker: boolean): Batter => {
  const p = getPlayer(team, name);
  return { name: p.name, priceCr: p.price_cr, runs: 0, balls: 0, fours: 0, sixes: 0, isStriker };
};

const makeBowler = (name: string, team: string): Bowler => {
  const p = getPlayer(team, name);
  return { name: p.name, priceCr: p.price_cr, completedOvers: 0, ballsInOver: 0, runs: 0, wickets: 0 };
};

// ── THE STORE ────────────────────────────────────────────────────────────────
export const useGameStore = create<GameState>((set, get) => ({
  // Match
  teamBatting: "Delhi Capitals",
  teamBowling: "Gujarat Titans",
  totalRuns: 0,
  totalWickets: 0,
  completedOvers: 0,
  ballsInCurrentOver: 0,
  innings: 1,

  // On-field
  striker: makeBatter("KL Rahul", "Delhi Capitals", true),
  nonStriker: makeBatter("Pathum Nissanka", "Delhi Capitals", false),
  bowler: makeBowler("Rashid Khan", "Gujarat Titans"),

  recentBalls: [],

  // Partnership
  partnershipRuns: 0,
  partnershipBalls: 0,

  // Last wicket
  lastWicketScore: "—",
  lastWicketOver: "—",

  // Boss
  bossEmotion: "angry",
  bossVerdict: "Awaiting first delivery. Management is watching. ₹ crores are at stake.",
  bossLoading: false,

  // Logs
  logs: [],

  // Bench
  battingBenchIndex: 2, // first two already on field

  isDemoRunning: false,
  target: undefined,

  // ── DERIVED ────────────────────────────────────────────────────────────
  oversDisplay: () => {
    const s = get();
    return `${s.completedOvers}.${s.ballsInCurrentOver}`;
  },

  crr: () => {
    const s = get();
    const totalBalls = s.completedOvers * 6 + s.ballsInCurrentOver;
    if (totalBalls === 0) return "0.00";
    return ((s.totalRuns / totalBalls) * 6).toFixed(2);
  },

  projectedScore: () => {
    const s = get();
    const totalBalls = s.completedOvers * 6 + s.ballsInCurrentOver;
    if (totalBalls === 0) return 0;
    return Math.round((s.totalRuns / totalBalls) * 120);
  },

  strikerSR: () => {
    const s = get();
    return s.striker.balls === 0 ? "—" : ((s.striker.runs / s.striker.balls) * 100).toFixed(1);
  },

  nonStrikerSR: () => {
    const s = get();
    return s.nonStriker.balls === 0 ? "—" : ((s.nonStriker.runs / s.nonStriker.balls) * 100).toFixed(1);
  },

  bowlerEcon: () => {
    const s = get();
    const bowlerBalls = s.bowler.completedOvers * 6 + s.bowler.ballsInOver;
    if (bowlerBalls === 0) return "0.00";
    return ((s.bowler.runs / bowlerBalls) * 6).toFixed(2);
  },

  bowlerOversDisplay: () => {
    const s = get();
    return `${s.bowler.completedOvers}.${s.bowler.ballsInOver}`;
  },

  roiPercent: () => {
    const s = get();
    // ROI = (runs scored / expected runs) * 100
    // Expected runs for a batter at priceCr: rough heuristic = priceCr * 2
    const expected = s.striker.priceCr * 2;
    if (expected === 0) return 0;
    return Math.min(100, Math.round((s.striker.runs / expected) * 100));
  },

  // ── SET BOSS REACTION (called when API responds) ───────────────────────
  setBossReaction: (verdict, mood) =>
    set({ bossVerdict: verdict, bossEmotion: mood, bossLoading: false }),

  // ── AUTOPLAY (Climax Demo — last 12 balls, fully offline) ───────────────
  toggleDemo: () => {
    const state = get();
    if (state.isDemoRunning) {
      if ((globalThis as any).demoInterval) clearInterval((globalThis as any).demoInterval);
      set({
        isDemoRunning: false,
        totalRuns: 0,
        totalWickets: 0,
        completedOvers: 0,
        ballsInCurrentOver: 0,
        innings: 1,
        teamBatting: "Delhi Capitals",
        teamBowling: "Gujarat Titans",
        striker: makeBatter("KL Rahul", "Delhi Capitals", true),
        nonStriker: makeBatter("Pathum Nissanka", "Delhi Capitals", false),
        bowler: makeBowler("Rashid Khan", "Gujarat Titans"),
        recentBalls: [],
        partnershipRuns: 0,
        partnershipBalls: 0,
        lastWicketScore: "—",
        lastWicketOver: "—",
        bossEmotion: "angry",
        bossVerdict: "Awaiting first delivery. Management is watching. ₹ crores are at stake.",
        bossLoading: false,
        logs: [],
        battingBenchIndex: 2,
        target: undefined,
      });
      return;
    }

    set({
      isDemoRunning: true,
      teamBatting: "Delhi Capitals",
      teamBowling: "Gujarat Titans",
      totalRuns: 175,
      totalWickets: 6,
      completedOvers: 18,
      ballsInCurrentOver: 0,
      innings: 2,
      target: 211,
      striker: makeBatter("David Miller", "Delhi Capitals", true),
      nonStriker: makeBatter("Vipraj Nigam", "Delhi Capitals", false),
      bowler: makeBowler("Mohit Sharma", "Gujarat Titans"),
      recentBalls: [],
      partnershipRuns: 12,
      partnershipBalls: 8,
      lastWicketScore: "DC 163/6",
      lastWicketOver: "16.4",
      bossEmotion: "angry",
      bossVerdict: "CLIMAX MODE ENGAGED. DC needs 36 off 12. Management is watching.",
      bossLoading: false,
      logs: [],
      battingBenchIndex: 4,
    });

    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= CLIMAX_DEMO.length) {
        clearInterval(interval);
        set({ isDemoRunning: false });
        return;
      }

      const ball = CLIMAX_DEMO[idx];
      const isWicket = ball.isWicket;
      const outcome: BallOutcome = isWicket ? "W" : ball.runs.toString() as BallOutcome;

      // Update striker name to match the scripted ball
      const currentState = get();
      if (currentState.striker.name !== ball.striker) {
        // Swap if non-striker matches, otherwise force-set
        if (currentState.nonStriker.name === ball.striker) {
          set({
            striker: { ...currentState.nonStriker, isStriker: true },
            nonStriker: { ...currentState.striker, isStriker: false },
          });
        } else {
          set({
            striker: { ...currentState.striker, name: ball.striker, isStriker: true },
          });
        }
      }

      // Play the ball with the hardcoded roast (no API call)
      get().playBall(outcome, ball.roast);

      // Force the mood from the script (override deriveMood)
      set({ bossEmotion: ball.mood });

      idx++;
    }, 3500);

    (globalThis as any).demoInterval = interval;
  },

  // ── PLAY BALL ──────────────────────────────────────────────────────────
  playBall: (outcome, autoplayRoast) => {
    const current = get();
    if (current.totalWickets >= 10 && outcome === "W") return; // cap wickets at 10
    if (current.completedOvers >= 20) return; // Prevent playing balls after 20 overs
    if (current.innings === 2 && current.target && current.totalRuns >= current.target) return; // match over

    // ── Phase 1: Synchronous state update ──
    // Capture the pre-update striker for the API call (on wicket, this is the outgoing batter)
    const prevStriker = current.striker;

    set((state) => {
      const runsScored = outcome === "W" ? 0 : parseInt(outcome);
      const isWicket = outcome === "W";

      // ── Update runs & balls on match level
      const newTotalRuns = state.totalRuns + runsScored;
      const newTotalWickets = state.totalWickets + (isWicket ? 1 : 0);

      // ── Over tracking
      let newBallsInOver = state.ballsInCurrentOver + 1;
      let newCompletedOvers = state.completedOvers;
      let overCompleted = false;
      if (newBallsInOver >= 6) {
        newCompletedOvers += 1;
        newBallsInOver = 0;
        overCompleted = true;
      }

      // ── Striker update
      let newStriker = { ...state.striker };
      let newNonStriker = { ...state.nonStriker };

      if (!isWicket) {
        newStriker.runs += runsScored;
        newStriker.balls += 1;
        if (outcome === "4") newStriker.fours += 1;
        if (outcome === "6") newStriker.sixes += 1;
      } else {
        newStriker.balls += 1;
      }

      // ── Partnership
      let newPartnershipRuns = state.partnershipRuns + runsScored;
      let newPartnershipBalls = state.partnershipBalls + 1;
      let newLastWicketScore = state.lastWicketScore;
      let newLastWicketOver = state.lastWicketOver;

      // ── Handle wicket: pull from bench
      let newBenchIndex = state.battingBenchIndex;
      if (isWicket) {
        newLastWicketScore = `DC ${newTotalRuns}/${newTotalWickets}`;
        newLastWicketOver = `${newCompletedOvers}.${newBallsInOver}`;
        newPartnershipRuns = 0;
        newPartnershipBalls = 0;

        const roster = getBattingRoster(state.teamBatting);
        if (newBenchIndex < roster.length) {
          const incoming = roster[newBenchIndex];
          newStriker = {
            name: incoming.name,
            priceCr: incoming.price_cr,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isStriker: true,
          };
          newBenchIndex += 1;
        }
      }

      // ── Rotate strike on odd runs or end of over
      const oddRuns = runsScored % 2 === 1;
      const shouldSwap = (oddRuns && !overCompleted) || (!oddRuns && overCompleted);
      if (shouldSwap && !isWicket) {
        const temp = { ...newStriker, isStriker: false };
        newStriker = { ...newNonStriker, isStriker: true };
        newNonStriker = temp;
      } else {
        newStriker.isStriker = true;
        newNonStriker.isStriker = false;
      }

      // ── Bowler update
      const newBowler = { ...state.bowler };
      newBowler.runs += runsScored;
      newBowler.ballsInOver = newBallsInOver;
      newBowler.completedOvers = state.bowler.completedOvers;
      if (overCompleted) {
        newBowler.completedOvers += 1;
        newBowler.ballsInOver = 0;
      }
      if (isWicket) newBowler.wickets += 1;

      // ── Recent balls (keep last 6)
      const newRecent = [...state.recentBalls, outcome].slice(-6);

      // ── Boss cabin: set to "thinking" immediately
      const newEmotion = deriveMood(outcome);

      // ── Log entry
      const overStr = `${newCompletedOvers}.${newBallsInOver}`;
      const newLog: LogEntry = {
        over: overStr,
        outcome,
        batter: isWicket ? state.striker.name : newStriker.name,
        bowler: state.bowler.name,
        text: logText(outcome, isWicket ? state.striker.name : newStriker.name, state.bowler.name),
      };
      const newLogs = [newLog, ...state.logs].slice(0, 20);

      // ── Innings swap & Match End checks ──
      let switchInnings = false;
      if (state.innings === 1 && (newTotalWickets >= 10 || newCompletedOvers >= 20)) {
        switchInnings = true;
      }

      if (switchInnings) {
        const battingRoster = getBattingRoster(state.teamBowling);
        const bowlingRoster = getBattingRoster(state.teamBatting);
        
        return {
          innings: 2,
          teamBatting: state.teamBowling,
          teamBowling: state.teamBatting,
          totalRuns: 0,
          totalWickets: 0,
          completedOvers: 0,
          ballsInCurrentOver: 0,
          striker: { name: battingRoster[0].name, priceCr: battingRoster[0].price_cr, runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
          nonStriker: { name: battingRoster[1].name, priceCr: battingRoster[1].price_cr, runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
          bowler: { name: bowlingRoster[5].name, priceCr: bowlingRoster[5].price_cr, completedOvers: 0, ballsInOver: 0, runs: 0, wickets: 0 },
          recentBalls: [],
          partnershipRuns: 0,
          partnershipBalls: 0,
          lastWicketScore: "—",
          lastWicketOver: "—",
          bossEmotion: "smirk",
          bossVerdict: "First innings complete. Let's see if you can chase this down or if I should call HR.",
          bossLoading: false,
          logs: newLogs,
          battingBenchIndex: 2,
          target: newTotalRuns + 1,
        } as Partial<GameState>;
      }

      const matchEnded = state.innings === 2 && (newTotalWickets >= 10 || newCompletedOvers >= 20 || (state.target && newTotalRuns >= state.target));

      return {
        totalRuns: newTotalRuns,
        totalWickets: matchEnded && outcome === "W" && newTotalWickets > 10 ? 10 : newTotalWickets,
        completedOvers: newCompletedOvers,
        ballsInCurrentOver: newBallsInOver,
        striker: newStriker,
        nonStriker: newNonStriker,
        bowler: newBowler,
        recentBalls: newRecent,
        partnershipRuns: newPartnershipRuns,
        partnershipBalls: newPartnershipBalls,
        lastWicketScore: newLastWicketScore,
        lastWicketOver: newLastWicketOver,
        bossEmotion: matchEnded ? (state.target && newTotalRuns >= state.target ? "happy" : "angry") : newEmotion,
        bossVerdict: matchEnded ? (state.target && newTotalRuns >= state.target ? "MATCH WON. Enjoy your bonus." : "MATCH LOST. Pack your desk.") : "Drafting an HR email...",
        bossLoading: !matchEnded,
        logs: newLogs,
        battingBenchIndex: newBenchIndex,
      };
    });

    // ── Phase 2: Async Gemini fetch (or Autoplay mock) ──
    if (autoplayRoast) {
      const mood = deriveMood(outcome);
      get().setBossReaction(autoplayRoast, mood);
      return;
    }

    // Use the pre-update striker for wickets (the player who got out)
    const isWicket = outcome === "W";
    const evalPlayer = isWicket ? prevStriker : get().striker;
    const lastAction = outcomeToAction(outcome);

    fetch("/api/boss-reaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: evalPlayer.name,
        playerPrice: evalPlayer.priceCr,
        runs: isWicket ? prevStriker.runs : evalPlayer.runs,
        balls: isWicket ? prevStriker.balls : evalPlayer.balls,
        lastAction,
      }),
    })
      .then((res) => res.json())
      .then((data: { roast: string; mood: string }) => {
        const mood = (data.mood === "happy" || data.mood === "smirk" || data.mood === "angry")
          ? data.mood as BossEmotion
          : deriveMood(outcome);
        get().setBossReaction(data.roast, mood);
      })
      .catch(() => {
        // On network failure, fall back to local placeholder
        const fallback = placeholderVerdict(outcome, evalPlayer.name, evalPlayer.priceCr);
        get().setBossReaction(fallback, deriveMood(outcome));
      });
  },
}));
