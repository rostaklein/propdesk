import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, updateLanguageSchema, createPropertySchema, createPhaseSchema } from '../validation.js';

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
  it('accepts valid registration with language', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'owner',
      language: 'cs',
    });
    expect(result.success).toBe(true);
  });

  it('defaults language to cs when omitted', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'owner',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('cs');
    }
  });

  it('accepts en language', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'advisor',
      language: 'en',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'owner',
      language: 'de',
    });
    expect(result.success).toBe(false);
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

describe('updateLanguageSchema', () => {
  it('accepts cs', () => {
    const result = updateLanguageSchema.safeParse({ language: 'cs' });
    expect(result.success).toBe(true);
  });

  it('accepts en', () => {
    const result = updateLanguageSchema.safeParse({ language: 'en' });
    expect(result.success).toBe(true);
  });

  it('rejects unsupported language', () => {
    const result = updateLanguageSchema.safeParse({ language: 'fr' });
    expect(result.success).toBe(false);
  });

  it('rejects missing language', () => {
    const result = updateLanguageSchema.safeParse({});
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
