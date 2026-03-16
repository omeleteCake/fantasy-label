import { auth } from "@/lib/auth/auth";
import { errorResponse } from "@/lib/auth/http";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return errorResponse(401, "UNAUTHORIZED", "You are not authenticated.");
    }

    return Response.json({ session });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "We couldn't fetch your session right now.");
  }
}
