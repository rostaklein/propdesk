import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Database } from './db/index.js';

export type Context = {
  db: Database;
  user: { id: string; email: string; role: string } | null;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
