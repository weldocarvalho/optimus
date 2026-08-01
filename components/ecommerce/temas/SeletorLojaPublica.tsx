// components/ecommerce/temas/SeletorLojaPublica.tsx
//
// Ponto único de decisão de qual visual renderizar para a vitrine pública
// de uma loja (app/[slug]/page.tsx). A resolução segue esta ordem:
//
//   1. A loja tem um componente construído sob medida para o seu slug?
//      -> usa esse componente (maior prioridade).
//   2. Senão, o tipo de negócio da loja tem um template visual padrão?
//      -> usa o template padrão daquele tipo.
//   3. Senão -> usa a Hamburgueria como template genérico de fallback,
//      para nunca deixar uma loja sem vitrine renderizável.
//
// Isso é puramente uma escolha de apresentação: os dados (produtos,
// restaurante) continuam sempre isolados por restaurante_id/slug — este
// seletor não lê nem cruza dados entre lojas.
import type { ComponentType, ReactElement } from 'react';
import type { ItemCardapio } from '@/types/database';
import { normalizarTipoRestaurante, type TipoRestaurante } from '@/utils/tipos-restaurante';
import ComponenteLojaHamburguer from '@/components/ecommerce/ComponenteLojaHamburguer';
import ComponenteLojaAcai from '@/components/ecommerce/ComponenteLojaAcai';
import ComponenteLojaSorveteria from '@/components/ecommerce/ComponenteLojaSorveteria';
import ComponenteLojaSushiBar from '@/components/ecommerce/ComponenteLojaSushiBar';
import ComponenteLojaFitness from '@/components/ecommerce/ComponenteLojaFitness';
import ComponenteLojaRestauranteTradicional from '@/components/ecommerce/ComponenteLojaRestauranteTradicional';
import ComponenteLojaGeovannaAcaiteria from '@/components/ecommerce/lojas/ComponenteLojaGeovannaAcaiteria';
import ComponenteLojaPastelECia from '@/components/ecommerce/lojas/ComponenteLojaPastelECia';
import ComponenteLojaNamiSushiBar from '@/components/ecommerce/lojas/ComponenteLojaNamiSushiBar';
import ComponenteLojaNaturaz from '@/components/ecommerce/lojas/ComponenteLojaNaturaz';
import ComponenteLojaWcsAcaiteria from '@/components/ecommerce/lojas/ComponenteLojaWcsAcaiteria';

export interface RestaurantePropsLoja {
  id: string;
  nome: string;
  endereco: string | null;
}

export interface ComponenteLojaProps {
  restaurante: RestaurantePropsLoja;
  produtos: ItemCardapio[];
}

type ComponenteLoja = ComponentType<ComponenteLojaProps>;

/**
 * Lojas com cardápio construído sob medida (componente React dedicado,
 * não reaproveitado por nenhuma outra loja). Chave = slug exato da loja.
 */
const LOJAS_CUSTOMIZADAS: Record<string, ComponenteLoja> = {
  'geovanna-acaiteria': ComponenteLojaGeovannaAcaiteria,
  'pastel-e-cia': ComponenteLojaPastelECia,
  'nami-sushi-bar': ComponenteLojaNamiSushiBar,
  naturaz: ComponenteLojaNaturaz,
  'wcs-acaiteria': ComponenteLojaWcsAcaiteria,
};

/**
 * Templates visuais padrão por segmento de negócio. Tipos sem entrada aqui
 * caem no fallback (Hamburgueria) até ganharem um template próprio.
 */
const TEMPLATES_POR_TIPO: Partial<Record<TipoRestaurante, ComponenteLoja>> = {
  ACAITERIA: ComponenteLojaAcai,
  HAMBURGUERIA: ComponenteLojaHamburguer,
  SORVETERIA: ComponenteLojaSorveteria,
  SUSHI_BAR: ComponenteLojaSushiBar,
  FITNESS_SAUDAVEL: ComponenteLojaFitness,
  RESTAURANTE_TRADICIONAL: ComponenteLojaRestauranteTradicional,
};

function obterComponenteLojaPublica(slug: string, tipo: string | null | undefined): ComponenteLoja {
  const componenteCustomizado = LOJAS_CUSTOMIZADAS[slug];
  if (componenteCustomizado) {
    return componenteCustomizado;
  }

  const tipoNormalizado = normalizarTipoRestaurante(tipo);
  return TEMPLATES_POR_TIPO[tipoNormalizado] ?? ComponenteLojaHamburguer;
}

/**
 * Função auxiliar (não é um componente React — nome em minúsculo de
 * propósito) que resolve e já renderiza a vitrine correta para o slug/tipo
 * informados. Manter a resolução + renderização aqui, fora do corpo do
 * Server Component que a chama, evita escolher dinamicamente um componente
 * dentro de um render (padrão sinalizado pelo lint react-hooks/static-components).
 */
export function renderizarLojaPublica(props: {
  slug: string;
  tipo: string | null | undefined;
  restaurante: RestaurantePropsLoja;
  produtos: ItemCardapio[];
}): ReactElement {
  const Componente = obterComponenteLojaPublica(props.slug, props.tipo);
  return <Componente restaurante={props.restaurante} produtos={props.produtos} />;
}
