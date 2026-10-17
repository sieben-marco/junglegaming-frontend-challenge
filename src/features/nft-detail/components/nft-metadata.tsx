import { AtSign, Mail, Send, Share2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { formatList, truncateAddress } from '@/lib/format';
import type { Nft } from '@/types/nft';

/**
 * Bloco de metadados do NFT: ID do token, coleção, atributos, contrato e
 * compartilhamento.
 *
 * Sobre os ícones de compartilhar: o `lucide-react` removeu ícones de marca, então
 * usamos ícones genéricos com `aria-label` dizendo o destino. Os links são
 * intents REAIS (abrem a janela de compartilhamento da rede) — nada de botão que
 * "finge" funcionar.
 */
export function NftMetadata({ nft }: { nft: Nft }) {
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;
  const shareText = `Confira ${nft.name} #${nft.number} no Kurio`;

  const shareLinks = [
    {
      label: 'Compartilhar no X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      Icon: Send,
    },
    {
      label: 'Compartilhar no Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      Icon: AtSign,
    },
    {
      label: 'Compartilhar no LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      Icon: Share2,
    },
    {
      label: 'Compartilhar por e-mail',
      href: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}: ${shareUrl}`)}`,
      Icon: Mail,
    },
  ];

  const rows = [
    { label: 'ID do token', value: `#${nft.tokenId}` },
    { label: 'Coleção', value: nft.collectionName },
    { label: 'Atributos', value: formatList(nft.attributes) },
    { label: 'Contrato', value: truncateAddress(nft.contractAddress) },
  ];

  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-2">
            <dt className="text-muted-foreground">{row.label}:</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Compartilhar este NFT:</p>
        <ul className="flex items-center gap-2">
          {shareLinks.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                title={label}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }), 'rounded-full')}
              >
                <Icon aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
