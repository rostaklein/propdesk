import { z } from 'zod';
import { Language, UserRole, PhaseStatus, ProblemSeverity, ProblemStatus } from './enums.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum([UserRole.OWNER, UserRole.ADVISOR, UserRole.DEVELOPER]),
  language: z.enum([Language.CS, Language.EN]).default('cs'),
});

export const updateLanguageSchema = z.object({
  language: z.enum([Language.CS, Language.EN]),
});

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().optional(),
});

export const updatePropertySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  developerId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
});

export const createPhaseSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Phase name is required'),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePhaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum([PhaseStatus.UPCOMING, PhaseStatus.ACTIVE, PhaseStatus.COMPLETED]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreatePhaseInput = z.infer<typeof createPhaseSchema>;
export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;

// Problem schemas
export const createProblemSchema = z.object({
  phaseId: z.string().uuid(),
  propertyId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  room: z.string().min(1, 'Room is required'),
  locationDetail: z.string().optional(),
  severity: z.enum([ProblemSeverity.MINOR, ProblemSeverity.MEDIUM, ProblemSeverity.HIGH, ProblemSeverity.CRITICAL]).default('medium'),
  fixByDate: z.string().optional(), // ISO date string
});

export const updateProblemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  room: z.string().min(1).optional(),
  locationDetail: z.string().optional(),
  severity: z.enum([ProblemSeverity.MINOR, ProblemSeverity.MEDIUM, ProblemSeverity.HIGH, ProblemSeverity.CRITICAL]).optional(),
  fixByDate: z.string().nullable().optional(),
});

export const updateProblemStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([ProblemStatus.OPEN, ProblemStatus.IN_PROGRESS, ProblemStatus.RESOLVED, ProblemStatus.VERIFIED, ProblemStatus.WONT_FIX]),
});

export const listProblemsSchema = z.object({
  propertyId: z.string().uuid(),
  phaseId: z.string().uuid().optional(),
  status: z.enum([ProblemStatus.OPEN, ProblemStatus.IN_PROGRESS, ProblemStatus.RESOLVED, ProblemStatus.VERIFIED, ProblemStatus.WONT_FIX]).optional(),
  severity: z.enum([ProblemSeverity.MINOR, ProblemSeverity.MEDIUM, ProblemSeverity.HIGH, ProblemSeverity.CRITICAL]).optional(),
  room: z.string().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  problemId: z.string().uuid(),
  body: z.string().min(1, 'Comment body is required'),
  isResolution: z.boolean().default(false),
});

export const updateCommentSchema = z.object({
  id: z.string().uuid(),
  body: z.string().min(1).optional(),
  isResolution: z.boolean().optional(),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type UpdateProblemStatusInput = z.infer<typeof updateProblemStatusSchema>;
export type ListProblemsInput = z.infer<typeof listProblemsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
