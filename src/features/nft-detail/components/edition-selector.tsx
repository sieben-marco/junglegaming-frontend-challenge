import { cn } from 'cn';
import type { NftEdition, NftEditionId } from '@/types/nft';

interface EditionSelectorProps {
  editions: NftEdition[];
  selectedId: string;
  onSelect: (editionId: NftEditionId) => void;
  /** Prefixo para ids de acessibilidade quando há mais de um na tela. */
  idPrefix?: string;
}

/**
 * Seletor de edições ("1/1 | 1/10 | 1/50 | ABERTA").
 *
 * Usamos botões de ALTERNÂNCIA (`aria-pressed`) num grupo rotulado: é o padrão
 * acessível mais simples aqui — o estado "selecionado" é anunciado, edições
 * esgotadas ficam `disabled` e as restantes são alcançáveis por Tab.
 */
export function EditionSelector({ editions, selectedId, onSelect, idPrefix = 'edition' }: EditionSelectorProps) {
  return (
    <div role="group" aria-label="Edição" className="flex flex-wrap gap-2">
      {editions.map((edition) => {
        const soldOut = edition.available <= 0;
        const selected = edition.id === selectedId;

        return (
          <button
            key={edition.id}
            id={`${idPrefix}-${edition.id}`}
            type="button"
            aria-pressed={selected}
            disabled={soldOut}
            onClick={() => onSelect(edition.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              selected ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground',
              soldOut && 'cursor-not-allowed opacity-50',
            )}
          >
            {edition.label}
            {soldOut ? <span className="sr-only"> (esgotada)</span> : null}
          </button>
        );
      })}
    </div>
  );
}
