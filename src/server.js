import { createServer } from 'node:http';
import { InMemoryDb } from './db.js';
import { createWeeklyHandler } from './routes/weekly.js';
import { LineupService } from './services/LineupService.js';

const db = new InMemoryDb({
  weeks: [
    {
      id: 'week-1',
      startsAt: '2026-03-16T00:00:00.000Z',
      endsAt: '2026-03-23T00:00:00.000Z',
      lockAt: '2026-03-17T00:00:00.000Z',
    },
  ],
  holdings: [
    { userId: 'user-1', artistId: 'artist-1', quantity: 1 },
    { userId: 'user-1', artistId: 'artist-2', quantity: 1 },
    { userId: 'user-1', artistId: 'artist-3', quantity: 1 },
    { userId: 'user-1', artistId: 'artist-4', quantity: 1 },
    { userId: 'user-1', artistId: 'artist-5', quantity: 1 },
  ],
});

const lineupService = new LineupService(db);
const handler = createWeeklyHandler(lineupService);

const server = createServer((req, res) => handler(req, res));

if (process.env.NODE_ENV !== 'test') {
  server.listen(3000, () => {
    console.log('Server listening on :3000');
  });
}

export { server };
