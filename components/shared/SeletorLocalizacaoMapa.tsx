'use client';

import { useEffect, useRef, useState } from 'react';
import {
  carregarGoogleMapsScript,
  type GoogleMapInstance,
} from '@/utils/google-maps-client';
import type { EnderecoIdentificado } from '@/utils/google-maps';

export interface ResultadoLocalizacaoMapa {
  latitude: number;
  longitude: number;
  endereco: EnderecoIdentificado | null;
}

interface SeletorLocalizacaoMapaProps {
  latitudeInicial?: number | null;
  longitudeInicial?: number | null;
  onLocalizacaoConfirmada: (resultado: ResultadoLocalizacaoMapa) => void;
  altura?: number;
  // Quando true, ignora `altura` e faz o mapa preencher 100% da altura do
  // elemento pai (que precisa ter uma altura definida — ex: um flex item
  // com flex-1 dentro de um container de altura fixa). Usado no modal em
  // tela cheia do checkout.
  preencherAltura?: boolean;
}

const CENTRO_PADRAO_BRASIL = { lat: -14.235, lng: -51.9253 };

async function identificarEndereco(latitude: number, longitude: number): Promise<EnderecoIdentificado | null> {
  try {
    const resposta = await fetch('/api/geocode/reverso', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });
    if (!resposta.ok) {
      return null;
    }
    const body = await resposta.json();
    return body?.endereco ?? null;
  } catch (error) {
    console.error('Falha ao identificar endereço a partir do mapa:', error);
    return null;
  }
}

export function SeletorLocalizacaoMapa({
  latitudeInicial,
  longitudeInicial,
  onLocalizacaoConfirmada,
  altura = 220,
  preencherAltura = false,
}: SeletorLocalizacaoMapaProps) {
  const mapaElementoRef = useRef<HTMLDivElement | null>(null);
  const mapaInstanciaRef = useRef<GoogleMapInstance | null>(null);
  const onLocalizacaoConfirmadaRef = useRef(onLocalizacaoConfirmada);

  useEffect(() => {
    onLocalizacaoConfirmadaRef.current = onLocalizacaoConfirmada;
  });

  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [enderecoAtual, setEnderecoAtual] = useState<EnderecoIdentificado | null>(null);
  const [erro, setErro] = useState('');

  const confirmarPosicao = async (lat: number, lng: number) => {
    setBuscandoEndereco(true);
    const endereco = await identificarEndereco(lat, lng);
    setBuscandoEndereco(false);
    setEnderecoAtual(endereco);
    onLocalizacaoConfirmadaRef.current({ latitude: lat, longitude: lng, endereco });
  };

  const centralizarNaLocalizacaoAtual = () => {
    if (!navigator.geolocation || !mapaInstanciaRef.current) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapaInstanciaRef.current?.setCenter({ lat: latitude, lng: longitude });
        mapaInstanciaRef.current?.setZoom(17);
        void confirmarPosicao(latitude, longitude);
      },
      (error) => console.error('Falha ao obter localização atual:', error)
    );
  };

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const { Map } = await carregarGoogleMapsScript();
        if (!ativo || !mapaElementoRef.current) {
          if (ativo) setEstado('indisponivel');
          return;
        }

        const temCoordenadaInicial = typeof latitudeInicial === 'number' && typeof longitudeInicial === 'number';
        const posicaoInicial = temCoordenadaInicial
          ? { lat: latitudeInicial as number, lng: longitudeInicial as number }
          : CENTRO_PADRAO_BRASIL;

        const mapa = new Map(mapaElementoRef.current, {
          center: posicaoInicial,
          zoom: temCoordenadaInicial ? 17 : 4,
          // Um dedo já arrasta o mapa — evita o aviso "use dois dedos para
          // mover o mapa", já que aqui o mapa é sempre o elemento interativo
          // principal da tela, não um mapa embutido numa página que também
          // precisa rolar.
          gestureHandling: 'greedy',
        });

        mapaInstanciaRef.current = mapa;

        // Padrão "pino fixo" (estilo Uber/iFood): o pino é um elemento HTML
        // sempre centralizado na tela — é o mapa que se move por baixo
        // dele. A posição final é lida do centro do mapa, não de um marker.
        mapa.addListener('dragend', () => {
          const centro = mapa.getCenter();
          if (!centro) return;
          void confirmarPosicao(centro.lat(), centro.lng());
        });

        setEstado('pronto');

        if (temCoordenadaInicial) {
          void confirmarPosicao(latitudeInicial as number, longitudeInicial as number);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!ativo) return;
              const { latitude, longitude } = position.coords;
              mapa.setCenter({ lat: latitude, lng: longitude });
              mapa.setZoom(17);
              void confirmarPosicao(latitude, longitude);
            },
            () => {
              // Permissão negada ou indisponível: mapa fica no centro
              // padrão e o usuário move o mapa manualmente até o pino
              // ficar sobre o endereço certo.
            }
          );
        }
      } catch (error) {
        console.error('Falha ao carregar mapa interativo:', error);
        if (ativo) {
          setEstado('indisponivel');
          setErro(error instanceof Error ? error.message : 'Mapa indisponível.');
        }
      }
    }

    void iniciar();

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={preencherAltura ? 'flex h-full flex-col gap-2' : 'space-y-2'}>
      <div
        className={
          preencherAltura
            ? 'relative w-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100'
            : 'relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100'
        }
        style={preencherAltura ? undefined : { height: altura }}
      >
        <div ref={mapaElementoRef} className="h-full w-full" />
        {estado === 'pronto' ? (
          // Pino "estilo Uber": fica sempre fixo no centro da tela — é o
          // mapa que se move por baixo dele (ver listener 'dragend' acima).
          // A ponta do pino é ancorada exatamente no centro (translate
          // -50%/-100% posiciona a ponta, não o meio do ícone, no ponto).
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
            <svg className="h-9 w-9 drop-shadow-md" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.5 11.32 7.24 11.99a1.06 1.06 0 0 0 1.52 0C13.5 21.32 20 15.25 20 10c0-4.42-3.58-8-8-8z"
                fill="#18181B"
              />
              <circle cx="12" cy="10" r="3.25" fill="white" />
            </svg>
          </div>
        ) : null}
      </div>
      {estado === 'carregando' ? <p className="text-xs text-zinc-400">Carregando mapa...</p> : null}
      {estado === 'indisponivel' ? (
        <p className="text-xs text-red-600">{erro || 'Mapa indisponível no momento. Preencha o endereço manualmente.'}</p>
      ) : null}
      {estado === 'pronto' ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={centralizarNaLocalizacaoAtual}
            className="text-[11px] font-semibold text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
          >
            Usar minha localização atual
          </button>
          {buscandoEndereco ? <span className="text-[11px] text-zinc-400">Identificando endereço...</span> : null}
        </div>
      ) : null}
      {enderecoAtual?.formatado && estado === 'pronto' ? (
        <p className="text-xs text-zinc-500">{enderecoAtual.formatado}</p>
      ) : null}
    </div>
  );
}
