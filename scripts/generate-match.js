const fs = require('fs');
const path = require('path');

const ROASTS = {
  angry: [
    "Zero output. Company billed crores for this dot ball. This meeting should have been an email.",
    "Wasting company time. Performance Improvement Plan is imminent...",
    "Another predictable failure. Your replacement has already been onboarded.",
    "Your KPIs are in the red. This is not a performance review, it is a termination notice.",
    "Notice period: activated. Good luck in your next role.",
    "The ROI on this delivery is physically painful to look at.",
    "HR has scheduled a 1:1. Please ensure your camera is on.",
    "If incompetence was a measurable metric, you'd be CEO by now."
  ],
  neutral: [
    "Bare minimum achieved. Do not expect a promotion.",
    "Acceptable deliverable. Barely.",
    "A single. Don't let it go to your head.",
    "One run. Management is unimpressed but tolerant.",
    "Adequate throughput. Maintain the SLA.",
    "You touched the ball. Wow. Should we throw a party?",
    "Keep rotating strike. Don't try anything above your pay grade."
  ],
  good: [
    "A boundary. Acceptable output, but one quarterly result doesn't guarantee your retention.",
    "Six runs. The line item is justified... for this ball only.",
    "Grudgingly impressed. Let's see if you can replicate it.",
    "Not bad. Your Q3 appraisal might mention this.",
    "Finally, a positive ROI. Do it again."
  ]
};

function getRoast(runs, isWicket) {
  let category = 'angry';
  if (isWicket || runs === 0) category = 'angry';
  else if (runs >= 4) category = 'good';
  else category = 'neutral';

  const options = ROASTS[category];
  return options[Math.floor(Math.random() * options.length)];
}

function distributeRuns(targetRuns, targetWickets, totalBalls, finalWicketParams = null) {
  // Initialize with 0 runs
  const balls = Array.from({ length: totalBalls }, () => ({ runs: 0, isWicket: false }));

  // 1. Allocate wickets
  let wicketIndices = [];
  if (finalWicketParams) {
    balls[totalBalls - 1].isWicket = true;
    wicketIndices.push(totalBalls - 1);
    targetWickets--;
  }

  while (wicketIndices.length < (targetWickets + (finalWicketParams ? 1 : 0))) {
    let idx = Math.floor(Math.random() * (finalWicketParams ? totalBalls - 1 : totalBalls));
    if (!balls[idx].isWicket) {
      balls[idx].isWicket = true;
      wicketIndices.push(idx);
    }
  }

  // 2. Allocate runs randomly across non-wicket balls
  let runsAllocated = 0;
  while (runsAllocated < targetRuns) {
    let idx = Math.floor(Math.random() * totalBalls);
    if (!balls[idx].isWicket) {
      // give 1, 2, 4 or 6, heavily biased towards smaller runs
      const rand = Math.random();
      let r = 0;
      if (rand < 0.5) r = 1;
      else if (rand < 0.7) r = 2;
      else if (rand < 0.9) r = 4;
      else r = 6;

      // Ensure we don't accidentally exceed targetRuns
      if (runsAllocated + r > targetRuns) {
        r = targetRuns - runsAllocated;
        if (r > 6) r = 6;
        if (r === 3) r = 2; // Keep it realistic
        if (r === 5) r = 4;
      }

      if (balls[idx].runs + r <= 6) {
        balls[idx].runs += r;
        runsAllocated += r;
      }
    }
  }

  return balls;
}

const match = [];
const gtBatters = ["Shubman Gill", "Sai Sudharsan", "David Miller", "Rahul Tewatia", "Rashid Khan"];
const dcBowlers = ["Khaleel Ahmed", "Mukesh Kumar", "Axar Patel", "Kuldeep Yadav"];

const dcBatters = ["Rishabh Pant", "Jake Fraser-McGurk", "Tristan Stubbs", "Axar Patel", "Kuldeep Yadav"];
const gtBowlers = ["Rashid Khan", "Mohit Sharma", "Noor Ahmad", "Umesh Yadav"];

// Innings 1: GT - 210 runs, 4 wickets, 120 balls
const gtBalls = distributeRuns(210, 4, 120);

// Innings 2: DC - 209 runs, 8 wickets, 120 balls (last ball is wicket Kuldeep Yadav)
const dcBalls = distributeRuns(209, 8, 120, { lastBallWicket: true });

function buildInnings(inningsNum, ballData, batters, bowlers, finalWicketBatter) {
  for (let i = 0; i < 120; i++) {
    let over = Math.floor(i / 6);
    let ball = (i % 6) + 1;
    let bData = ballData[i];

    let striker = batters[Math.floor(Math.random() * batters.length)];
    if (finalWicketBatter && i === 119) striker = finalWicketBatter;
    let bowler = bowlers[over % bowlers.length];

    match.push({
      innings: inningsNum,
      over: over,
      ball: ball,
      runs: bData.runs,
      isWicket: bData.isWicket,
      striker: striker,
      bowler: bowler,
      ai_roast: getRoast(bData.runs, bData.isWicket)
    });
  }
}

buildInnings(1, gtBalls, gtBatters, dcBowlers, null);
buildInnings(2, dcBalls, dcBatters, gtBowlers, "Kuldeep Yadav");

const outPath = path.join(__dirname, '..', 'public', 'match_2026.json');

// Ensure public dir exists just in case
if (!fs.existsSync(path.dirname(outPath))) {
  fs.mkdirSync(path.dirname(outPath));
}

fs.writeFileSync(outPath, JSON.stringify(match, null, 2));

console.log(`Successfully generated match data with ${match.length} balls.`);
console.log(`Saved to ${outPath}`);
