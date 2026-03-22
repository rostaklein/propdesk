import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL || 'postgresql://propdesk:propdesk@localhost:5432/propdesk';
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

console.log('Running migrations...');
await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
console.log('Migrations complete.');
await client.end();
