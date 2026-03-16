export type ImportMode = "preview" | "commit";

export interface ArtistImportRow {
  artistId: string;
  name: string;
  genre: string;
  basePrice: number;
}

export interface MetricsImportRow {
  artistId: string;
  weekStart: string;
  streams: number;
  growthRate: number;
  engagementGrowth: number;
}

export interface ParsedRow<T> {
  rowNumber: number;
  data?: T;
  errors: string[];
}

export interface ValidatedRow<T> {
  rowNumber: number;
  data: T;
}

export interface RejectedRow {
  rowNumber: number;
  errors: string[];
}

export interface ValidationResult<T> {
  accepted: ValidatedRow<T>[];
  rejected: RejectedRow[];
}

export interface PersistAdapter {
  transaction<T>(operation: () => Promise<T>): Promise<T>;
  upsertArtist(row: ArtistImportRow): Promise<void>;
  insertMetric(row: MetricsImportRow): Promise<void>;
}

export interface PersistImportInput<T> {
  entity: "artists" | "metrics";
  rows: ValidatedRow<T>[];
}

export interface PersistImportResult {
  persistedCount: number;
}

const artistStore = new Map<string, ArtistImportRow>();
const metricsStore: MetricsImportRow[] = [];

export const defaultPersistAdapter: PersistAdapter = {
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  },
  async upsertArtist(row: ArtistImportRow): Promise<void> {
    artistStore.set(row.artistId, row);
  },
  async insertMetric(row: MetricsImportRow): Promise<void> {
    metricsStore.push(row);
  },
};

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      currentRow.push(current.trim());
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || currentRow.length > 0) {
    currentRow.push(current.trim());
    if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
  }

  return rows;
}

function toRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    record[header] = row[index] ?? "";
  });
  return record;
}

function parseNumber(value: string, field: string, errors: string[]): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${field} must be a valid number`);
  }
  return parsed;
}

export function parseArtistCsv(csv: string): ParsedRow<ArtistImportRow>[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => value.toLowerCase());

  return rows.slice(1).map((rawRow, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];
    const record = toRecord(headers, rawRow);

    const artistId = record.artistid || record.artist_id;
    const name = record.name;
    const genre = record.genre;
    const basePrice = parseNumber(record.baseprice || record.base_price, "basePrice", errors);

    if (!artistId) errors.push("artistId is required");
    if (!name) errors.push("name is required");
    if (!genre) errors.push("genre is required");

    return {
      rowNumber,
      data: errors.length
        ? undefined
        : {
            artistId,
            name,
            genre,
            basePrice,
          },
      errors,
    };
  });
}

export function parseMetricsCsv(csv: string): ParsedRow<MetricsImportRow>[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => value.toLowerCase());

  return rows.slice(1).map((rawRow, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];
    const record = toRecord(headers, rawRow);

    const artistId = record.artistid || record.artist_id;
    const weekStart = record.weekstart || record.week_start;
    const streams = parseNumber(record.streams, "streams", errors);
    const growthRate = parseNumber(record.growthrate || record.growth_rate, "growthRate", errors);
    const engagementGrowth = parseNumber(
      record.engagementgrowth || record.engagement_growth,
      "engagementGrowth",
      errors,
    );

    if (!artistId) errors.push("artistId is required");
    if (!weekStart) errors.push("weekStart is required");

    return {
      rowNumber,
      data: errors.length
        ? undefined
        : {
            artistId,
            weekStart,
            streams,
            growthRate,
            engagementGrowth,
          },
      errors,
    };
  });
}

export function validateRows<T>(
  rows: ParsedRow<T>[],
  validators: Array<(row: T) => string | undefined>,
): ValidationResult<T> {
  const accepted: ValidatedRow<T>[] = [];
  const rejected: RejectedRow[] = [];

  rows.forEach((row) => {
    const rowErrors = [...row.errors];

    if (row.data) {
      validators.forEach((validate) => {
        const error = validate(row.data as T);
        if (error) rowErrors.push(error);
      });
    }

    if (row.data && rowErrors.length === 0) {
      accepted.push({ rowNumber: row.rowNumber, data: row.data });
    } else {
      rejected.push({ rowNumber: row.rowNumber, errors: rowErrors });
    }
  });

  return { accepted, rejected };
}

export async function persistImport<T>(
  input: PersistImportInput<T>,
  adapter: PersistAdapter = defaultPersistAdapter,
): Promise<PersistImportResult> {
  await adapter.transaction(async () => {
    for (const row of input.rows) {
      if (input.entity === "artists") {
        await adapter.upsertArtist(row.data as ArtistImportRow);
      } else {
        await adapter.insertMetric(row.data as MetricsImportRow);
      }
    }
  });

  return { persistedCount: input.rows.length };
}

export const artistValidators: Array<(row: ArtistImportRow) => string | undefined> = [
  (row) => (row.basePrice < 0 ? "basePrice must be >= 0" : undefined),
];

export const metricValidators: Array<(row: MetricsImportRow) => string | undefined> = [
  (row) => (row.streams < 0 ? "streams must be >= 0" : undefined),
  (row) => (!/^\d{4}-\d{2}-\d{2}$/.test(row.weekStart) ? "weekStart must use YYYY-MM-DD" : undefined),
];

export function getImportStoreSnapshot(): { artists: ArtistImportRow[]; metrics: MetricsImportRow[] } {
  return { artists: Array.from(artistStore.values()), metrics: [...metricsStore] };
}
