import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PagePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Página temporária usada enquanto cada tela do desafio não é implementada.
 * Deixa claro que a área ainda não está pronta (não simula funcionalidade).
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">Kurio</p>
      <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
      <p className="max-w-prose text-muted-foreground">{description}</p>
      <Link to="/" className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}>
        Voltar ao início
      </Link>
    </section>
  );
}
