import { useState } from 'react';
import type { Nft, NftEdition, NftEditionId } from '@/types/nft';

/**
 * Estado de compra do detalhe (edição + quantidade).
 *
 * Fica num hook para que o PAINEL (desktop) e a BARRA FIXA (mobile) compartilhem
 * a MESMA seleção — sem duplicar estado nem sincronizar na mão.
 *
 * O componente que usa este hook deve receber `key={nft.id}`: assim, ao trocar
 * de NFT, o estado reinicia sozinho (padrão recomendado pelo React, em vez de
 * "sincronizar props com estado" dentro de um efeito).
 */
export interface PurchaseSelection {
  editions: NftEdition[];
  edition: NftEdition;
  /** Troca a edição e reinicia a quantidade. */
  selectEdition: (editionId: NftEditionId) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  /** Maior quantidade comprável na edição atual (0 = esgotada). */
  maxQuantity: number;
  isSoldOut: boolean;
}

/** Edição inicial: a primeira com estoque; se todas esgotaram, a primeira. */
function pickDefaultEdition(nft: Nft): NftEdition {
  return nft.editions.find((edition) => edition.available > 0) ?? nft.editions[0];
}

export function usePurchaseSelection(nft: Nft): PurchaseSelection {
  const [editionId, setEditionId] = useState(() => pickDefaultEdition(nft).id);
  const [rawQuantity, setRawQuantity] = useState(1);

  const edition = nft.editions.find((item) => item.id === editionId) ?? pickDefaultEdition(nft);

  // O "limite de quantidade" do enunciado é o MENOR entre o estoque e o teto
  // por pedido daquela edição.
  const maxQuantity = Math.min(edition.available, edition.maxPerOrder);
  const isSoldOut = maxQuantity <= 0;

  // Mantemos sempre um valor exibível (>= 1), mesmo esgotado.
  const upperBound = Math.max(1, maxQuantity);
  const quantity = Math.min(Math.max(1, rawQuantity), upperBound);

  function selectEdition(nextId: NftEditionId): void {
    setEditionId(nextId);
    setRawQuantity(1);
  }

  function setQuantity(value: number): void {
    setRawQuantity(Math.min(Math.max(1, Math.trunc(value)), upperBound));
  }

  return {
    editions: nft.editions,
    edition,
    selectEdition,
    quantity,
    setQuantity,
    maxQuantity,
    isSoldOut,
  };
}
