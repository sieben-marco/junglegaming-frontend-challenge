import { Star } from 'lucide-react';
import { cn } from 'cn';

interface RatingStarsProps {
  /** Nota média de 0 a 5 (ex.: 4.8). */
  average: number;
  className?: string;
}

/**
 * Nota em estrelas.
 *
 * Acessibilidade: as estrelas são decorativas (`aria-hidden`) e a informação
 * real vai num `<span class="sr-only">` — nada de "★★★★☆" sendo lido como
 * caracteres soltos.
 */
export function RatingStars({ average, className }: RatingStarsProps) {
  const filled = Math.round(average);
  const percentage = Math.max(0, Math.min(100, Math.round((average / 5) * 100)));

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <span className="sr-only">{`Avaliação média ${average.toFixed(1)} de 5`}</span>
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              'size-4',
              index < filled ? 'fill-primary text-primary' : 'text-muted-foreground',
            )}
          />
        ))}
      </span>
      <span aria-hidden className="sr-only">{`${percentage}%`}</span>
    </span>
  );
}
