// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ProvedorCarrinho } from '@/components/ecommerce/ContextoCarrinho';
import './globals.css'; // Mantém os estilos do Tailwind

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AceleraFood | Plataforma de Vendas de Alta Conversão',
  description: 'O seu delivery proprietário integrado à inteligência de dados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-[#F3F3F3]`}>
        {/* Envolve toda a aplicação para habilitar o carrinho reativo */}
        <ProvedorCarrinho>
          {children}
        </ProvedorCarrinho>
      </body>
    </html>
  );
}
