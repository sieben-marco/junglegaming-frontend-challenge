import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from 'cn';

/**
 * O "chrome" do modal de autenticação (o mesmo desenho para Entrar e Criar
 * conta, como no Figma): abas no topo, X para fechar, texto de apoio, o
 * formulário no meio, o bloco "Ou continue com" e a faixa laranja na base.
 *
 * Por que um componente só: o Figma repete essa moldura nas duas telas. Assim o
 * login e o cadastro cuidam apenas dos SEUS campos.
 *
 * Acessibilidade: é um diálogo de verdade (Base UI) — foco preso enquanto
 * aberto, `Esc` e X para fechar, foco devolvido a quem abriu e um nome acessível
 * (`DialogTitle`). As "abas" são LINKS entre rotas (`/entrar` e `/cadastro`),
 * não `role="tab"`: cada uma leva a outra PÁGINA, e o correto aí é
 * `aria-current="page"` no item ativo (um `tab` prometeria painéis na mesma
 * tela).
 */

export type AuthMode = 'login' | 'register';

const MODE_TITLE: Record<AuthMode, string> = {
  login: 'Entrar',
  register: 'Criar conta',
};

const MODE_DESCRIPTION: Record<AuthMode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  register: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
};

const SOCIAL_NOTE_ID = 'auth-social-note';

interface AuthModalProps {
  mode: AuthMode;
  /** `redirect` da URL: manter nas abas para não perder o fluxo de retomada. */
  redirect: string;
  /** Chamado para sair do modal (X, `Esc`, clique no fundo). */
  onLeave: () => void;
  children: ReactNode;
}

export function AuthModal({ mode, redirect, onLeave, children }: AuthModalProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onLeave();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-xl border border-border/60 bg-card p-0 sm:max-w-[490px]"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <nav aria-label="Entrar ou criar conta" className="flex items-center gap-3">
            <AuthTab mode="login" active={mode === 'login'} redirect={redirect} />
            <span aria-hidden className="h-4 w-px bg-border" />
            <AuthTab mode="register" active={mode === 'register'} redirect={redirect} />
          </nav>

          {/* O título acessível do diálogo acompanha a aba ativa. */}
          <DialogTitle className="sr-only">{MODE_TITLE[mode]}</DialogTitle>

          <button
            type="button"
            onClick={onLeave}
            aria-label="Fechar"
            className="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X aria-hidden />
          </button>
        </div>

        <DialogDescription className="px-6 pt-2 text-center text-sm text-muted-foreground">
          {MODE_DESCRIPTION[mode]}
        </DialogDescription>

        <div className="px-6 py-5">
          {children}

          <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span aria-hidden className="h-px flex-1 bg-border" />
            <span>Ou continue com</span>
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>

          {/*
            Login social: o Figma mostra Google e Facebook, mas integrar
            provedores reais está fora do escopo. Os botões ficam DESABILITADOS
            de propósito — um botão que "não faz nada" aparentando funcionar
            seria um fluxo falso.
            TODO(asset): ícones de marca (Google/Facebook) — aguardando o dev.
          */}
          <div className="mt-3 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled
              aria-describedby={SOCIAL_NOTE_ID}
            >
              Continuar com Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled
              aria-describedby={SOCIAL_NOTE_ID}
            >
              Continuar com Facebook
            </Button>
            <p id={SOCIAL_NOTE_ID} className="sr-only">
              O login social não está disponível nesta demonstração; use e-mail e senha.
            </p>
          </div>
        </div>

        {/* A "faixa" laranja na base do modal, como no Figma. */}
        <div aria-hidden className="h-1.5 w-full bg-primary" />
      </DialogContent>
    </Dialog>
  );
}

interface AuthTabProps {
  mode: AuthMode;
  active: boolean;
  redirect: string;
}

function AuthTab({ mode, active, redirect }: AuthTabProps) {
  return (
    <Link
      to={mode === 'login' ? '/entrar' : '/cadastro'}
      search={{ redirect }}
      replace
      aria-current={active ? 'page' : undefined}
      className={cn(
        'border-b-2 pb-1 text-base font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {MODE_TITLE[mode]}
    </Link>
  );
}
