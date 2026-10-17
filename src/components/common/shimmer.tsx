import { cn } from 'cn';
import type { ComponentProps } from 'react';

/**
 * Bloco de carregamento com efeito "shimmer".
 *
 * O enunciado exige skeletons com shimmer no catálogo, detalhe e resumo do
 * carrinho. O efeito é definido em `src/index.css` (classe `.shimmer`) e
 * desligado automaticamente quando o usuário prefere movimento reduzido.
 *
 * `aria-hidden`: é puramente decorativo — quem usa leitor de tela recebe o
 * estado de carregamento por outros meios (ex.: `aria-busy` na região).
 */
export function Shimmer({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden data-slot="shimmer" className={cn('shimmer rounded-md bg-muted', className)} {...props} />;
}
