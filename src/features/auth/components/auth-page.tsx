import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCurrentUser } from '../queries';
import { safeRedirect } from '../redirect';
import { AuthModal, type AuthMode } from './auth-modal';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

/**
 * Tela de autenticação (Entrar OU Criar conta).
 *
 * Segue o Figma: um MODAL sobre a página, não uma página "solta". As duas telas
 * compartilham a mesma moldura (`AuthModal`) e diferem nos campos — então a rota
 * `/entrar` e a rota `/cadastro` só escolhem o `mode`.
 *
 * Fluxos que este componente resolve:
 *  - `redirect` volta para onde a pessoa estava (ex.: o NFT que ela tentou
 *    favoritar) depois de entrar;
 *  - quem JÁ está autenticado não fica aqui: o modal do Figma existe para o
 *    VISITANTE, então saímos na hora.
 */

interface AuthPageProps {
  mode: AuthMode;
  /** `redirect` da URL: para onde voltar depois de entrar. */
  redirect: string;
}

export function AuthPage({ mode, redirect }: AuthPageProps) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const target = safeRedirect(redirect);

  useEffect(() => {
    if (!user) return;
    void navigate({ to: target, replace: true });
  }, [user, target, navigate]);

  function leave(): void {
    void navigate({ to: target, replace: true });
  }

  return (
    <AuthModal mode={mode} redirect={redirect} onLeave={leave}>
      {mode === 'login' ? (
        <LoginForm onAuthenticated={leave} />
      ) : (
        <RegisterForm onAuthenticated={leave} />
      )}
    </AuthModal>
  );
}
