import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/auth/schemas";
import { errorResponse, validationErrorResponse } from "@/lib/auth/http";

const STARTING_GRANT = 1000;

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const username = parsed.data.username.trim();
  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
        },
        select: { id: true, email: true, username: true, role: true, createdAt: true },
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: createdUser.id,
          balance: STARTING_GRANT,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: createdUser.id,
          walletId: wallet.id,
          type: "GRANT",
          amount: STARTING_GRANT,
          memo: "Welcome grant",
        },
      });

      return createdUser;
    });

    return Response.json({
      user,
      message: "Your account has been created successfully.",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(409, "DUPLICATE_RESOURCE", "Email or username is already in use.");
    }

    return errorResponse(500, "INTERNAL_ERROR", "We couldn't create your account right now.");
  }
}
