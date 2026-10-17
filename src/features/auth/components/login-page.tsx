import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useCurrentUser } from '../queries';
import { safeRedirect } from '../redirect';
import { LoginForm } from './login-form';

/**
 * Tela de login.
 *
 * Segue o Figma: um MODAL sobre a página (não uma página "solta"). Usamos o
 * `Dialog` do Base UI porque ele já resolve o que o enunciado cobra de
 * acessibilidade num diálogo: foco preso dentro do modal enquanto está aberto,
 * `Esc` para fechar, foco devolvido ao elemento anterior e `role="dialog"` com
 * nome acessível.
 */

interface LoginPageProps {
  /** `redirect` da URL: para onde voltar depois de entrar. */
  redirect: string;
}

export function LoginPage({ redirect }: LoginPageProps) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const target = safeRedirect(redirect);

  // Quem JÁ está autenticado não tem o que fazer aqui (o modal do Figma existe
  // para o visitante): volta direto para o fluxo anterior.
  useEffect(() => {
    if (!user) return;
    void navigate({ to: target, replace: true });
  }, [user, target, navigate]);

  function leave(): void {
    void navigate({ to: target, replace: true });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // Fechar (X, Esc ou clique no fundo) = desistir de entrar e voltar para
        // o fluxo anterior — nunca "sumir" com a tela.
        if (!open) leave();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-xl border border-border/60 bg-card p-0 sm:max-w-[490px]"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <DialogTitle className="text-base font-semibold text-primary">Entrar</DialogTitle>
          <button
            type="button"
            onClick={leave}
            aria-label="Fechar"
            className="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X aria-hidden />
          </button>
        </div>

        <DialogDescription className="px-6 pt-2 text-center text-sm text-muted-foreground">
          Entre para gerenciar sua carteira, coleção e perfil de criador.
        </DialogDescription>

        <div className="px-6 py-5">
          <LoginForm onAuthenticated={leave} />
        </div>

        {/*
          A "faixa" laranja na base do modal, como no Figma.
        */}
        <div aria-hidden className="h-1.5 w-full bg-primary" />
      </DialogContent>
    </Dialog>
  );
}
