import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../lib/i18n';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to Czech', () => {
    expect(i18n.language).toBe('cs');
  });

  it('has Czech translations', () => {
    i18n.changeLanguage('cs');
    expect(i18n.t('common.logout')).toBe('Odhlásit se');
    expect(i18n.t('auth.signIn')).toBe('Přihlásit se');
    expect(i18n.t('properties.title')).toBe('Nemovitosti');
    expect(i18n.t('phases.active')).toBe('Aktivní');
  });

  it('has English translations', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('common.logout')).toBe('Logout');
    expect(i18n.t('auth.signIn')).toBe('Sign in');
    expect(i18n.t('properties.title')).toBe('Properties');
    expect(i18n.t('phases.active')).toBe('Active');
  });

  it('switches between languages', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('auth.createAccount')).toBe('Create account');

    i18n.changeLanguage('cs');
    expect(i18n.t('auth.createAccount')).toBe('Vytvořit účet');
  });

  it('falls back to Czech for missing keys', () => {
    i18n.changeLanguage('cs');
    const csValue = i18n.t('common.appName');
    i18n.changeLanguage('en');
    const enValue = i18n.t('common.appName');
    // Both should have PropDesk
    expect(csValue).toBe('PropDesk');
    expect(enValue).toBe('PropDesk');
  });
});
