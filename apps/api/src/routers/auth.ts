import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { loginSchema, registerSchema, updateLanguageSchema } from '@propdesk/shared';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { users } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export const authRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const [user] = await ctx.db.insert(users).values({
      email: input.email,
      name: input.name,
      role: input.role,
      language: input.language,
      passwordHash,
    }).returning({ id: users.id, email: users.email, name: users.name, role: users.role, language: users.language });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language },
      token,
    };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: { id: true, email: true, name: true, role: true, language: true, createdAt: true },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    return user;
  }),

  updateLanguage: protectedProcedure.input(updateLanguageSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db.update(users)
      .set({ language: input.language, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id))
      .returning({ id: users.id, language: users.language });
    return updated;
  }),
});
