import { runWeeklyScoring } from "../lib/services/scoring";

const weekId = process.argv[2];
if (!weekId) {
  console.error("Usage: tsx scripts/score-week.ts <week-id>");
  process.exit(1);
}

runWeeklyScoring(weekId)
  .then((res) => {
    console.log(res);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
