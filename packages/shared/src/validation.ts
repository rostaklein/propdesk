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
