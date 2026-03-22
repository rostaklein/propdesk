import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { CreateTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '@propdesk/api/src/routers/index';

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      transformer: superjson,
      headers() {
        const token = localStorage.getItem('token');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
