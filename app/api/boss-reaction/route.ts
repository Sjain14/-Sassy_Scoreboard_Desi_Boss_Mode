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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BossReactionRequest;
    const { playerName, playerPrice, runs, balls, lastAction } = body;

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
    const systemPrompt = `You are a highly sarcastic, slightly toxic "Desi Corporate Boss". You are evaluating a cricket player as if they are your employee. The company paid ₹${playerPrice} Crores for them. On the last ball, they ${lastAction}. Their total output is ${runs} off ${balls}. Write a strictly unique, brutally sarcastic corporate performance review under 150 characters based on these exact stats. Use ruthless corporate jargon (deliverables, PIP, ROI, notice period, escalation, KPIs, appraisal, pink slip). Do not use hashtags. Do not use emojis. Respond with ONLY the roast text, nothing else.`;

    // ── Call Gemini ──
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

    // Return a fallback so the UI doesn't break
    return NextResponse.json(
      {
        roast: "Management is experiencing technical difficulties. Your performance review has been postponed. Do not celebrate.",
        mood: "angry",
      },
      { status: 200 } // 200 so the client still gets a usable response
    );
  }
}
