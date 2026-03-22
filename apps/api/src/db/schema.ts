import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['owner', 'advisor', 'developer']);
export const phaseStatusEnum = pgEnum('phase_status', ['upcoming', 'active', 'completed']);
export const problemSeverityEnum = pgEnum('problem_severity', ['minor', 'medium', 'high', 'critical']);
export const problemStatusEnum = pgEnum('problem_status', ['open', 'in_progress', 'resolved', 'verified', 'wont_fix']);

export const languageEnum = pgEnum('language', ['cs', 'en']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('owner'),
  language: languageEnum('language').notNull().default('cs'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  developerId: uuid('developer_id').references(() => users.id),
  ownerId: uuid('owner_id').references(() => users.id),
  floorPlanUrl: text('floor_plan_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const phases = pgTable('phases', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  status: phaseStatusEnum('status').notNull().default('upcoming'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  phaseId: uuid('phase_id').references(() => phases.id).notNull(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  reportedBy: uuid('reported_by').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  room: text('room').notNull(),
  locationDetail: text('location_detail'),
  severity: problemSeverityEnum('severity').notNull().default('medium'),
  status: problemStatusEnum('status').notNull().default('open'),
  fixByDate: timestamp('fix_by_date', { mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const problemPhotos = pgTable('problem_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id').references(() => problems.id).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id').references(() => problems.id).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  body: text('body').notNull(),
  isResolution: boolean('is_resolution').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  actorId: uuid('actor_id').references(() => users.id),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
