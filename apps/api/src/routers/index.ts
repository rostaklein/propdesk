import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { propertiesRouter } from './properties.js';
import { phasesRouter } from './phases.js';

export const appRouter = router({
  auth: authRouter,
  properties: propertiesRouter,
  phases: phasesRouter,
});

export type AppRouter = typeof appRouter;
