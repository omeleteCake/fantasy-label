import { Prisma, PrismaClient } from '@prisma/client';
import { PricingService } from './pricing.service';

const prisma = new PrismaClient();

export class MarketService {
  static async buyArtist(userId: string, artistId: string, quantity: number) {
    PricingService.validateQuantity(quantity);

    return prisma.$transaction(async (tx) => {
      const [wallet, artist] = await Promise.all([
        tx.wallet.findUnique({
          where: { userId },
        }),
        tx.artist.findUnique({
          where: { id: artistId },
        }),
      ]);

      if (!wallet) throw new Error('Wallet not found.');
      if (!artist) throw new Error('Artist not found.');

      const quote = PricingService.getBuyQuote(
        {
          basePrice: Number(artist.basePrice),
          k: Number(artist.k),
          supply: artist.circulatingSupply,
        },
        quantity,
      );

      if (Number(wallet.cashBalance) < quote.totalCost) {
        throw new Error('Insufficient cash balance.');
      }

      const existingHolding = await tx.holding.findUnique({
        where: {
          userId_artistId: {
            userId,
            artistId,
          },
        },
      });

      const existingQty = existingHolding?.quantity ?? 0;
      const existingPrincipal = Number(existingHolding?.avgCost ?? 0) * existingQty;
      const newQty = existingQty + quantity;
      const newPrincipal = existingPrincipal + quote.grossCost;
      const newAvgCost = newPrincipal / newQty;

      const nextCash = Number(wallet.cashBalance) - quote.totalCost;
      if (nextCash < 0) {
        throw new Error('Negative cash balances are not allowed.');
      }

      await Promise.all([
        tx.wallet.update({
          where: { id: wallet.id },
          data: { cashBalance: new Prisma.Decimal(nextCash) },
        }),
        tx.artist.update({
          where: { id: artistId },
          data: { circulatingSupply: artist.circulatingSupply + quantity },
        }),
        tx.holding.upsert({
          where: {
            userId_artistId: {
              userId,
              artistId,
            },
          },
          update: {
            quantity: newQty,
            avgCost: new Prisma.Decimal(newAvgCost),
          },
          create: {
            userId,
            artistId,
            quantity,
            avgCost: new Prisma.Decimal(quote.grossCost / quantity),
          },
        }),
        tx.trade.create({
          data: {
            userId,
            artistId,
            side: 'BUY',
            quantity,
            price: new Prisma.Decimal(quote.unitPrice),
            grossAmount: new Prisma.Decimal(quote.grossCost),
            feeAmount: new Prisma.Decimal(quote.fee),
          },
        }),
      ]);

      await tx.walletLedgerEntry.createMany({
        data: [
          {
            userId,
            walletId: wallet.id,
            amount: new Prisma.Decimal(-quote.grossCost),
            entryType: 'TRADE_PRINCIPAL',
            side: 'DEBIT',
            referenceType: 'TRADE',
            metadata: { artistId, quantity, action: 'BUY' },
          },
          {
            userId,
            walletId: wallet.id,
            amount: new Prisma.Decimal(-quote.fee),
            entryType: 'TRADE_FEE',
            side: 'DEBIT',
            referenceType: 'TRADE',
            metadata: { artistId, quantity, action: 'BUY' },
          },
        ],
      });

      return quote;
    });
  }

  static async sellArtist(userId: string, artistId: string, quantity: number) {
    PricingService.validateQuantity(quantity);

    return prisma.$transaction(async (tx) => {
      const [wallet, artist, holding] = await Promise.all([
        tx.wallet.findUnique({
          where: { userId },
        }),
        tx.artist.findUnique({
          where: { id: artistId },
        }),
        tx.holding.findUnique({
          where: {
            userId_artistId: {
              userId,
              artistId,
            },
          },
        }),
      ]);

      if (!wallet) throw new Error('Wallet not found.');
      if (!artist) throw new Error('Artist not found.');
      if (!holding || holding.quantity < quantity) {
        throw new Error('Insufficient holdings to sell.');
      }
      if (artist.circulatingSupply < quantity) {
        throw new Error('Cannot reduce circulating supply below zero.');
      }

      const quote = PricingService.getSellQuote(
        {
          basePrice: Number(artist.basePrice),
          k: Number(artist.k),
          supply: artist.circulatingSupply,
        },
        quantity,
      );

      const nextSupply = artist.circulatingSupply - quantity;
      if (nextSupply < 0) {
        throw new Error('Negative circulating supply is not allowed.');
      }

      const nextCash = Number(wallet.cashBalance) + quote.netProceeds;
      if (nextCash < 0) {
        throw new Error('Negative cash balances are not allowed.');
      }

      const nextQty = holding.quantity - quantity;
      const holdingPrincipal = Number(holding.avgCost) * holding.quantity;
      const principalReduction = Number(holding.avgCost) * quantity;
      const remainingPrincipal = Math.max(0, holdingPrincipal - principalReduction);
      const nextAvgCost = nextQty > 0 ? remainingPrincipal / nextQty : 0;

      await Promise.all([
        tx.wallet.update({
          where: { id: wallet.id },
          data: { cashBalance: new Prisma.Decimal(nextCash) },
        }),
        tx.artist.update({
          where: { id: artistId },
          data: { circulatingSupply: nextSupply },
        }),
        tx.trade.create({
          data: {
            userId,
            artistId,
            side: 'SELL',
            quantity,
            price: new Prisma.Decimal(quote.unitPrice),
            grossAmount: new Prisma.Decimal(quote.grossProceeds),
            feeAmount: new Prisma.Decimal(quote.fee),
          },
        }),
      ]);

      if (nextQty === 0) {
        await tx.holding.delete({
          where: { id: holding.id },
        });
      } else {
        await tx.holding.update({
          where: { id: holding.id },
          data: {
            quantity: nextQty,
            avgCost: new Prisma.Decimal(nextAvgCost),
          },
        });
      }

      await tx.walletLedgerEntry.createMany({
        data: [
          {
            userId,
            walletId: wallet.id,
            amount: new Prisma.Decimal(quote.grossProceeds),
            entryType: 'TRADE_PRINCIPAL',
            side: 'CREDIT',
            referenceType: 'TRADE',
            metadata: { artistId, quantity, action: 'SELL' },
          },
          {
            userId,
            walletId: wallet.id,
            amount: new Prisma.Decimal(-quote.fee),
            entryType: 'TRADE_FEE',
            side: 'DEBIT',
            referenceType: 'TRADE',
            metadata: { artistId, quantity, action: 'SELL' },
          },
        ],
      });

      return quote;
    });
  }
}
