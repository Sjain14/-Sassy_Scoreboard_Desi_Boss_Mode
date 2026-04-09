// ─────────────────────────────────────────────────────────────────────────────
// SCORBOARD · Boss Reaction API Route
// POST /api/boss-reaction
// Calls Gemini to generate a sarcastic corporate roast for the on-strike batter
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// ── Gemini client (lazy singleton) ───────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── Request body shape ───────────────────────────────────────────────────────
interface BossReactionRequest {
  playerName: string;
  playerPrice: number;
  runs: number;
  balls: number;
  lastAction: string;
}

// ── Fallback Categorization Engine ───────────────────────────────────────────
let categoryIndexes: Record<string, number> = {};

function getDynamicFallback(body: BossReactionRequest | null): { roast: string, mood: "angry" | "smirk" | "happy" } {
  if (!body) {
    return { roast: "Management is experiencing technical difficulties. Your performance review has been postponed. Do not celebrate.", mood: "angry" };
  }

  const { playerName, playerPrice, runs, balls, lastAction } = body;
  const action = lastAction.toLowerCase();

  const roasts = {
    firstBallDuck: [
      `${playerName}, onboarded and terminated in the exact same minute. A new company record for fastest firing.`,
      `₹${playerPrice} Cr for a golden duck? I am suing the scouting department for corporate fraud, ${playerName}.`,
      `Zero ROI. Security is already clearing out your locker, ${playerName}. Hand in your ID badge.`,
      `A golden duck? You literally walked in, swiped your ID, and resigned, ${playerName}. Peak inefficiency.`,
      `First ball, zero runs. We spent ₹${playerPrice} Cr for a scenic walk to the crease. Outstanding.`,
      `I’ve seen interns last longer on their first day. Pack up, ${playerName}, we’re done here.`,
      `Not even a single deliverable, ${playerName}. Are you testing my patience or the team’s insurance policy?`,
      `The only thing 'golden' about this duck is the severance package you're NOT getting, ${playerName}.`,
      `₹${playerPrice} Cr down the drain in one delivery. I'm writing ${playerName} off as a total corporate loss.`,
      `Even Internet Explorer would have stayed on the pitch longer than you, ${playerName}.`,
      `${playerName}, you just turned a ₹${playerPrice} Cr investment into a tax write-off in one delivery.`,
      `I didn't authorize a paid vacation to the middle of the pitch, ${playerName}. Get out of my sight.`,
      `First ball dismissal? ${playerName}, you are a walking, breathing breach of contract.`,
      `We paid ₹${playerPrice} Cr for a batter, and we got a designated walker. Unbelievable, ${playerName}.`,
      `Your tenure here lasted exactly one ball, ${playerName}. Don't bother asking for a letter of recommendation.`,
      `Are you allergic to the cricket ball, ${playerName}? Because that ₹${playerPrice} Cr check just bounced in my head.`,
      `First ball out. ${playerName}, I've seen accidental emails with more substance than your innings.`,
      `Total system failure on boot-up. We are decommissioning the ${playerName} project immediately.`,
      `Did you think the objective was to leave the field as quickly as possible, ${playerName}?`,
      `₹${playerPrice} Cr to watch you immediately walk back. I want a refund, ${playerName}.`
    ],
    threeDotBalls: [
      `Three dot balls, ${playerName}? You are a walking Denial-of-Service attack on our run rate.`,
      `Your productivity is officially a rounding error, ${playerName}. Are you on paid time off in the middle of the pitch?`,
      `HR has scheduled an emergency Performance Improvement meeting for ${playerName}. Three deliveries of pure zero output.`,
      `A hat-trick of absolute nothingness. Is there a glitch in your source code, ${playerName}?`,
      `Three deliveries, zero deliverables. ${playerName}, you're buffering worse than the office Wi-Fi.`,
      `At this rate, we'll reach our target in FY 2035. Start moving, ${playerName}, or start packing.`,
      `Are you building a retirement home on that crease, ${playerName}? Rotate the strike or hand in your resignation.`,
      `Three balls of staring at the bowler. I didn't authorize a staring contest for ₹${playerPrice} Cr.`,
      `Total system failure. We are actively bleeding momentum because ${playerName} forgot how to bat.`,
      `This isn't a meditation retreat, ${playerName}. Stop leaving the ball and do your job.`,
      `${playerName}, three dots is a trend, and this trend says you are actively sabotaging the company.`,
      `I am paying ₹${playerPrice} Cr for action, ${playerName}, not a live demonstration of a statue.`,
      `Three dots. ${playerName}, you are currently the most expensive paperweight in corporate history.`,
      `Is your bat on mute, ${playerName}? Three balls and absolutely zero feedback.`,
      `The bowler is doing their job. When exactly do you plan on doing yours, ${playerName}?`,
      `Three consecutive zeroes. ${playerName}'s performance graph is a perfect flatline. Call a medic.`,
      `Are you trying to run out the clock on your own career, ${playerName}? Hit the ball.`,
      `₹${playerPrice} Cr valuation and you can't even find a single off three balls. Pathetic, ${playerName}.`,
      `We are hemorrhaging overs because ${playerName} is paralyzed by incompetence.`,
      `Three deliveries wasted. I am officially docking your pay for this over, ${playerName}.`
    ],
    consecutiveDots: [
      `Another dot? We are billing the clients for this time, ${playerName}. Do something.`,
      `Two balls, zero deliverables. ${playerName}, you are literally stealing company time right now.`,
      `I've seen dial-up internet move faster than your current strike rate, ${playerName}. Escalating to management.`,
      `Back-to-back zeroes. Your performance graph is a flatline, ${playerName}.`,
      `Are we paying you ₹${playerPrice} Cr to block the ball or block the team's progress, ${playerName}?`,
      `I am watching our market share plummet with every dot ball you play, ${playerName}.`,
      `Two deliveries of complete silence. I expect this from a mime, ${playerName}, not a contracted employee.`,
      `Is the bat an optional accessory for you today, ${playerName}?`,
      `A second dot. Management is drafting ${playerName}'s warning letter as we speak.`,
      `I'm seeing zero synergy between your bat and the ball, ${playerName}.`,
      `Consecutive dots. ${playerName}, this is exactly why we didn't give you equity.`,
      `Stop admiring the pitch and start justifying that ₹${playerPrice} Cr paycheck, ${playerName}.`,
      `Another dot. ${playerName}, you are officially a bottleneck in our supply chain.`,
      `Two balls wasted. I could have hired two interns to not hit the ball for a fraction of ₹${playerPrice} Cr.`,
      `Are you intentionally tanking our quarterly projections, ${playerName}?`,
      `We need runs, ${playerName}, not a masterclass in leaving the ball outside off-stump.`,
      `Second dot in a row. ${playerName}, consider your mid-year bonus revoked.`,
      `You are creating a negative ROI environment right now, ${playerName}. Fix it.`,
      `Two dots. This lack of urgency is exactly why ${playerName} will never make upper management.`,
      `Stop stalling, ${playerName}. The bowler isn't going to pitch it on your bat out of pity.`
    ],
    multipleSixes: [
      `Back-to-back quarters of high yield! ${playerName} might actually justify that ₹${playerPrice} Cr invoice!`,
      `Outperforming the fiscal year projections! HR is pausing your termination letter, ${playerName}... for now.`,
      `Finally, some aggressive market disruption. Keep the deliverables coming, ${playerName}.`,
      `Consecutive sixes! Okay, maybe the scouting department gets to keep their jobs this week. Good work, ${playerName}.`,
      `Exponential growth! This is the kind of aggressive expansion the stakeholders demanded from ${playerName}.`,
      `Don't stop now, ${playerName}. We need Q4 results by the end of this over.`,
      `Two maximums. I'm slightly less disappointed in you than I was five minutes ago, ${playerName}.`,
      `Excellent throughput, ${playerName}. But remember, previous performance does not guarantee future results.`,
      `A sudden spike in productivity from ${playerName}! Let's hope it's a trend and not an anomaly.`,
      `I might actually approve your ₹${playerPrice} Cr invoice today, ${playerName}. Keep swinging.`,
      `Multiple sixes. Finally, ${playerName} remembers what we hired them for. Don't get comfortable.`,
      `Aggressive portfolio management by ${playerName}. Keep inflating those numbers.`,
      `We asked for a turnaround strategy and ${playerName} is finally executing it. Proceed.`,
      `Two sixes. ${playerName} is temporarily off the corporate hit-list.`,
      `Don't let two good deliveries inflate your ego, ${playerName}. The target is still far.`,
      `Hostile takeover of the bowler's economy rate. I like it, ${playerName}.`,
      `You found the middle of the bat twice, ${playerName}? Did you read the training manual finally?`,
      `Two maximums. ${playerName} is actually showing signs of corporate leadership. Shocking.`,
      `This is the ₹${playerPrice} Cr output I demanded. Keep the metrics high, ${playerName}.`,
      `A rare double-positive outcome. I am noting this in your file, ${playerName}.`
    ],
    consecutiveSingles: [
      `Just pushing paper around the desk. 1 run per ball is zero innovation, ${playerName}.`,
      `Another single. ${playerName}, you are the human equivalent of an automated "Out of Office" reply.`,
      `Rotating the strike isn't a strategy, ${playerName}, it's just passing the workload to your coworker.`,
      `Back-to-back singles. This is middle-management energy, ${playerName}. Safe, boring, and utterly replaceable.`,
      `One run at a time? We are running a T20 franchise, ${playerName}, not a fixed deposit account.`,
      `Stop delegating the hitting. You're paid ₹${playerPrice} Cr to lead, ${playerName}, not to run singles.`,
      `Micro-transactions will not win us this quarter. We need bulk deals, ${playerName}.`,
      `Another single. Are you allergic to the boundary rope, ${playerName}?`,
      `This incremental growth is unacceptable, ${playerName}. Start taking risks before I take your contract.`,
      `Just trading places. I could hire two interns to do this for a fraction of your salary, ${playerName}.`,
      `Consecutive singles. ${playerName} is just doing data entry at this point. Boring.`,
      `We didn't spend ₹${playerPrice} Cr for a marathon runner, ${playerName}. Hit the ball hard.`,
      `Another single. ${playerName} is perfectly content with mediocrity.`,
      `Stop shuffling the deck chairs and hit an iceberg, ${playerName}. This is too safe.`,
      `Two singles. You are protecting your average instead of our win rate, ${playerName}. Selfish.`,
      `This is a T20, ${playerName}, not a test match. Upgrade your software.`,
      `One run again. ${playerName} is allergic to high-yield investments.`,
      `Another single. The only thing you're disrupting is my patience, ${playerName}.`,
      `Stop giving the strike away, ${playerName}. Take some corporate responsibility.`,
      `Consecutive ones. ${playerName} is playing it so safe I'm falling asleep at my desk.`
    ],
    six: [
      `Six runs. Acceptable deliverable, but let's not pretend this wasn't the bare minimum for ₹${playerPrice} Cr, ${playerName}.`,
      `A boundary! Do not expect a promotion just because you finally did your job, ${playerName}.`,
      `Good trajectory. But management will need to see Q3 consistency before we celebrate, ${playerName}.`,
      `Six runs logged. Don't let it go to your head, ${playerName}, you still have targets to meet.`,
      `A maximum. The stakeholders are momentarily satisfied with ${playerName}. Proceed.`,
      `Decent hit. Now do that 10 more times and we might break even on your ₹${playerPrice} Cr auction price, ${playerName}.`,
      `Finally clearing the boundary. I was starting to think ${playerName} didn't have the bandwidth.`,
      `A six! I'm canceling my meeting with legal... for now, ${playerName}.`,
      `A rare moment of competence from ${playerName}. Document this for the annual review.`,
      `That six covers about 0.001% of your ₹${playerPrice} Cr fee, ${playerName}. Keep working.`,
      `A maximum. Finally, some vertical integration from ${playerName}.`,
      `Six runs. It took you long enough to read the brief, ${playerName}.`,
      `I suppose that justifies keeping you on the payroll till the end of the month, ${playerName}.`,
      `Good leverage of corporate assets, ${playerName}. Do it again.`,
      `A six. Do not mistake my lack of screaming for actual praise, ${playerName}.`,
      `Finally, ${playerName} provides a deliverable that doesn't make me want to fire the scouts.`,
      `Six runs. I will temporarily halt drafting your PIP, ${playerName}.`,
      `You hit it over the rope. Wow. Do you want a sticker, ${playerName}? You make ₹${playerPrice} Cr.`,
      `A six. We are marginally less embarrassed to be associated with you right now, ${playerName}.`,
      `Clear the boundary again, ${playerName}, or that six was just a statistical fluke.`
    ],
    four: [
      `Four runs. Adequate throughput. Maintain the SLA, ${playerName}.`,
      `A boundary. Management is grudgingly tolerant of this output from ${playerName}.`,
      `You found the gap. Just like you found the gap in our hiring process to get that ₹${playerPrice} Cr salary, ${playerName}.`,
      `Four runs secured. Not a six, but we'll accept the partial deliverable, ${playerName}.`,
      `Good ground execution, but no aerial dominance. I expect full-stack performance, ${playerName}.`,
      `A four. Safe, conventional, uninspired. But it pays the bills, ${playerName}.`,
      `Decent boundary. Your job security just increased by approximately 3 minutes, ${playerName}.`,
      `Four runs. That's a solid B-minus effort, ${playerName}. Don't get comfortable.`,
      `Nice gap, but next time clear the rope. We don't do 'almost' here, ${playerName}.`,
      `A four logged in the system. Let's try to optimize that into a six next time, ${playerName}.`,
      `Four runs. ${playerName} is doing just enough to avoid a disciplinary hearing.`,
      `A ground boundary. Very grounded, very boring. But acceptable, ${playerName}.`,
      `Four runs. You are meeting expectations, ${playerName}. And we all know 'meeting expectations' means no bonus.`,
      `You hit a four. Congratulations on doing the baseline requirements of your ₹${playerPrice} Cr contract, ${playerName}.`,
      `Four runs. I'll pass this along to the board as 'moderate growth', ${playerName}.`,
      `A boundary. ${playerName} proves they aren't entirely useless.`,
      `Four runs. Just keep the metrics green, ${playerName}. Nothing fancy.`,
      `You found the fence. I'm shocked you didn't trip on the way there, ${playerName}.`,
      `Four runs. A completely average deliverable from an overpaid asset, ${playerName}.`,
      `It bounced before the rope, ${playerName}. I expect better aerial logistics for ₹${playerPrice} Cr.`
    ],
    single: [
      `One run. You are micromanaging the strike, ${playerName}. Think bigger.`,
      `A single? I pay you ₹${playerPrice} Cr to disrupt the market, ${playerName}, not play it safe.`,
      `Barely moved the needle on our quarterly KPIs. Do better, ${playerName}.`,
      `One run. The absolute bare minimum to avoid a system timeout, ${playerName}.`,
      `Taking a single is just admitting you don't have the capacity for the current workload, ${playerName}.`,
      `Oh, you took a single? Let's give a round of applause for doing the absolute minimum, ${playerName}.`,
      `One run added to the ledger. This slow drip is giving the shareholders anxiety, ${playerName}.`,
      `A single. Very risk-averse, ${playerName}. We are not an insurance company.`,
      `Just tapping it and running. I need a CEO mentality, ${playerName}, not entry-level hustle.`,
      `One run. Wow. At this rate, we'll win the match next Tuesday, ${playerName}.`,
      `A single? Stop playing not to lose and start playing to win, ${playerName}.`,
      `One run. ${playerName} is just keeping the seat warm for someone better.`,
      `A single. The coward's way out of facing a difficult bowler, ${playerName}.`,
      `You gave the strike away? I didn't pay ₹${playerPrice} Cr for you to watch from the non-striker's end, ${playerName}.`,
      `One run. You're practically doing administrative work at this point, ${playerName}.`,
      `A single. Utterly uninspiring. My spreadsheet has more aggressive algorithms than you, ${playerName}.`,
      `You hit it to a fielder and ran. Groundbreaking innovation there, ${playerName}.`,
      `One run. ${playerName} is terrified of taking corporate responsibility for this run chase.`,
      `A single. At least you're not eating up dot balls, but I'm still disappointed, ${playerName}.`,
      `One run. We're paying you ₹${playerPrice} Cr. Act like it, ${playerName}.`
    ],
    dotBall: [
      `Dot ball. This delivery could have been an email, ${playerName}.`,
      `Zero output. The balance sheet is weeping looking at your stats, ${playerName}.`,
      `Wasting resources. Your replacement has already been shortlisted on LinkedIn, ${playerName}.`,
      `A dot ball. ${playerName}, you just cost the company thousands in unmonetized airtime.`,
      `Nothing happened. Are you waiting for a written invitation to hit the ball, ${playerName}?`,
      `Zero runs. Please justify your existence on this pitch, ${playerName}.`,
      `Another dot. My blood pressure is currently higher than your strike rate, ${playerName}.`,
      `A complete miss. I'm deducting this delivery from your performance bonus, ${playerName}.`,
      `Dot ball. The bowler isn't even trying, ${playerName}, you're just failing to execute.`,
      `Are you confused by the spherical object, ${playerName}? Hit it. That's the entire job description.`,
      `Dot ball. ${playerName}, you are currently a liability to our operations.`,
      `Zero runs. This level of incompetence is actually quite expensive, ${playerName}.`,
      `A dot. I am calculating the exact rupees wasted on that swing and miss, ${playerName}.`,
      `Nothing. Absolutely nothing. ${playerName}, you are a black hole for our investment.`,
      `Dot ball. Are you intentionally trying to get me fired by the board, ${playerName}?`,
      `Zero output. If you were a stock, I would be shorting you heavily right now, ${playerName}.`,
      `Another dot. ${playerName}, I'm starting to think your ₹${playerPrice} Cr price tag was a typo.`,
      `You let it go. We don't pay you to be an observer, ${playerName}. Be a participant.`,
      `Dot ball. Every time you miss, the franchise valuation drops a percentage point, ${playerName}.`,
      `A zero. Just like your projected annual review score, ${playerName}.`
    ],
    wicket: [
      `OUT. Your contract is officially a liability, ${playerName}. Pack your desk.`,
      `Dismissed. The only thing dropping faster than your wicket is our stock price, ${playerName}.`,
      `Catastrophic failure in execution. HR will see you in the tunnel, ${playerName}.`,
      `You're out. The only thing you're 'striking' is your name off the payroll, ${playerName}.`,
      `Wicket down. ₹${playerPrice} Cr investment completely liquidated in seconds by ${playerName}.`,
      `That was an RGE - Resume Generating Event. Good luck in the next auction, ${playerName}.`,
      `Walking back to the pavilion? Keep walking right out of the stadium, ${playerName}.`,
      `Absolute project failure. I want ${playerName}'s access card deactivated before they reach the dugout.`,
      `You've been laid off by the bowler. We accept your immediate resignation, ${playerName}.`,
      `Out. A completely useless asset. We're replacing ${playerName} with an AI next season.`,
      `Wicket. ${playerName}, you have successfully bankrupted this innings. Unbelievable.`,
      `You're gone. And taking a massive chunk of our operating budget with you, ${playerName}.`,
      `Out. Don't bother showering, ${playerName}, just get an Uber straight to the airport.`,
      `Dismissed. ${playerName}, I've seen better defensive strategies from a wet paper bag.`,
      `Wicket falls. I am retroactively canceling your last paycheck, ${playerName}.`,
      `You are out. Please refrain from putting this franchise as a reference on your CV, ${playerName}.`,
      `Caught. Bowled. Fired. It's a hat-trick of failures for ${playerName}.`,
      `Out. I am formally requesting a full refund of ₹${playerPrice} Cr from your agent, ${playerName}.`,
      `Wicket. ${playerName}'s tenure here is officially over. Hand over the company bat.`,
      `Dismissal confirmed. ${playerName}, your lack of talent is genuinely inspiring to our competitors.`
    ]
  };

  let categoryKey: keyof typeof roasts = "single";
  let mood: "angry" | "smirk" | "happy" = "smirk";

  if (runs === 0 && balls === 1 && (action.includes("wicket") || action.includes("out") || action.includes("dismissed"))) {
    categoryKey = "firstBallDuck";
    mood = "angry";
  } else if (runs === 0 && balls >= 3 && (action.includes("dot") || action.includes("zero"))) {
    categoryKey = "threeDotBalls";
    mood = "angry";
  } else if (runs === 0 && balls === 2 && (action.includes("dot") || action.includes("zero"))) {
    categoryKey = "consecutiveDots";
    mood = "angry";
  } else if (runs >= 12 && balls <= 4) {
    categoryKey = "multipleSixes";
    mood = "happy";
  } else if ((action.includes("single") || action.includes("1 run")) && runs > 0 && runs === balls) {
    categoryKey = "consecutiveSingles";
    mood = "smirk";
  } else if (action.includes("six") || action.includes("6")) {
    categoryKey = "six";
    mood = "happy";
  } else if (action.includes("four") || action.includes("4") || action.includes("boundary")) {
    categoryKey = "four";
    mood = "happy";
  } else if (action.includes("single") || action.includes("1 run")) {
    categoryKey = "single";
    mood = "smirk";
  } else if (action.includes("wicket") || action.includes("out") || action.includes("dismissed")) {
    categoryKey = "wicket";
    mood = "angry";
  } else if (action.includes("dot") || action.includes("zero")) {
    categoryKey = "dotBall";
    mood = "angry";
  }

  const categoryArray = roasts[categoryKey];
  categoryIndexes[categoryKey] = categoryIndexes[categoryKey] || 0;
  const roast = categoryArray[categoryIndexes[categoryKey] % categoryArray.length];
  categoryIndexes[categoryKey]++;

  return { roast, mood };
}


export async function POST(req: NextRequest) {
  let requestBody: BossReactionRequest | null = null;

  try {
    requestBody = (await req.json()) as BossReactionRequest;
    const { playerName, playerPrice, runs, balls, lastAction } = requestBody;

    // ── Validate ──
    if (!playerName || playerPrice == null || runs == null || balls == null || !lastAction) {
      return NextResponse.json(
        { error: "Missing required fields: playerName, playerPrice, runs, balls, lastAction" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback: return a hardcoded roast so the UI still works without an API key
      return NextResponse.json({
        roast: `${playerName}. ${runs} runs off ${balls} balls at ₹${playerPrice} Cr. Your KPIs are in the red. This is not a performance review — it is a termination notice. — Management`,
        mood: "angry",
      });
    }

    // ── Build system prompt (from /context/ai_prompt_architecture.md) ──
    const systemPrompt = `
ROLE: You are a highly toxic, sarcastic "Desi Corporate Boss" evaluating a cricket player as if they are a corporate employee.

CURRENT METRICS:
- Employee Name: ${playerName}
- Company Investment (Salary): ₹${playerPrice} Crores
- Total Deliverables: ${runs} runs off ${balls} balls
- Latest Event: ${lastAction}

TASK: Write a brutally sarcastic, highly personalized corporate performance review based on these exact metrics. 

STRICT RULES:
1. Output exactly 2 to 3 complete, grammatically correct sentences. DO NOT output single words or fragments.
2. You MUST use ruthless corporate jargon (e.g., PIP, HR, ROI, deliverables, SLA, notice period, quarterly targets).
3. If the event is a Wicket or Dot Ball, threaten their job, mention their exact ₹${playerPrice} Cr cost, and call them a liability.
4. If the event is a 4 or 6, act unimpressed. Call it the "bare minimum" for their massive salary.
5. Maximum 250 characters. No emojis. No hashtags. Just pure, corporate sarcasm.
`;

    // ── Call Gemini ──
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 1.0,
        topP: 0.95,
      },
    });

    const response = result.response;
    const text = response.text().trim();

    // ── Derive mood from lastAction keywords ──
    let mood: "angry" | "smirk" | "happy" = "smirk";
    if (lastAction.includes("dot") || lastAction.includes("OUT") || lastAction.includes("wicket")) {
      mood = "angry";
    } else if (lastAction.includes("boundary") || lastAction.includes("six")) {
      mood = "happy";
    }

    return NextResponse.json({ roast: text, mood });
  } catch (error: unknown) {
    console.error("[boss-reaction] Gemini API error:", error);

    // Artificial Latency: Simulate AI thinking delay to mask fallback
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Contextual Fallback Engine
    const fallback = getDynamicFallback(requestBody);
    return NextResponse.json(fallback, { status: 200 }); // 200 so the client still gets a usable response
  }
}
