export interface ErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): Response {
  const payload: ErrorPayload = { error: { code, message, details } };
  return jsonResponse(payload, status);
}

export function assertAdmin(request: Request): Response | undefined {
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!adminToken) {
    return errorResponse(
      "ADMIN_CONFIG_MISSING",
      "Admin API token is not configured on the server",
      500,
    );
  }

  const provided = request.headers.get("x-admin-token");
  if (provided !== adminToken) {
    return errorResponse("UNAUTHORIZED", "Admin credentials are invalid", 401);
  }

  return undefined;
}

export async function parseJsonBody<T>(request: Request): Promise<{ data?: T; error?: Response }> {
  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return { error: errorResponse("INVALID_JSON", "Request body must be valid JSON", 400) };
  }
}
