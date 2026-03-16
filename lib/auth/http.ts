import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "DUPLICATE_RESOURCE"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export function validationErrorResponse(error: ZodError) {
  return Response.json(
    {
      error: {
        code: "VALIDATION_ERROR" as ApiErrorCode,
        message: "Please check your input and try again.",
        fields: error.flatten(),
      },
    },
    { status: 422 },
  );
}

export function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}
