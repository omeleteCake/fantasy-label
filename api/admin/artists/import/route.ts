import { assertAdmin, errorResponse, jsonResponse, parseJsonBody } from "../../_shared";
import {
  artistValidators,
  defaultPersistAdapter,
  parseArtistCsv,
  persistImport,
  validateRows,
  type ImportMode,
} from "../../../../lib/services/admin-import.service";

interface ImportRequest {
  csv: string;
  mode?: ImportMode;
}

export async function POST(request: Request): Promise<Response> {
  const authError = assertAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseJsonBody<ImportRequest>(request);
  if (error) return error;

  if (!data?.csv) {
    return errorResponse("MISSING_CSV", "csv is required", 400);
  }

  const mode: ImportMode = data.mode ?? "preview";
  const parsed = parseArtistCsv(data.csv);
  const validation = validateRows(parsed, artistValidators);

  if (mode === "preview") {
    return jsonResponse({
      mode,
      accepted: validation.accepted,
      rejected: validation.rejected,
      summary: {
        accepted: validation.accepted.length,
        rejected: validation.rejected.length,
      },
    });
  }

  if (validation.rejected.length > 0) {
    return errorResponse(
      "VALIDATION_FAILED",
      "Import contains invalid rows; resolve errors before commit",
      422,
      {
        accepted: validation.accepted,
        rejected: validation.rejected,
      },
    );
  }

  const result = await persistImport({ entity: "artists", rows: validation.accepted }, defaultPersistAdapter);

  return jsonResponse({
    mode,
    persistedCount: result.persistedCount,
    accepted: validation.accepted,
    rejected: validation.rejected,
  });
}
