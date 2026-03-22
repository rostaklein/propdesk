import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createPhaseSchema, updatePhaseSchema } from '@propdesk/shared';
import { router, protectedProcedure } from '../trpc.js';
import { phases } from '../db/schema.js';

export const phasesRouter = router({
  list: protectedProcedure.input(z.object({ propertyId: z.string().uuid() })).query(async ({ ctx, input }) => {
    return ctx.db.query.phases.findMany({
      where: eq(phases.propertyId, input.propertyId),
      orderBy: (phases, { asc }) => [asc(phases.sortOrder)],
    });
  }),

  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const phase = await ctx.db.query.phases.findFirst({
      where: eq(phases.id, input.id),
    });
    if (!phase) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Phase not found' });
    }
    return phase;
  }),

  create: protectedProcedure.input(createPhaseSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'owner') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can manage phases' });
    }
    const [phase] = await ctx.db.insert(phases).values({
      propertyId: input.propertyId,
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
    }).returning();
    return phase;
  }),

  update: protectedProcedure.input(updatePhaseSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'owner') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can manage phases' });
    }
    const { id, ...data } = input;
    const [phase] = await ctx.db.update(phases).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(phases.id, id)).returning();
    if (!phase) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Phase not found' });
    }
    return phase;
  }),
});
