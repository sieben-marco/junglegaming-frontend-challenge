/**
 * Destino do "voltar depois de entrar" (`?redirect=`).
 *
 * Só aceitamos caminhos INTERNOS: sem esta checagem, um link como
 * `/entrar?redirect=https://site-malicioso` levaria o usuário para fora do app
 * logo após o login (o clássico *open redirect*). Também recusamos `//host`,
 * que o navegador trata como outro domínio.
 */
export function safeRedirect(redirect: string): string {
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/';
  return redirect;
}
