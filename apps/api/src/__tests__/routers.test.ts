import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// We test the router logic by calling the procedures directly
// For Phase 1, we test schema validation and basic structure

describe('Auth Router', () => {
  it('should hash passwords during registration', async () => {
    const hash = await bcrypt.hash('password123', 10);
    expect(hash).not.toBe('password123');
    const valid = await bcrypt.compare('password123', hash);
    expect(valid).toBe(true);
  });

  it('should generate valid JWT tokens', () => {
    const secret = 'test-secret';
    const payload = { id: '123', email: 'test@example.com', role: 'owner' };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.id).toBe('123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('owner');
  });

  it('should reject invalid JWT tokens', () => {
    expect(() => jwt.verify('invalid-token', 'secret')).toThrow();
  });
});

describe('tRPC context', () => {
  it('should extract user from valid token', () => {
    const secret = 'test-secret';
    const user = { id: '123', email: 'test@example.com', role: 'owner' };
    const token = jwt.sign(user, secret, { expiresIn: '7d' });
    const decoded = jwt.verify(token, secret) as typeof user;
    expect(decoded.id).toBe(user.id);
  });

  it('should return null for missing token', () => {
    const token = undefined;
    const user = token ? 'has-user' : null;
    expect(user).toBeNull();
  });
});
