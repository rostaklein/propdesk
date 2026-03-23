import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createCommentSchema, updateCommentSchema } from '@propdesk/shared';
import { router, protectedProcedure } from '../trpc.js';
import { comments, users } from '../db/schema.js';

export const commentsRouter = router({
  list: protectedProcedure.input(z.object({ problemId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const results = await ctx.db
      .select({
        comment: comments,
        author: { id: users.id, name: users.name, email: users.email },
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.problemId, input.problemId))
      .orderBy(comments.createdAt);

    return results.map((r) => ({
      ...r.comment,
      author: r.author,
    }));
  }),

  create: protectedProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
    // All roles can add comments
    const [comment] = await ctx.db.insert(comments).values({
      problemId: input.problemId,
      authorId: ctx.user.id,
      body: input.body,
      isResolution: input.isResolution,
    }).returning();
    return comment;
  }),

  update: protectedProcedure.input(updateCommentSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.comments.findFirst({ where: eq(comments.id, input.id) });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
    }
    // Only the author can edit their own comment
    if (existing.authorId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own comments' });
    }
    const { id, ...data } = input;
    const [comment] = await ctx.db.update(comments).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(comments.id, id)).returning();
    return comment;
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.comments.findFirst({ where: eq(comments.id, input.id) });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
    }
    if (existing.authorId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own comments' });
    }
    await ctx.db.delete(comments).where(eq(comments.id, input.id));
    return { success: true };
  }),
});
