import { cn } from 'cn';

/** Hash simples e estável: mesma string ⇒ mesma cor (placeholder consistente). */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface NftImageProps {
  nft: NftImageSource;
  className?: string;
}

/**
 * Campos mínimos para desenhar a arte. Definido ESTRUTURALMENTE (e não como
 * `Nft`) para podermos reusar o componente com itens do carrinho, que carregam
 * só o necessário (nome, número e imagem).
 */
export interface NftImageSource {
  id: string;
  name: string;
  number: string;
  imageUrl?: string;
}

/**
 * Arte do NFT.
 *
 * Se o NFT tiver `imageUrl`, mostramos a imagem. Caso contrário (assets ainda
 * não fornecidos pelo dev — ver AGENTS.md > regra 9) usamos um placeholder
 * determinístico. `role="img"` + `aria-label` garantem alternativa textual.
 */
export function NftImage({ nft, className }: NftImageProps) {
  const label = `Arte digital ${nft.name} #${nft.number}`;

  if (nft.imageUrl) {
    return <img src={nft.imageUrl} alt={label} loading="lazy" className={cn('size-full object-cover', className)} />;
  }

  // Fallback: só aparece quando o NFT vem SEM imageUrl (hoje todos têm).
  const hue = hashString(nft.id) % 360;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex size-full items-center justify-center', className)}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 55% 30%), hsl(${(hue + 45) % 360} 45% 14%))`,
      }}
    >
      <span aria-hidden className="text-2xl font-semibold tracking-widest text-white/20 select-none">
        {nft.name.charAt(0)}
        {nft.number.slice(0, 1)}
      </span>
    </div>
  );
}
