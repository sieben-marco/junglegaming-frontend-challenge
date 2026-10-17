import { http } from '@/lib/http';
import type { AddCartItemInput, Cart, UpdateCartItemInput } from '@/types/cart';

/**
 * Acesso à API do carrinho.
 *
 * Só orquestra HTTP (Axios) e devolve dado tipado. NÃO há regra de negócio nem
 * preço calculado "na mão" aqui — quem decide isso é o "servidor" (MSW).
 */

export async function fetchCart(): Promise<Cart> {
  const { data } = await http.get<Cart>('/cart');
  return data;
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await http.post<Cart>('/cart/items', input);
  return data;
}

export async function updateCartItem(itemId: string, input: UpdateCartItemInput): Promise<Cart> {
  const { data } = await http.patch<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, input);
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await http.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`);
  return data;
}

export async function applyCoupon(code: string): Promise<Cart> {
  const { data } = await http.post<Cart>('/cart/coupon', { code });
  return data;
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await http.delete<Cart>('/cart/coupon');
  return data;
}
