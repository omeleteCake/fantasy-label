import { OrderSide, Prisma } from "@prisma/client";
import { costToBuy, proceedsToSell } from "@/lib/amm";
import { prisma } from "@/lib/prisma";

export const executeTrade = async (userId: string, artistId: string, side: OrderSide, quantity: number, idempotencyKey?: string) => {
  if (quantity <= 0) throw new Error("Quantity must be positive");

  return prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.trade.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;
    }

    const [artist, wallet] = await Promise.all([
      tx.artist.findUnique({ where: { id: artistId } }),
      tx.wallet.findUnique({ where: { userId } }),
    ]);

    if (!artist || !wallet) throw new Error("Missing artist or wallet");

    const params = { basePrice: Number(artist.basePrice), kFactor: Number(artist.kFactor) };
    const holding = await tx.holding.findUnique({ where: { userId_artistId: { userId, artistId } } });

    let grossAmount = 0;
    const supplyBefore = artist.supply;
    const supplyAfter = side === OrderSide.BUY ? supplyBefore + quantity : supplyBefore - quantity;

    if (side === OrderSide.BUY) {
      grossAmount = costToBuy(supplyBefore, quantity, params);
      if (Number(wallet.balance) < grossAmount) throw new Error("Insufficient balance");
      await tx.wallet.update({ where: { userId }, data: { balance: new Prisma.Decimal(Number(wallet.balance) - grossAmount) } });
      await tx.holding.upsert({
        where: { userId_artistId: { userId, artistId } },
        create: { userId, artistId, quantity },
        update: { quantity: { increment: quantity } },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: "BUY",
          amount: new Prisma.Decimal(-grossAmount),
          balanceAfter: new Prisma.Decimal(Number(wallet.balance) - grossAmount),
          referenceType: "trade",
          referenceId: artistId,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}-wallet` : null,
        },
      });
    } else {
      if (!holding || holding.quantity < quantity) throw new Error("Cannot oversell holdings");
      grossAmount = proceedsToSell(supplyBefore, quantity, params);
      await tx.wallet.update({ where: { userId }, data: { balance: { increment: new Prisma.Decimal(grossAmount) } } });
      await tx.holding.update({ where: { userId_artistId: { userId, artistId } }, data: { quantity: { decrement: quantity } } });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: "SELL",
          amount: new Prisma.Decimal(grossAmount),
          balanceAfter: new Prisma.Decimal(Number(wallet.balance) + grossAmount),
          referenceType: "trade",
          referenceId: artistId,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}-wallet` : null,
        },
      });
    }

    await tx.artist.update({ where: { id: artistId }, data: { supply: supplyAfter } });
    const trade = await tx.trade.create({
      data: { userId, artistId, side, quantity, grossAmount, supplyBefore, supplyAfter, idempotencyKey },
    });
    return trade;
  });
};
