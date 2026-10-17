import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import type { PurchaseFeedback } from '../use-purchase-actions';

/**
 * Mensagem de feedback das ações de compra/favorito.
 *
 * `aria-live="polite"`: leitores de tela anunciam a mudança sem interromper o
 * usuário. Erros usam `role="alert"` para serem anunciados imediatamente.
 */
export function PurchaseFeedbackMessage({ feedback }: { feedback: PurchaseFeedback | null }) {
  if (!feedback) return null;

  return (
    <p
      aria-live="polite"
      role={feedback.tone === 'error' ? 'alert' : undefined}
      className={cn('text-sm', feedback.tone === 'error' ? 'text-destructive' : 'text-primary')}
    >
      {feedback.message}{' '}
      {feedback.tone === 'success' ? (
        <Link to="/carrinho" className="underline underline-offset-4">
          Ver carrinho
        </Link>
      ) : null}
    </p>
  );
}
