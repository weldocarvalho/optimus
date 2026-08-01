'use client';

// utils/google-maps-client.ts
// Carregador do script do Google Maps JavaScript API no navegador. Só deve
// ser usado a partir de componentes 'use client'. A chave usada aqui
// (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) é pública por natureza — vai parar no
// código-fonte visível da página — e por isso precisa estar restrita por
// domínio (HTTP referrer) no Google Cloud Console. NUNCA usar aqui a chave
// server-only (GOOGLE_MAPS_API_KEY) de utils/google-maps.ts.

export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleLatLng {
  lat: () => number;
  lng: () => number;
}

export interface GoogleMapInstance {
  setCenter: (posicao: GoogleLatLngLiteral) => void;
  getCenter: () => GoogleLatLng | null;
  setZoom: (zoom: number) => void;
  addListener: (evento: string, handler: (...args: unknown[]) => void) => void;
}

type GoogleMapConstructor = new (
  elemento: HTMLElement,
  opcoes: {
    center: GoogleLatLngLiteral;
    zoom: number;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    // 'greedy' faz o mapa responder a arrastar com um dedo só, sem exibir o
    // aviso "use dois dedos para mover o mapa" — apropriado aqui porque o
    // mapa é sempre o elemento interativo principal da tela nesse momento
    // (modal ou aba dedicada), não um mapa embutido competindo com o scroll
    // da página.
    gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';
  }
) => GoogleMapInstance;

export interface GoogleMapsLibraries {
  Map: GoogleMapConstructor;
}

interface GoogleMapsApi {
  maps: {
    importLibrary: (nomeBiblioteca: string) => Promise<Record<string, unknown>>;
  };
}

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let bibliotecasCarregadas: GoogleMapsLibraries | null = null;
let carregamentoEmAndamento: Promise<GoogleMapsLibraries> | null = null;

export function googleMapsDisponivel(): boolean {
  return bibliotecasCarregadas !== null;
}

export function obterChavePublicaGoogleMaps(): string | null {
  const chave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return chave && chave.trim().length > 0 ? chave.trim() : null;
}

/**
 * Injeta o loader oficial do Google Maps (padrão "dynamic library import"
 * recomendado pelo Google para uso com `loading=async`). Esse loader, ao
 * contrário de um <script src> comum, só define `google.maps.importLibrary`
 * de forma síncrona — as classes como `Map`/`Marker` só ficam disponíveis
 * em `google.maps` depois que a respectiva biblioteca é importada via
 * `importLibrary(...)`. Ver: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
 */
function injetarBootstrapLoader(chave: string): void {
  if (document.getElementById('google-maps-bootstrap-loader')) {
    return;
  }
  const script = document.createElement('script');
  script.id = 'google-maps-bootstrap-loader';
  script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));return d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:${JSON.stringify(chave)},v:"weekly"});`;
  document.head.appendChild(script);
}

/**
 * Carrega o Google Maps JS API uma única vez (reaproveita a mesma Promise
 * se já estiver carregando) e retorna as classes `Map`/`Marker` prontas
 * pra uso. Importante: com o loader "dynamic library import", essas
 * classes NÃO ficam garantidas em `google.maps.Map`/`google.maps.Marker`
 * — o valor retornado por `importLibrary(...)` é a fonte confiável, então
 * usamos ele diretamente em vez de depender do namespace global. Rejeita
 * se não houver chave pública configurada — o chamador deve tratar isso
 * como "mapa indisponível", sem travar o restante do formulário.
 */
export function carregarGoogleMapsScript(): Promise<GoogleMapsLibraries> {
  if (bibliotecasCarregadas) {
    return Promise.resolve(bibliotecasCarregadas);
  }

  if (carregamentoEmAndamento) {
    return carregamentoEmAndamento;
  }

  const chave = obterChavePublicaGoogleMaps();
  if (!chave) {
    return Promise.reject(new Error('Mapa indisponível: chave pública do Google Maps não configurada.'));
  }

  carregamentoEmAndamento = (async () => {
    try {
      injetarBootstrapLoader(chave);
      const bibliotecaMaps = await window.google!.maps.importLibrary('maps');
      const bibliotecas: GoogleMapsLibraries = {
        Map: bibliotecaMaps.Map as GoogleMapConstructor,
      };
      bibliotecasCarregadas = bibliotecas;
      return bibliotecas;
    } catch {
      carregamentoEmAndamento = null;
      throw new Error('Falha ao carregar o Google Maps.');
    }
  })();

  return carregamentoEmAndamento;
}
