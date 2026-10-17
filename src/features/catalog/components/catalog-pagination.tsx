import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Monta a lista de páginas visíveis, com "buracos" (null) virando reticências. */
function buildPageItems(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const visible = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const pages = [...visible].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items: (number | null)[] = [];
  let previous = 0;
  for (const current of pages) {
    if (previous && current - previous > 1) items.push(null);
    items.push(current);
    previous = current;
  }
  return items;
}

/** Paginação do catálogo (estado mora na URL). */
export function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  const items = buildPageItems(page, totalPages);

  return (
    <nav aria-label="Paginação do catálogo" className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>

      {items.map((item, index) =>
        item === null ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg text-sm transition-colors',
              item === page
                ? 'bg-primary font-medium text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {item}
          </button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
