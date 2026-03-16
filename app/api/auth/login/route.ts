import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import { errorResponse, parseJson, validationErrorResponse } from "@/lib/auth/http";
import { loginSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
  const json = await parseJson(request);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    if (typeof result === "string") {
      return errorResponse(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    return Response.json({ message: "Logged in successfully." });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return errorResponse(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    return errorResponse(500, "INTERNAL_ERROR", "We couldn't log you in right now.");
  }
}
