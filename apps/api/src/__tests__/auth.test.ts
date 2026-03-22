import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { appRouter } from '../routers/index.js';
import type { Context } from '../trpc.js';

function createMockDb(overrides: Record<string, unknown> = {}) {
  return {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      properties: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      phases: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
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
    ...overrides,
  } as unknown as Context['db'];
}

const caller = appRouter.createCaller;

describe('auth.register', () => {
  it('creates a new user and returns token', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@example.com', name: 'Test', role: 'owner', language: 'cs' };
    const db = createMockDb();
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      }),
    });

    const ctx: Context = { db, user: null };
    const result = await caller(ctx).auth.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test',
      role: 'owner',
      language: 'cs',
    });

    expect(result.user).toEqual(mockUser);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('defaults language to cs', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@example.com', name: 'Test', role: 'owner', language: 'cs' };
    const db = createMockDb();
    const valuesFn = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([mockUser]),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: valuesFn });

    const ctx: Context = { db, user: null };
    await caller(ctx).auth.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test',
      role: 'owner',
    });

    const insertedValues = valuesFn.mock.calls[0][0];
    expect(insertedValues.language).toBe('cs');
  });

  it('rejects duplicate email', async () => {
    const db = createMockDb();
    (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' });

    const ctx: Context = { db, user: null };
    await expect(
      caller(ctx).auth.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test',
        role: 'owner',
      }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('auth.login', () => {
  it('returns user with language and token on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const mockUser = {
      id: 'uuid-1',
      email: 'test@example.com',
      name: 'Test',
      role: 'owner',
      language: 'en',
      passwordHash,
    };
    const db = createMockDb();
    (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    const ctx: Context = { db, user: null };
    const result = await caller(ctx).auth.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user.language).toBe('en');
    expect(result.token).toBeDefined();
  });

  it('rejects invalid password', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const db = createMockDb();
    (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'uuid-1', email: 'test@example.com', passwordHash,
    });

    const ctx: Context = { db, user: null };
    await expect(
      caller(ctx).auth.login({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow(TRPCError);
  });

  it('rejects unknown email', async () => {
    const db = createMockDb();
    const ctx: Context = { db, user: null };
    await expect(
      caller(ctx).auth.login({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toThrow(TRPCError);
  });
});

describe('auth.me', () => {
  it('returns current user with language', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@example.com', name: 'Test', role: 'owner', language: 'cs', createdAt: new Date() };
    const db = createMockDb();
    (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    const ctx: Context = { db, user: { id: 'uuid-1', email: 'test@example.com', role: 'owner' } };
    const result = await caller(ctx).auth.me();

    expect(result.language).toBe('cs');
    expect(result.email).toBe('test@example.com');
  });

  it('throws UNAUTHORIZED when not logged in', async () => {
    const db = createMockDb();
    const ctx: Context = { db, user: null };
    await expect(caller(ctx).auth.me()).rejects.toThrow(TRPCError);
  });
});

describe('auth.updateLanguage', () => {
  it('updates user language', async () => {
    const db = createMockDb();
    const returningFn = vi.fn().mockResolvedValue([{ id: 'uuid-1', language: 'en' }]);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: returningFn }),
      }),
    });

    const ctx: Context = { db, user: { id: 'uuid-1', email: 'test@example.com', role: 'owner' } };
    const result = await caller(ctx).auth.updateLanguage({ language: 'en' });

    expect(result.language).toBe('en');
  });

  it('throws UNAUTHORIZED when not logged in', async () => {
    const db = createMockDb();
    const ctx: Context = { db, user: null };
    await expect(
      caller(ctx).auth.updateLanguage({ language: 'cs' }),
    ).rejects.toThrow(TRPCError);
  });
});
