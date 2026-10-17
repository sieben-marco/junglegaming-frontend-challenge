import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PriceRange } from '@/types/nft';

interface PriceRangeFilterProps {
  /** Limites absolutos (vêm da API). */
  bounds: PriceRange;
  /** Valores aplicados (vêm da URL). */
  valueMin: number | undefined;
  valueMax: number | undefined;
  /** Sufixo para ids únicos quando o mesmo filtro aparece 2× (desktop/mobile). */
  idPrefix: string;
  onApply: (min: number, max: number) => void;
}

/**
 * Filtro de faixa de preço (min/max).
 *
 * Simplificação em relação ao Figma: usamos dois sliders nativos empilhados em
 * vez de um slider de dois "polegares". Ganhamos acessibilidade de teclado de
 * graça e mantemos a leitura "Preço: X - Y ETH" + botão "Aplicar".
 *
 * O "rascunho" (min/max locais) é sincronizado com a URL pelo PAI, que remonta
 * o componente via `key` quando os valores aplicados mudam — por isso não há
 * efeitos de sincronização aqui.
 */
export function PriceRangeFilter({ bounds, valueMin, valueMax, idPrefix, onApply }: PriceRangeFilterProps) {
  const [min, setMin] = useState(valueMin ?? bounds.min);
  const [max, setMax] = useState(valueMax ?? bounds.max);

  const step = 0.1;
  const minId = `${idPrefix}-price-min`;
  const maxId = `${idPrefix}-price-max`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Preço:{' '}
        <span className="font-medium text-foreground">
          {min.toFixed(2)} - {max.toFixed(2)} ETH
        </span>
      </p>

      <div className="space-y-1">
        <label htmlFor={minId} className="sr-only">
          Preço mínimo
        </label>
        <input
          id={minId}
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={min}
          onChange={(event) => setMin(Math.min(Number(event.target.value), max))}
          className="w-full accent-primary"
        />
        <label htmlFor={maxId} className="sr-only">
          Preço máximo
        </label>
        <input
          id={maxId}
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={max}
          onChange={(event) => setMax(Math.max(Number(event.target.value), min))}
          className="w-full accent-primary"
        />
      </div>

      <Button size="sm" variant="outline" className="w-full" onClick={() => onApply(min, max)}>
        Aplicar
      </Button>
    </div>
  );
}
