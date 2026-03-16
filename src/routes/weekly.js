import { HttpError, ValidationError } from '../errors.js';

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError('Invalid JSON body.');
  }
};

export const createWeeklyHandler = (lineupService) => async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const userId = req.headers['x-user-id'];

    if (req.method === 'GET' && url.pathname === '/api/weeks/current') {
      const week = lineupService.getCurrentWeek();
      return sendJson(res, 200, week);
    }

    if (req.method === 'GET' && url.pathname === '/api/weekly/lineup') {
      const weekId = url.searchParams.get('weekId') ?? lineupService.getCurrentWeek().id;
      const lineup = lineupService.getUserLineup(userId, weekId);
      return sendJson(res, 200, lineup);
    }

    if (req.method === 'POST' && url.pathname === '/api/weekly/lineup') {
      const body = await parseBody(req);
      const weekId = body.weekId ?? lineupService.getCurrentWeek().id;
      const lineup = lineupService.saveLineup(userId, weekId, body.artistIds ?? []);
      return sendJson(res, 200, lineup);
    }

    if (req.method === 'POST' && url.pathname === '/api/weekly/lineup/lock') {
      const body = await parseBody(req);
      const weekId = body.weekId ?? lineupService.getCurrentWeek().id;
      const lineup = lineupService.lockLineup(userId, weekId);
      return sendJson(res, 200, lineup);
    }

    return sendJson(res, 404, { error: 'Route not found.' });
  } catch (error) {
    if (error instanceof HttpError) {
      return sendJson(res, error.status, { error: error.message, details: error.details });
    }
    return sendJson(res, 500, { error: 'Internal server error.' });
  }
};
