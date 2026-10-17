import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';

/** Estado vazio do carrinho (com atalho para o mercado). */
export function CartEmpty() {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-6 py-16 text-center"
    >
      <ShoppingCart aria-hidden className="size-8 text-muted-foreground" />
      <h2 className="text-lg font-medium">Seu carrinho está vazio</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Explore o mercado e adicione NFTs para começar sua coleção.
      </p>
      <Link to="/mercado" className={cn(buttonVariants({ variant: 'outline' }), 'mt-1')}>
        Explorar o mercado
      </Link>
    </div>
  );
}
