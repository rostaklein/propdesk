import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import { appRouter } from './routers/index.js';
import { db } from './db/index.js';
import type { Context } from './trpc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

const app = express();
app.use(cors());

app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: async ({ req }): Promise<Context> => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    let user: Context['user'] = null;
    if (token) {
      try {
        user = jwt.verify(token, JWT_SECRET) as Context['user'];
      } catch {
        // invalid token — treat as unauthenticated
      }
    }
    return { db, user };
  },
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const webDist = path.resolve(__dirname, '../../../apps/web/dist');
  app.use(express.static(webDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export { appRouter, type Context };
