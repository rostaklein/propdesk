import { describe, it, expect, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { appRouter } from '../routers/index.js';
import type { Context } from '../trpc.js';

function createMockDb() {
  return {
    query: {
      users: { findFirst: vi.fn(), findMany: vi.fn() },
      properties: { findFirst: vi.fn(), findMany: vi.fn() },
      phases: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  } as unknown as Context['db'];
}

const caller = appRouter.createCaller;
const ownerUser = { id: 'uuid-1', email: 'owner@test.com', role: 'owner' };
const advisorUser = { id: 'uuid-2', email: 'advisor@test.com', role: 'advisor' };
const propertyId = '550e8400-e29b-41d4-a716-446655440000';

describe('phases.list', () => {
  it('returns phases for a property', async () => {
    const mockPhases = [{ id: 'ph1', name: 'Phase 1', propertyId }];
    const db = createMockDb();
    (db.query.phases.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPhases);

    const result = await caller({ db, user: ownerUser }).phases.list({ propertyId });
    expect(result).toEqual(mockPhases);
  });

  it('throws when not authenticated', async () => {
    const db = createMockDb();
    await expect(
      caller({ db, user: null }).phases.list({ propertyId }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('phases.create', () => {
  it('allows owner to create a phase', async () => {
    const mockPhase = { id: 'ph1', name: 'Phase 1', propertyId, sortOrder: 0 };
    const db = createMockDb();
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockPhase]),
      }),
    });

    const result = await caller({ db, user: ownerUser }).phases.create({
      propertyId,
      name: 'Phase 1',
    });
    expect(result.name).toBe('Phase 1');
  });

  it('rejects non-owner from creating', async () => {
    const db = createMockDb();
    await expect(
      caller({ db, user: advisorUser }).phases.create({ propertyId, name: 'Phase 1' }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('phases.update', () => {
  it('allows owner to update a phase', async () => {
    const mockPhase = { id: 'ph1', name: 'Updated', status: 'active' };
    const db = createMockDb();
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPhase]),
        }),
      }),
    });

    const result = await caller({ db, user: ownerUser }).phases.update({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'active',
    });
    expect(result.status).toBe('active');
  });

  it('rejects non-owner from updating', async () => {
    const db = createMockDb();
    await expect(
      caller({ db, user: advisorUser }).phases.update({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
      }),
    ).rejects.toThrow(TRPCError);
  });
});
