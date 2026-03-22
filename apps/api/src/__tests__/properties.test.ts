import { describe, it, expect, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { appRouter } from '../routers/index.js';
import type { Context } from '../trpc.js';

function createMockDb() {
  return {
    query: {
      users: { findFirst: vi.fn(), findMany: vi.fn() },
      properties: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      phases: { findFirst: vi.fn(), findMany: vi.fn() },
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

describe('properties.list', () => {
  it('returns properties for authenticated user', async () => {
    const mockProps = [{ id: 'p1', name: 'House 1' }];
    const db = createMockDb();
    (db.query.properties.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockProps);

    const result = await caller({ db, user: ownerUser }).properties.list();
    expect(result).toEqual(mockProps);
  });

  it('throws when not authenticated', async () => {
    const db = createMockDb();
    await expect(caller({ db, user: null }).properties.list()).rejects.toThrow(TRPCError);
  });
});

describe('properties.byId', () => {
  it('returns a property by id', async () => {
    const mockProp = { id: 'p1', name: 'House 1' };
    const db = createMockDb();
    (db.query.properties.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockProp);

    const result = await caller({ db, user: ownerUser }).properties.byId({ id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result).toEqual(mockProp);
  });

  it('throws NOT_FOUND for missing property', async () => {
    const db = createMockDb();
    (db.query.properties.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      caller({ db, user: ownerUser }).properties.byId({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('properties.create', () => {
  it('allows owner to create a property', async () => {
    const mockProp = { id: 'p1', name: 'New House', ownerId: 'uuid-1' };
    const db = createMockDb();
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockProp]),
      }),
    });

    const result = await caller({ db, user: ownerUser }).properties.create({ name: 'New House' });
    expect(result.name).toBe('New House');
  });

  it('rejects non-owner from creating', async () => {
    const db = createMockDb();
    await expect(
      caller({ db, user: advisorUser }).properties.create({ name: 'House' }),
    ).rejects.toThrow(TRPCError);
  });
});
