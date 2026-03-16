import { errorResponse, parseJson, validationErrorResponse } from "@/lib/auth/http";
import { registerSchema } from "@/lib/auth/schemas";
import { registerUser } from "@/lib/auth/service";

export async function POST(request: Request) {
  const json = await parseJson(request);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const result = await registerUser(parsed.data);

  if (!result.ok && result.reason === "duplicate") {
    return errorResponse(409, "DUPLICATE_RESOURCE", "Email or username is already in use.");
  }

  if (!result.ok) {
    return errorResponse(500, "INTERNAL_ERROR", "We couldn't create your account right now.");
  }

  return Response.json({
    user: result.user,
    message: "Your account has been created successfully.",
  });
}
