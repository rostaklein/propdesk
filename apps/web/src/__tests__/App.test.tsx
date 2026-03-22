import { describe, it, expect } from 'vitest';
import { isLoggedIn, getToken, setToken, clearToken } from '../lib/auth';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(key => delete store[key]); },
  length: 0,
  key: () => null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Auth utilities', () => {
  it('should return null when no token set', () => {
    clearToken();
    expect(getToken()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  it('should store and retrieve token', () => {
    setToken('test-token');
    expect(getToken()).toBe('test-token');
    expect(isLoggedIn()).toBe(true);
  });

  it('should clear token', () => {
    setToken('test-token');
    clearToken();
    expect(getToken()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});
