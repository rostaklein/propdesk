export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function setLanguage(lang: string): void {
  localStorage.setItem('language', lang);
}

export function getLanguage(): string {
  return localStorage.getItem('language') || 'cs';
}
