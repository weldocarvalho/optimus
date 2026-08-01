// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { ProvedorCarrinho } from '@/components/ecommerce/ContextoCarrinho';
import { APP_BRAND_NAME } from '@/utils/branding';
import './globals.css'; // Mantém os estilos do Tailwind

export const metadata: Metadata = {
  title: `${APP_BRAND_NAME} | Plataforma de Vendas`,
  description: 'O seu delivery proprietário integrado à inteligência de dados.',
};

export const viewport: Viewport = {
  // Necessário para env(safe-area-inset-*) resolver para o valor real do
  // dispositivo (barra de gestos do Android, notch do iPhone) em vez de 0.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-[#F3F3F3]">
        {/* Envolve toda a aplicação para habilitar o carrinho reativo */}
        <ProvedorCarrinho>
          {children}
        </ProvedorCarrinho>
      </body>
    </html>
  );
}
