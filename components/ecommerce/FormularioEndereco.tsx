// components/ecommerce/FormularioEndereco.tsx
'use client';

interface FormularioEnderecoProps {
  rua: string;
  setRua: (v: string) => void;
  numero: string;
  setNumero: (v: string) => void;
  bairro: string;
  setBairro: (v: string) => void;
}

export default function FormularioEndereco({
  rua,
  setRua,
  numero,
  setNumero,
  bairro,
  setBairro,
}: FormularioEnderecoProps) {
  return (
    <div className="space-y-3 pt-1 border-t border-[#F3F3F3]">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Rua / Av.</label>
          <input
            type="text"
            required
            value={rua}
            onChange={(e) => setRua(e.target.value)}
            placeholder="Endereço de entrega"
            className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Número</label>
          <input
            id="input-numero"
            type="text"
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Nº"
            className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Bairro</label>
        <input
          type="text"
          required
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Bairro"
          className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none focus:bg-white focus:border-zinc-300 transition-all placeholder-zinc-400"
        />
      </div>
    </div>
  );
}
