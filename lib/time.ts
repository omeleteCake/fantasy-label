export const toUtcStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const weekIdFromDate = (date: Date) => {
  const start = toUtcStartOfWeek(date);
  return `week-${start.toISOString().slice(0, 10)}`;
};

export const seasonIdFromWeekStart = (start: Date) => {
  const year = start.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const weeks = Math.floor((start.getTime() - jan1.getTime()) / (7 * 24 * 3600 * 1000));
  const seasonNum = Math.floor(weeks / 4) + 1;
  return `season-${year}-${seasonNum}`;
};
