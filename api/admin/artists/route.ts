import { assertAdmin, errorResponse, jsonResponse, parseJsonBody } from "../_shared";
import {
  artistValidators,
  defaultPersistAdapter,
  type ArtistImportRow,
  parseArtistCsv,
  persistImport,
  validateRows,
} from "../../../lib/services/admin-import.service";

interface CreateArtistRequest {
  artistId: string;
  name: string;
  genre: string;
  basePrice: number;
}

export async function POST(request: Request): Promise<Response> {
  const authError = assertAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseJsonBody<CreateArtistRequest>(request);
  if (error) return error;
  if (!data) return errorResponse("INVALID_BODY", "Body is required", 400);

  const csv = `artistId,name,genre,basePrice\n${data.artistId},${data.name},${data.genre},${data.basePrice}`;
  const parsed = parseArtistCsv(csv);
  const validated = validateRows<ArtistImportRow>(parsed, artistValidators);

  if (validated.rejected.length > 0) {
    return errorResponse(
      "VALIDATION_FAILED",
      "Artist payload failed validation",
      422,
      { rejected: validated.rejected },
    );
  }

  await persistImport({ entity: "artists", rows: validated.accepted }, defaultPersistAdapter);

  return jsonResponse({ artist: validated.accepted[0].data }, 201);
}
