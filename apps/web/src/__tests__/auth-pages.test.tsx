import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '../lib/trpc';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import i18n from '../lib/i18n';

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

describe('LoginPage', () => {
  it('renders login form in Czech by default', () => {
    i18n.changeLanguage('cs');
    render(<LoginPage />, { wrapper: Wrapper });
    expect(screen.getByText('Přihlaste se ke svému účtu')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Heslo')).toBeInTheDocument();
  });

  it('renders login form in English', () => {
    i18n.changeLanguage('en');
    render(<LoginPage />, { wrapper: Wrapper });
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('has link to register page', () => {
    i18n.changeLanguage('cs');
    render(<LoginPage />, { wrapper: Wrapper });
    expect(screen.getByText('Registrovat se')).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('renders registration form with language selector', () => {
    i18n.changeLanguage('cs');
    render(<RegisterPage />, { wrapper: Wrapper });
    expect(screen.getByText('Vytvořte si účet')).toBeInTheDocument();
    expect(screen.getByLabelText('Jméno')).toBeInTheDocument();
    expect(screen.getByLabelText('Jazyk')).toBeInTheDocument();
  });

  it('shows role options', () => {
    i18n.changeLanguage('cs');
    render(<RegisterPage />, { wrapper: Wrapper });
    expect(screen.getByText('Vlastník')).toBeInTheDocument();
    expect(screen.getByText('Technický poradce')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('shows language options', () => {
    i18n.changeLanguage('cs');
    render(<RegisterPage />, { wrapper: Wrapper });
    const languageSelect = screen.getByLabelText('Jazyk');
    expect(languageSelect).toBeInTheDocument();
    expect(screen.getAllByText('Čeština').length).toBeGreaterThan(0);
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
  });
});
