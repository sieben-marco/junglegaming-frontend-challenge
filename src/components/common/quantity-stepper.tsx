import { Minus, Plus } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  /** Desabilita tudo (ex.: item indisponível). */
  disabled?: boolean;
  /** Indica que uma alteração está em andamento (envio à API). */
  isBusy?: boolean;
  /** Contexto para leitores de tela (ex.: "Quantidade de Emerald Ape #042"). */
  label: string;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * Seletor de quantidade "-  n  +".
 *
 * Acessibilidade: os botões têm rótulo próprio ("Aumentar/Diminuir …") e o valor
 * fica num `<output>` com `aria-live`, então leitores de tela anunciam a mudança
 * sem precisar de um input numérico.
 */
export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  disabled = false,
  isBusy = false,
  label,
  onChange,
  className,
}: QuantityStepperProps) {
  const canDecrease = !disabled && !isBusy && value > min;
  const canIncrease = !disabled && !isBusy && value < max;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-0.5',
        disabled && 'opacity-60',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        aria-label={`Diminuir ${label}`}
        disabled={!canDecrease}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>

      <output
        aria-live="polite"
        aria-atomic
        className="min-w-7 text-center text-sm font-medium tabular-nums"
      >
        {value}
      </output>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        aria-label={`Aumentar ${label}`}
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
