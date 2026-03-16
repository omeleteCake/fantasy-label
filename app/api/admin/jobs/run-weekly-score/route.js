import { scoringService } from '../../../../../lib/scoring/scoring-service.js';

export async function POST(request) {
  const body = await request.json();
  const result = scoringService.runWeeklyScore({ weekId: body.weekId });

  return Response.json(result, { status: 200 });
}
