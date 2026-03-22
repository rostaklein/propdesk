import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://propdesk:propdesk@localhost:5432/propdesk';
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

const password = await bcrypt.hash('password123', 10);

// --- Users (one per role) ---
console.log('Seeding users...');
const [owner, advisor, developer] = await Promise.all([
  db.insert(schema.users).values({ email: 'owner@propdesk.cz', name: 'Jan Novák', role: 'owner', passwordHash: password }).onConflictDoNothing({ target: schema.users.email }).returning(),
  db.insert(schema.users).values({ email: 'advisor@propdesk.cz', name: 'Marie Dvořáková', role: 'advisor', passwordHash: password }).onConflictDoNothing({ target: schema.users.email }).returning(),
  db.insert(schema.users).values({ email: 'developer@propdesk.cz', name: 'Petr Stavitel', role: 'developer', passwordHash: password }).onConflictDoNothing({ target: schema.users.email }).returning(),
]);

const ownerId = owner[0]?.id;
const advisorId = advisor[0]?.id;
const developerId = developer[0]?.id;

if (!ownerId || !advisorId || !developerId) {
  console.log('Users already exist, skipping remaining seed.');
  await client.end();
  process.exit(0);
}

console.log('  owner: owner@propdesk.cz');
console.log('  advisor: advisor@propdesk.cz');
console.log('  developer: developer@propdesk.cz');

// --- Properties ---
console.log('Seeding properties...');
const [prop1] = await db.insert(schema.properties).values([
  { name: 'Vinohrady Residence', address: 'Vinohradská 42, Praha 2', developerId, ownerId },
  { name: 'Karlín Lofts', address: 'Křižíkova 88, Praha 8', developerId, ownerId },
]).returning();

console.log(`  ${prop1.name} + Karlín Lofts`);

// --- Phases ---
console.log('Seeding phases...');
const [phase1, phase2, phase3] = await db.insert(schema.phases).values([
  { propertyId: prop1.id, name: 'Pre-inspection', sortOrder: 0, status: 'completed' as const },
  { propertyId: prop1.id, name: 'Rough inspection', sortOrder: 1, status: 'active' as const },
  { propertyId: prop1.id, name: 'Final walkthrough', sortOrder: 2, status: 'upcoming' as const },
]).returning();

console.log(`  3 phases for ${prop1.name}`);

// --- Problems ---
console.log('Seeding problems...');
const [problem1, problem2] = await db.insert(schema.problems).values([
  {
    phaseId: phase2.id,
    propertyId: prop1.id,
    reportedBy: ownerId,
    title: 'Cracked tile in bathroom',
    description: 'Large crack running through floor tile near shower drain.',
    room: 'Bathroom',
    locationDetail: 'Floor, near shower drain',
    severity: 'high' as const,
    status: 'open' as const,
  },
  {
    phaseId: phase2.id,
    propertyId: prop1.id,
    reportedBy: advisorId,
    title: 'Paint peeling on living room wall',
    description: 'Paint is bubbling and peeling on the north-facing wall, possible moisture issue.',
    room: 'Living room',
    locationDetail: 'North wall, upper section',
    severity: 'medium' as const,
    status: 'in_progress' as const,
  },
  {
    phaseId: phase1.id,
    propertyId: prop1.id,
    reportedBy: ownerId,
    title: 'Minor scratch on kitchen countertop',
    room: 'Kitchen',
    severity: 'minor' as const,
    status: 'resolved' as const,
  },
]).returning();

console.log('  3 problems');

// --- Comments ---
console.log('Seeding comments...');
await db.insert(schema.comments).values([
  {
    problemId: problem1.id,
    authorId: developerId,
    body: 'Tile replacement scheduled for next week. Will need to match the existing pattern.',
    isResolution: false,
  },
  {
    problemId: problem2.id,
    authorId: advisorId,
    body: 'Moisture readings taken — levels are elevated. Recommend checking plumbing behind wall before repainting.',
    isResolution: false,
  },
  {
    problemId: problem2.id,
    authorId: developerId,
    body: 'Plumber inspected — small leak found and fixed. Wall will be dried and repainted.',
    isResolution: true,
  },
]);

console.log('  3 comments');

// --- Audit log ---
console.log('Seeding audit log...');
await db.insert(schema.auditLog).values([
  {
    entityType: 'problem',
    entityId: problem1.id,
    action: 'created',
    actorId: ownerId,
    changes: { title: 'Cracked tile in bathroom' },
  },
  {
    entityType: 'problem',
    entityId: problem2.id,
    action: 'status_changed',
    actorId: developerId,
    changes: { from: 'open', to: 'in_progress' },
  },
]);

console.log('  2 audit log entries');

console.log('\nSeed complete! Password for all users: password123');
await client.end();
