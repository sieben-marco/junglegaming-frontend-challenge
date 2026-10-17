import { AtSign, Camera, Rss, Send, Share2 } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Meu perfil',
    links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    links: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
];

// Ícones genéricos: o lucide-react não possui mais ícones de marca
// (facebook/instagram/twitter...). Ver AGENTS.md > log de erros.
const SOCIAL_ICONS = [Share2, AtSign, Camera, Rss, Send];

const WALLETS = ['METAMASK', 'WALLETCONNECT', 'COINBASE'];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-sidebar">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col gap-3 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span className="font-semibold tracking-[0.3em] text-foreground">KURIO</span>
          <span>Feito para colecionadores, criadores e cultura</span>
          <span>contato@email.com</span>
          <span>+55 11 4002 8922</span>
        </div>

        <div className="grid gap-8 border-t border-border/60 py-8 sm:grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-3 font-semibold text-foreground">{column.title}</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="mb-3 font-semibold text-foreground">Redes sociais</h2>
            <ul className="flex flex-wrap gap-2">
              {SOCIAL_ICONS.map((Icon, index) => (
                <li
                  key={index}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
                >
                  <Icon className="size-4" aria-hidden />
                </li>
              ))}
            </ul>

            <h2 className="mt-6 mb-3 font-semibold text-foreground">Carteiras compatíveis</h2>
            <ul className="flex flex-wrap gap-2">
              {WALLETS.map((wallet) => (
                <li
                  key={wallet}
                  className="rounded border border-border px-2 py-1 text-[10px] tracking-wider text-muted-foreground"
                >
                  {wallet}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  );
}
