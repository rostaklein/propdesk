import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://propdesk:propdesk@localhost:5432/propdesk';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export type Database = typeof db;
