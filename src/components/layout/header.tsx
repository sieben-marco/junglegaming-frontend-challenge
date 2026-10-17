import { Link } from '@tanstack/react-router';
import { LogIn, Menu, Search, ShoppingCart } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Início', to: '/' },
  { label: 'Mercado', to: '/mercado' },
  { label: 'Criadores', to: '/criadores' },
  { label: 'Aprenda', to: '/aprenda' },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          aria-label="Kurio — página inicial"
          className="text-lg font-semibold tracking-[0.3em] text-foreground"
        >
          KURIO
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Buscar">
            <Search />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Carrinho" className="relative">
            <ShoppingCart />
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              0
            </span>
          </Button>
          <Link to="/entrar" className={cn(buttonVariants(), 'ml-1 gap-2')}>
            <LogIn />
            <span className="hidden sm:inline">Entrar</span>
            <span className="sr-only sm:hidden">Entrar</span>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Abrir menu" className="md:hidden">
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
}
