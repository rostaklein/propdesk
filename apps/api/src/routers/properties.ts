import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createPropertySchema, updatePropertySchema } from '@propdesk/shared';
import { router, protectedProcedure } from '../trpc.js';
import { properties } from '../db/schema.js';

export const propertiesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.properties.findMany({
      orderBy: (properties, { desc }) => [desc(properties.createdAt)],
    });
  }),

  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const property = await ctx.db.query.properties.findFirst({
      where: eq(properties.id, input.id),
    });
    if (!property) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found' });
    }
    return property;
  }),

  create: protectedProcedure.input(createPropertySchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'owner') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can create properties' });
    }
    const [property] = await ctx.db.insert(properties).values({
      name: input.name,
      address: input.address,
      ownerId: ctx.user.id,
    }).returning();
    return property;
  }),

  update: protectedProcedure.input(updatePropertySchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'owner') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can update properties' });
    }
    const { id, ...data } = input;
    const [property] = await ctx.db.update(properties).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(properties.id, id)).returning();
    if (!property) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found' });
    }
    return property;
  }),
});
