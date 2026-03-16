import { hash, compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { LoginInput, RegisterInput } from "@/lib/auth/schemas";

const STARTING_GRANT = 1000;
const HASH_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  const passwordHash = await hash(input.password, HASH_ROUNDS);

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
        select: { id: true },
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

    return { ok: true as const, user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, reason: "duplicate" as const };
    }

    return { ok: false as const, reason: "internal" as const };
  }
}

export async function validateCredentials(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValid = await compare(input.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}
