import { signOut } from "@/lib/auth/auth";
import { errorResponse } from "@/lib/auth/http";

export async function POST() {
  try {
    await signOut({ redirect: false });
    return Response.json({ message: "Logged out successfully." });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "We couldn't log you out right now.");
  }
}
