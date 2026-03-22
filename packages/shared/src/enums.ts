export const UserRole = {
  OWNER: 'owner',
  ADVISOR: 'advisor',
  DEVELOPER: 'developer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PhaseStatus = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;
export type PhaseStatus = (typeof PhaseStatus)[keyof typeof PhaseStatus];

export const ProblemSeverity = {
  MINOR: 'minor',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type ProblemSeverity = (typeof ProblemSeverity)[keyof typeof ProblemSeverity];

export const ProblemStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  VERIFIED: 'verified',
  WONT_FIX: 'wont_fix',
} as const;
export type ProblemStatus = (typeof ProblemStatus)[keyof typeof ProblemStatus];
