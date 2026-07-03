// components/ecommerce/AbasCheckout.tsx
'use client';

interface AbasCheckoutProps {
  abaAtiva: 'CEP' | 'GPS' | 'RETIRADA';
  setAbaAtiva: (aba: 'CEP' | 'GPS' | 'RETIRADA') => void;
  corTextoDestaque: string;
}

export default function AbasCheckout({ abaAtiva, setAbaAtiva, corTextoDestaque }: AbasCheckoutProps) {
  return (
    <div className="flex border-b border-[#F3F3F3] bg-[#F8F8F8] p-1 font-bold text-[11px] shrink-0">
      <button
        type="button"
        onClick={() => setAbaAtiva('CEP')}
        className={`flex-1 text-center py-2.5 rounded-[10px] transition-all ${
          abaAtiva === 'CEP' ? `bg-white shadow-sm ${corTextoDestaque}` : 'text-zinc-400 hover:text-zinc-600'
        }`}
      >
        Entrega via CEP
      </button>
      <button
        type="button"
        onClick={() => setAbaAtiva('GPS')}
        className={`flex-1 text-center py-2.5 rounded-[10px] transition-all ${
          abaAtiva === 'GPS' ? `bg-white shadow-sm ${corTextoDestaque}` : 'text-zinc-400 hover:text-zinc-600'
        }`}
      >
        Usar GPS
      </button>
      <button
        type="button"
        onClick={() => setAbaAtiva('RETIRADA')}
        className={`flex-1 text-center py-2.5 rounded-[10px] transition-all ${
          abaAtiva === 'RETIRADA' ? `bg-white shadow-sm ${corTextoDestaque}` : 'text-zinc-400 hover:text-zinc-600'
        }`}
      >
        Retirada
      </button>
    </div>
  );
}
