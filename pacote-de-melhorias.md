### ✅ O que foi aplicado

- **Cardápio (admin)**
  - Lixeira por item ao lado do status **Ativo/Pausado**.
  - Ação em lote **“Apagar Selecionados”**.
  - Modal ajustado:
    - “Novo hambúrguer e configuração” → **“Novo hambúrguer”**
    - removido “Catálogo geral e engenharia financeira”
    - aba **“Opcionais Adicionais”** → **“Adicionais”**
    - upload de foto com texto em português (**“Escolher arquivo / Nenhum arquivo selecionado”**)

- **Insumos (admin)**
  - Botão de exclusão individual (lixeira) ao lado de **Editar**.

- **Header do painel do gestor**
  - Implementada edição de logo ao lado de “Painel Administrativo” (upload + persistência da URL).
  - Adicionada aba **“Estoque (em breve)”** ao lado de Insumos.
  - Adicionada aba **“IA”** com destaque no fim da navegação.
  - Criadas páginas placeholder:
    - `/admin/estoque`
    - `/admin/ia`

- **`/[slug]` e checkout**
  - Onde estava “HAMBURGUERIA”, agora mostra **endereço do estabelecimento** (com fallback).
  - Na sacola (`/[slug]/checkout`), agora mostra **imagem do produto** no card (com fallback para iniciais).
  - Na aba **Retirada**, exibe o **endereço real da loja**.

- **Login**
  - CTA alterado para **“ACESSAR PAINEL”**.

- **Pagamentos**
  - Bloco “Estabelecimento + nome + slug” com fundo em tom **azul claro**.

- **Cozinha**
  - “Canal ativo” → **“Em tempo real”**.
  - Botão **“Despachar”** com fundo **verde-claro** da paleta.

- **Métricas**
  - Adicionado mock de métricas **Meta Ads** logo abaixo do funil.

---

### 🧩 Banco de dados (tables.json revisado)
Como não havia campos explícitos para endereço/logo em `restaurantes`, deixei pronto o SQL:

- `sql-melhorias-restaurante-identidade.sql`
  - adiciona `endereco`
  - adiciona `logo_url`

---

### ✅ Validação
- `npm run lint` **ok**
- `npm run build` **ok**