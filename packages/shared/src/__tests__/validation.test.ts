import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, createPropertySchema, createPhaseSchema } from '../validation.js';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'owner',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });
});

describe('createPropertySchema', () => {
  it('accepts valid property', () => {
    const result = createPropertySchema.safeParse({ name: 'My House' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createPropertySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('createPhaseSchema', () => {
  it('accepts valid phase', () => {
    const result = createPhaseSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Interior Phase 1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = createPhaseSchema.safeParse({
      propertyId: 'not-a-uuid',
      name: 'Phase 1',
    });
    expect(result.success).toBe(false);
  });
});
