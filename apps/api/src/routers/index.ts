import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { propertiesRouter } from './properties.js';
import { phasesRouter } from './phases.js';
import { problemsRouter } from './problems.js';
import { commentsRouter } from './comments.js';

export const appRouter = router({
  auth: authRouter,
  properties: propertiesRouter,
  phases: phasesRouter,
  problems: problemsRouter,
  comments: commentsRouter,
});

export type AppRouter = typeof appRouter;
