import { ConflictError, NotFoundError, ValidationError } from '../errors.js';

const unique = (values) => [...new Set(values)];

export class LineupService {
  constructor(db, clock = () => new Date()) {
    this.db = db;
    this.clock = clock;
  }

  nowUtcIso() {
    return this.clock().toISOString();
  }

  getCurrentWeek() {
    const week = this.db.findCurrentWeek(this.nowUtcIso());
    if (!week) {
      throw new NotFoundError('No active week.');
    }
    return week;
  }

  getUserLineup(userId, weekId) {
    this.validateLineupOwnership(userId, weekId);
    const lineup = this.db.findLineup(userId, weekId);
    if (!lineup) {
      return {
        userId,
        weekId,
        artistIds: [],
        submittedAt: null,
        lockedAt: null,
      };
    }

    return {
      ...lineup,
      artistIds: this.db.getLineupArtistIds(lineup.id),
    };
  }

  saveLineup(userId, weekId, artistIds) {
    this.validateLineupOwnership(userId, weekId);
    const normalized = this.normalizeArtists(artistIds, { requireFive: false });

    const existing = this.db.findLineup(userId, weekId);
    if (existing?.lockedAt) {
      throw new ConflictError('Lineup is locked and cannot be edited.');
    }

    const lineup = this.db.upsertLineup(userId, weekId, normalized);
    return {
      ...lineup,
      artistIds: normalized,
    };
  }

  lockLineup(userId, weekId) {
    this.validateLineupOwnership(userId, weekId);
    const lineup = this.db.findLineup(userId, weekId);
    if (!lineup) {
      throw new ValidationError('Cannot lock lineup before saving artists.');
    }
    if (lineup.lockedAt) {
      throw new ConflictError('Lineup already locked.');
    }

    const artistIds = this.db.getLineupArtistIds(lineup.id);
    const normalized = this.normalizeArtists(artistIds, { requireFive: true });
    this.ensureOwnedArtists(userId, normalized);

    const locked = this.db.lockLineup(lineup.id, this.nowUtcIso());
    return {
      ...locked,
      artistIds: normalized,
    };
  }

  validateLineupOwnership(userId, weekId) {
    const week = this.db.findWeekById(weekId);
    if (!week) {
      throw new NotFoundError('Week not found.');
    }

    const ts = Date.parse(this.nowUtcIso());
    const lockAtTs = Date.parse(week.lockAt);
    if (!Number.isFinite(lockAtTs)) {
      throw new ValidationError('Invalid week lock timestamp.');
    }
    if (ts >= lockAtTs) {
      throw new ConflictError('Week lineup window has closed.');
    }

    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid userId is required.');
    }
    return true;
  }

  normalizeArtists(artistIds, { requireFive }) {
    if (!Array.isArray(artistIds)) {
      throw new ValidationError('artistIds must be an array.');
    }
    const deduped = unique(artistIds);
    const allStrings = deduped.every((id) => typeof id === 'string' && id.trim().length > 0);
    if (!allStrings) {
      throw new ValidationError('artistIds must contain non-empty artist IDs.');
    }
    if (deduped.length !== artistIds.length) {
      throw new ValidationError('artistIds must be unique.');
    }
    if (requireFive && deduped.length !== 5) {
      throw new ValidationError('Exactly 5 unique artists are required to lock lineup.');
    }
    if (!requireFive && deduped.length > 5) {
      throw new ValidationError('No more than 5 artists can be saved.');
    }
    return deduped;
  }

  ensureOwnedArtists(userId, artistIds) {
    const owned = this.db.ownedArtistIds(userId);
    const notOwned = artistIds.filter((id) => !owned.has(id));
    if (notOwned.length > 0) {
      throw new ValidationError('Lineup contains artists not owned by user.', { notOwned });
    }
  }
}
