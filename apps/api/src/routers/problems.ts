import { TRPCError } from '@trpc/server';
import { eq, and, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import {
  createProblemSchema,
  updateProblemSchema,
  updateProblemStatusSchema,
  listProblemsSchema,
} from '@propdesk/shared';
import { router, protectedProcedure } from '../trpc.js';
import { problems, users } from '../db/schema.js';

export const problemsRouter = router({
  list: protectedProcedure.input(listProblemsSchema).query(async ({ ctx, input }) => {
    const conditions: SQL[] = [eq(problems.propertyId, input.propertyId)];
    if (input.phaseId) conditions.push(eq(problems.phaseId, input.phaseId));
    if (input.status) conditions.push(eq(problems.status, input.status));
    if (input.severity) conditions.push(eq(problems.severity, input.severity));
    if (input.room) conditions.push(eq(problems.room, input.room));

    const results = await ctx.db
      .select({
        problem: problems,
        reportedByUser: { id: users.id, name: users.name, email: users.email },
      })
      .from(problems)
      .leftJoin(users, eq(problems.reportedBy, users.id))
      .where(and(...conditions))
      .orderBy(problems.createdAt);

    return results.map((r) => ({
      ...r.problem,
      reportedByUser: r.reportedByUser,
    }));
  }),

  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select({
        problem: problems,
        reportedByUser: { id: users.id, name: users.name, email: users.email },
      })
      .from(problems)
      .leftJoin(users, eq(problems.reportedBy, users.id))
      .where(eq(problems.id, input.id));

    if (!result[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Problem not found' });
    }
    return { ...result[0].problem, reportedByUser: result[0].reportedByUser };
  }),

  create: protectedProcedure.input(createProblemSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role === 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Developers cannot create problems' });
    }
    const [problem] = await ctx.db.insert(problems).values({
      phaseId: input.phaseId,
      propertyId: input.propertyId,
      reportedBy: ctx.user.id,
      title: input.title,
      description: input.description,
      room: input.room,
      locationDetail: input.locationDetail,
      severity: input.severity,
      fixByDate: input.fixByDate ? new Date(input.fixByDate) : null,
    }).returning();
    return problem;
  }),

  update: protectedProcedure.input(updateProblemSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role === 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Developers cannot edit problems' });
    }

    const existing = await ctx.db.query.problems.findFirst({ where: eq(problems.id, input.id) });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Problem not found' });
    }

    // Owners can only edit their own problems
    if (ctx.user.role === 'owner' && existing.reportedBy !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Owners can only edit their own problems' });
    }

    const { id, fixByDate, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (fixByDate !== undefined) {
      updateData.fixByDate = fixByDate ? new Date(fixByDate) : null;
    }

    const [problem] = await ctx.db.update(problems).set(updateData).where(eq(problems.id, id)).returning();
    return problem;
  }),

  updateStatus: protectedProcedure.input(updateProblemStatusSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.problems.findFirst({ where: eq(problems.id, input.id) });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Problem not found' });
    }

    const { role } = ctx.user;
    const { status } = input;

    // Permission checks per plan:
    // Mark resolved: only developer
    // Mark verified: owner or advisor
    // Reopen (back to open): owner or advisor
    if (status === 'resolved' && role !== 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only developers can mark problems as resolved' });
    }
    if (status === 'verified' && role === 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Developers cannot verify problems' });
    }
    if (status === 'open' && existing.status !== 'open' && role === 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Developers cannot reopen problems' });
    }
    if (status === 'wont_fix' && role === 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Developers cannot mark problems as won\'t fix' });
    }

    const [problem] = await ctx.db.update(problems).set({
      status,
      updatedAt: new Date(),
    }).where(eq(problems.id, input.id)).returning();
    return problem;
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role === 'developer') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Developers cannot delete problems' });
    }
    const existing = await ctx.db.query.problems.findFirst({ where: eq(problems.id, input.id) });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Problem not found' });
    }
    if (ctx.user.role === 'owner' && existing.reportedBy !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Owners can only delete their own problems' });
    }
    await ctx.db.delete(problems).where(eq(problems.id, input.id));
    return { success: true };
  }),
});
