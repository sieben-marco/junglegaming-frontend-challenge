import { ChevronDown, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'cn';
import type { User } from '@/types/auth';
import { useLogout } from '../queries';

/**
 * Menu do usuário logado (no header).
 *
 * O Figma não desenha o header autenticado, então seguimos a linguagem do resto
 * do app: um "avatar" com as iniciais, o nome (escondido em telas pequenas, para
 * não apertar o header) e um menu com quem está logado + Sair.
 *
 * A limpeza do CACHE PRIVADO acontece no `useLogout` (não aqui): carrinho e
 * favoritos eram do usuário que saiu e não podem continuar visíveis.
 */
export function UserMenu({ user }: { user: User }) {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu da conta de ${user.displayName}`}
        className={cn(
          'flex items-center gap-2 rounded-lg py-1.5 pr-2 pl-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        )}
      >
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
        >
          {initialsOf(user.displayName)}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{user.displayName}</span>
        <ChevronDown aria-hidden className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-sm font-medium text-foreground">
              {user.displayName}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut aria-hidden />
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Iniciais para o "avatar" (até duas palavras: "Ana Souza" → "AS"). */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
