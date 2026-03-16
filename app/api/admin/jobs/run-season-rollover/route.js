import { scoringService } from '../../../../../lib/scoring/scoring-service.js';

export async function POST(request) {
  const body = await request.json();
  const result = scoringService.runSeasonRollover({ seasonId: body.seasonId });

  return Response.json(result, { status: 200 });
}
