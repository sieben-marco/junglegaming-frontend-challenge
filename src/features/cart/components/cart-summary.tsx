import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { LoaderCircle, Tag } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiError } from '@/lib/api-error';
import { formatEthLabel } from '@/lib/eth';
import { cn } from 'cn';
import type { Cart } from '@/types/cart';
import { useApplyCoupon, useRemoveCoupon } from '../queries';

/**
 * Resumo da carteira: cupom + subtotal/desconto/taxa/total + CTA de finalizar.
 *
 * Os valores NÃO são calculados aqui: vêm de `cart.totals`, ou seja, da resposta
 * da API (o servidor é a referência da cotação, como pede o enunciado).
 */
export function CartSummary({ cart }: { cart: Cart }) {
  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

  function handleApply(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!code.trim()) {
      setCouponError('Informe o código promocional.');
      return;
    }

    setCouponError(null);
    applyCoupon.mutate(
      { code },
      {
        onSuccess: () => setCode(''),
        onError: (error) => setCouponError(getApiError(error).message),
      },
    );
  }

  return (
    <aside
      aria-label="Resumo da carteira"
      className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-5"
    >
      <div className="space-y-3">
        {cart.coupon ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
            <p className="flex items-center gap-2 text-sm">
              <Tag aria-hidden className="size-4 text-primary" />
              <span className="font-medium text-primary">{cart.coupon.code}</span>
              <span className="text-muted-foreground">· {cart.coupon.label}</span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removeCoupon.isPending}
              onClick={() => removeCoupon.mutate()}
            >
              Remover
            </Button>
          </div>
        ) : (
          <form noValidate className="space-y-2" onSubmit={handleApply}>
            <Label htmlFor="coupon-code">Código promocional</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                name="coupon"
                value={code}
                autoComplete="off"
                placeholder="Digite o código promocional…"
                aria-invalid={couponError ? true : undefined}
                aria-describedby={couponError ? 'coupon-error' : undefined}
                onChange={(event) => setCode(event.target.value)}
              />
              <Button type="submit" variant="outline" disabled={applyCoupon.isPending} className="shrink-0 gap-2">
                {applyCoupon.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
                Aplicar
              </Button>
            </div>
            {couponError ? (
              <p id="coupon-error" role="alert" className="text-xs text-destructive">
                {couponError}
              </p>
            ) : null}
          </form>
        )}
      </div>

      {/* `aria-live` avisa que o resumo mudou (cupom, quantidade, preço). */}
      <dl aria-live="polite" className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatEthLabel(cart.totals.subtotalEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Desconto do lançamento</dt>
          <dd>(-) {formatEthLabel(cart.totals.discountEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">
            Taxa de rede
            <span className="block text-xs">Taxa estimada</span>
          </dt>
          <dd>{formatEthLabel(cart.totals.networkFeeEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-base">
          <dt className="font-medium">Total</dt>
          <dd className="font-semibold text-primary">{formatEthLabel(cart.totals.totalEth)}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        <Link
          to="/entrar"
          search={{ redirect: '/carrinho' }}
          className={cn(buttonVariants({ size: 'lg' }), 'w-full gap-2 text-xs tracking-wider uppercase')}
        >
          Conectar e finalizar
        </Link>
        <Link
          to="/mercado"
          className="block text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Continuar explorando
        </Link>
      </div>
    </aside>
  );
}
