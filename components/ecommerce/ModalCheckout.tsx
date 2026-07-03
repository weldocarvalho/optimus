// components/ecommerce/ModalCheckout.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCarrinho } from './ContextoCarrinho';
import AbasCheckout from './AbasCheckout';
import FormularioEndereco from './FormularioEndereco';
import AbaCep from './AbaCep';
import AbaGps from './AbaGps';
import AbaRetirada from './AbaRetirada';

interface CheckoutProps {
  aberto: boolean;
  onFechar: () => void;
  slug: string;
  ehAcai: boolean;
}

export default function ModalCheckout({ aberto, onFechar, slug, ehAcai }: CheckoutProps) {
  const { itens, valorTotal } = useCarrinho();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Estados de Controle e Formulário Unificado
  const [abaAtiva, setAbaAtiva] = useState<'CEP' | 'GPS' | 'RETIRADA'>('CEP');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Brasília');

  // Estados de Carregamento e Erros de UX
  const [carregandoEndereco, setCarregandoEndereco] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);

  const enderecoRestaurante = "Setor de Clubes Esportivos Sul, Trecho 2, Brasília - DF";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Previne erros de validação HTML limpando ou preenchendo os campos ao alternar abas
  useEffect(() => {
    if (abaAtiva === 'RETIRADA') {
      setRua('Retirada no Balcão');
      setNumero('S/N');
      setBairro('Centro');
      setCep('00000-000');
    } else {
      setRua('');
      setNumero('');
      setBairro('');
      setCep('');
    }
    setErroLocalizacao(null);
  }, [abaAtiva]);

  if (!aberto || !mounted || itens.length === 0) return null;

  // Lógica 1: Autocomplete de CEP via ViaCEP
  const lidarComMudancaCep = async (valor: string) => {
    const cepSanitizado = valor.replace(/\D/g, '');
    setCep(cepSanitizado);

    if (cepSanitizado.length === 8) {
      setCarregandoEndereco(true);
      setErroLocalizacao(null);
      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepSanitizado}/json/`);
        const dados = await resposta.json();

        if (!dados.erro) {
          setRua(dados.logradouro || '');
          setBairro(dados.bairro || '');
          setCidade(dados.localidade || '');
          setTimeout(() => document.getElementById('input-numero')?.focus(), 50);
        } else {
          setErroLocalizacao('CEP não encontrado. Digite manualmente.');
        }
      } catch {
        setErroLocalizacao('Erro ao buscar CEP. Digite manualmente.');
      } finally {
        setCarregandoEndereco(false);
      }
    }
  };

  // Lógica 2: Geolocalização Ativa via OpenStreetMap Nominatim Oficial
  const capturarGeolocalizacao = () => {
    if (!navigator.geolocation) {
      setErroLocalizacao('Geolocalização não suportada no seu navegador.');
      return;
    }

    setCarregandoEndereco(true);
    setErroLocalizacao(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          
          // Dentro do seu ModalCheckout.tsx, a chamada interna fica limpa de links complexos:
          const resposta = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          
          const dados = await resposta.json();

          if (dados && dados.address) {
            const addr = dados.address;
            setRua(addr.road || addr.pedestrian || addr.suburb || '');
            setBairro(addr.suburb || addr.neighbourhood || '');
            setCidade(addr.city || addr.town || addr.village || 'Brasília');
            setCep(addr.postcode ? addr.postcode.replace(/\D/g, '') : '');
            
            // Foca automaticamente no campo de número após resolver a geolocalização
            setTimeout(() => document.getElementById('input-numero')?.focus(), 50);
          } else {
            setErroLocalizacao('Não conseguimos ler seu local. Digite manualmente.');
          }
        } catch (error) {
          console.error('Erro de requisição geoespacial:', error);
          setErroLocalizacao('Falha no serviço de mapas. Digite manualmente.');
        } finally {
          setCarregandoEndereco(false);
        }
      },
      (error) => {
        setCarregandoEndereco(false);
        console.error('Erro de GPS Nativo:', error);
        setErroLocalizacao('Permissão negada ou sinal de GPS fraco.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  const handleRedirecionarStripe = (e: React.FormEvent) => {
    e.preventDefault();

    const dadosCliente = {
      nome,
      telefone,
      tipoEntrega: abaAtiva,
      endereco: { rua, numero, bairro, city: cidade, cep: cep || '00000-000' }
    };

    const itensMapeados = itens.map(i => ({
      item_cardapio_id: i.produto.id,
      quantidade: i.quantidade,
      preco_unitario: Number(i.produto.preco_venda)
    }));

    startTransition(async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, dadosCliente, itens: itensMapeados })
        });

        const dados = await response.json();
        if (dados.url) window.location.href = dados.url;
        else alert(`❌ Erro: ${dados.error || 'Falha ao gerar link.'}`);
      } catch {
        alert('❌ Falha na conexão com o servidor.');
      }
    });
  };

  const corBotaoPrimario = ehAcai ? 'bg-[#3B0D2C] hover:bg-[#2C0A25]' : 'bg-[#E16349] hover:bg-[#c8523a]';
  const corTextoDestaque = ehAcai ? 'text-[#3B0D2C]' : 'text-[#E16349]';

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[28px] shadow-2xl border border-zinc-100 overflow-hidden max-h-[95vh] flex flex-col transform transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-[#F3F3F3] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Finalizar Pedido</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">AceleraFood Checkout</p>
          </div>
          <button type="button" onClick={onFechar} className="w-6 h-6 bg-[#F3F3F3] rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500 hover:bg-zinc-200 transition-colors">✕</button>
        </div>

        <AbasCheckout abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} corTextoDestaque={corTextoDestaque} />

        <form onSubmit={handleRedirecionarStripe} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Seu Nome</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none text-zinc-800" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">WhatsApp</label>
              <input type="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(61) 99999-0000" className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none text-zinc-800" />
            </div>
          </div>

          {carregandoEndereco && <div className="text-[11px] text-zinc-500 font-semibold bg-zinc-50 border p-2.5 rounded-[14px] animate-pulse">Processando dados geoespaciais...</div>}
          {erroLocalizacao && <div className="text-[11px] text-red-600 font-semibold bg-red-50 border p-2.5 rounded-[14px]">{erroLocalizacao}</div>}

          {abaAtiva === 'CEP' && <AbaCep cep={cep} onChangeCep={lidarComMudancaCep} abaAtiva={abaAtiva} />}
          {abaAtiva === 'GPS' && <AbaGps onCapturar={capturarGeolocalizacao} />}
          {abaAtiva !== 'RETIRADA' && <FormularioEndereco rua={rua} setRua={setRua} numero={numero} setNumero={setNumero} bairro={bairro} setBairro={setBairro} />}
          {abaAtiva === 'RETIRADA' && <AbaRetirada endereco={enderecoRestaurante} />}

          <div className="bg-[#F8F8F8] border border-zinc-100 rounded-[18px] p-3.5 flex items-center justify-between select-none">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total da Sacola</span>
            <span className="font-black text-sm text-zinc-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onFechar} className="flex-1 py-2.5 bg-[#F3F3F3] text-zinc-500 font-bold text-xs rounded-[14px] hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending || carregandoEndereco} className={`flex-1 py-2.5 text-white font-black text-xs rounded-[14px] shadow-sm transition-all disabled:opacity-50 ${corBotaoPrimario}`}>
              {isPending ? 'Conectando Stripe...' : 'Ir para o Pagamento'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
