# 🎨 Figoo Portal — Design System & Guia Visual

Este documento consolida a especificação completa de identidade visual, tokens de design, tipografia, grid responsivo, componentes de interface e regras de usabilidade do **Portal Figoo**.

---

## 1. 🌈 Paletas de Cores e Temas

O Figoo utiliza um sistema dinâmico de temas (**Claro / Escuro**) combinado com **15 paletas de cores orgânicas e terrosas** gerenciadas via CSS Custom Properties (`figoo-theme.js`).

### 1.1 Paletas Disponíveis (`:root[data-palette="..."]`)

| Paleta | Rótulo | Primary (`--primary`) | Secondary (`--secondary`) | Light (`--light`) | Accent (`--accent`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **verde** *(padrão)* | Verde | `#2D5016` | `#5EAD24` | `#C0DD97` | `#8B6914` |
| **oliva** | Oliva | `#41481C` | `#8C9A2B` | `#DBE2AE` | `#97701B` |
| **pinho** | Pinho | `#14463A` | `#1E9B73` | `#A9E0CD` | `#B07B2A` |
| **terracota** | Terracota | `#6F3320` | `#C0613A` | `#ECC4AC` | `#6E7B33` |
| **ambar** | Âmbar | `#6B4D12` | `#C39419` | `#ECD592` | `#7C6A2C` |
| **ameixa** | Ameixa | `#45284A` | `#8E4585` | `#DCC2D9` | `#8A6E1E` |
| **bosque** | Bosque | `#283618` | `#606C38` | `#D9D8A6` | `#BC6C25` |
| **mare** | Maré | `#124559` | `#598392` | `#AEC3B0` | `#C97B3C` |
| **ametista** | Ametista | `#36213E` | `#554971` | `#8AC6D0` | `#63768D` |
| **oceano** | Oceano | `#003554` | `#0582CA` | `#A9D6EE` | `#00A6FB` |
| **veludo** | Veludo | `#6D324E` | `#C98CA7` | `#F3D8E4` | `#A6527A` |
| **salvia** | Sálvia | `#2A5242` | `#9CC4B2` | `#D9ECE3` | `#588B74` |
| **turquesa** | Turquesa | `#1A5351` | `#48A9A6` | `#C5ECEB` | `#277A77` |
| **violeta** | Violeta | `#3B0D72` | `#731DD8` | `#D8B8FA` | `#9A42F5` |
| **chaverde** | Chá Verde | `#6B5339` | `#CCD5AE` | `#FEFAE0` | `#D4A373` |

### 1.2 Tokens de Superfície e Semântica

As superfícies são calculadas dinamicamente com `color-mix` no padrão sRGB sobre a cor ativa da paleta:

```css
/* ☀️ TEMA CLARO (:root[data-theme="light"]) */
--bg: color-mix(in srgb, var(--secondary) 12%, #F6F7F9);
--white: color-mix(in srgb, var(--secondary) 7%, #FFFFFF);
--border: color-mix(in srgb, var(--primary) 18%, #E8EAED);
--text: #1B1F1D;
--text2: #4A544E; /* Contraste WCAG AA */
--c-danger: #B4291B;
--c-danger-bg: color-mix(in srgb, #C0392B 12%, var(--white));
--c-warn: #785709;
--c-warn-bg: color-mix(in srgb, #E8A33D 20%, var(--white));
--c-warn-soft-bg: color-mix(in srgb, #E8A33D 10%, var(--white));

/* 🌙 TEMA ESCURO (:root[data-theme="dark"]) */
--bg: color-mix(in srgb, var(--secondary) 11%, #0F1115);
--white: color-mix(in srgb, var(--secondary) 14%, #171A1F);
--border: color-mix(in srgb, var(--primary) 28%, #262B33);
--text: #E7EAEE;
--text2: #A6B0BC;
--c-danger: #F0938A;
--c-danger-bg: color-mix(in srgb, #C0392B 26%, var(--white));
--c-warn: #E8B45E;
--c-warn-bg: color-mix(in srgb, #E8A33D 24%, var(--white));
--c-warn-soft-bg: color-mix(in srgb, #E8A33D 14%, var(--white));
```

---

## 2. 🔤 Tipografia e Escala

- **Família Tipográfica:** `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Renderização:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

### Escala de Fontes Padronizada

| Token / Uso | Tamanho | Peso | Exemplo de Aplicação |
| :--- | :--- | :--- | :--- |
| `var(--fs-2xl)` | `1.5rem` (24px) | `700` | Títulos de página / cabeçalho principal |
| `var(--fs-xl)` | `1.25rem` (20px) | `700` | Títulos de seções Bento / cards de destaque |
| `var(--fs-lg)` | `1.125rem` (18px) | `600` | Títulos de modais |
| `var(--fs-md)` | `1rem` (16px) | `600` | Cabeçalhos de rail, nomes de clientes/contas |
| `var(--fs-sm)` | `0.875rem` (14px) | `400 / 500` | Corpo de texto, formulários, inputs, botões padrão |
| `var(--fs-xs)` | `0.8125rem` (13px) | `500` | Metadados de cards, abas secundárias, rótulos de tabela |
| `var(--fs-2xs)` | `0.75rem` (12px) | `600 / 700` | Badges de status, tags, micro-textos *(mínimo de acessibilidade)* |

---

## 3. 📐 Layout, Grid e Breakpoints Responsivos

### 3.1 Escala Oficial de Breakpoints (`figoo-base.css`)

> ⚠️ **Regra de Ouro:** Nunca invente breakpoints arbitrários (como 520px, 640px, 880px). Use exclusivamente:

```css
/* 📱 600px — Mobile (smartphones em retrato e paisagem compacta) */
@media (max-width: 600px) { ... }

/* 📟 900px — Tablet / Ponto de colapso de layouts lado a lado (rail + detalhe / sidebar) para 1 coluna */
@media (max-width: 900px) { ... }

/* 💻 1400px — Laptop grande / Monitor comum */
@media (min-width: 1400px) { ... }

/* 🖥️ 1600px — Monitor grande / Ultra-wide (teto final de container) */
@media (min-width: 1600px) { ... }

/* 👆 Touch sem hover (iPad, tablets e notebooks com touchscreen) */
@media (hover: none), (pointer: coarse) { ... }
```

### 3.2 Moldura Global de Conteúdo

O container principal é centralizado com padding uniforme:

```css
.topbar-inner, .page-wrap, .main-body, .ia-layout, .container-main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}
@media (min-width: 1400px) {
  .topbar-inner, .page-wrap, .main-body, .ia-layout, .container-main { max-width: 1440px; }
}
@media (min-width: 1600px) {
  .topbar-inner, .page-wrap, .main-body, .ia-layout, .container-main { max-width: 1600px; }
}
```

---

## 4. 🧩 Componentes do Design System

### 4.1 Topbar Universal (`figoo-ui.js`)
- **Estrutura de 3 Colunas:** Grid CSS com `1fr auto 1fr` que mantém o módulo central perfeitamente centralizado.
- **Identificação do Usuário:** Canto superior direito com badge `👤 username`, indicador de nuvem/offline e menu de conta (`#topbar-account-menu`).
- **Navegação:** Pílulas compactas com ícone e label expansível no hover.
- **Sticky com Safe Area:** `position: sticky; top: 0; z-index: 9990; padding-top: env(safe-area-inset-top)`.

### 4.2 Botões e Ações (`.tbtn` / `.tbtn2`)
- **`.tbtn` / `.tbtn2` (Padrão):** Fundo translúcido sutil (`rgba(127,127,127,0.08)`), borda fina `0.5px solid var(--border)`, cantos arredondados de `8px` ou `10px`.
- **`.primary`:** Destaque de ação principal com fundo `var(--primary)` ou `var(--secondary)` e texto contrastante.
- **`.danger`:** Ações destrutivas com texto e hover em `var(--c-danger)`.
- **`.figoo-tap-min`:** Garante alvo de toque mínimo de **~44px** para dispositivos móveis sem alterar o tamanho visual no desktop.

### 4.3 Seções Bento Grid & KPI Cards
- **`.bento-section`:** Cards modulares com borda `0.5px solid var(--border)`, fundo `var(--white)` e `border-radius: var(--radius)`.
- **`.summary-strip` / `.kpi-bar`:** Grid de métricas em 4 colunas (colapsa para 2 colunas abaixo de 800px).
- **`.sum-chip`:** Card de contagem com número em destaque, rótulo em caixa alta e barra de destaque colorida.

### 4.4 Autocomplete Combobox & Cadastro Rápido (`attachAutocomplete`)
- Substitui `<select>` nativos e inputs de texto simples para entidades relacionadas (Contas, Clientes, Municípios, Colaboradores).
- Busca multi-termo em tempo real com realce de termo (`<mark>`).
- Opção integrada de **Cadastro Rápido Inline**: `➕ Cadastrar "[Texto]" como [Conta | Cliente | Município | Colaborador]`.

### 4.5 Filtro Multi-Seleção em Popover (Padrão A)
- Estado em `Set` sincronizado.
- Popover com busca interna em tempo real, botões "Todos" e "Limpar", barra de chips da seleção ativa e botão "Concluir Seleção".

### 4.6 Modais Padronizados
- Estrutura acessível com backdrop blur (`.modal-ov > .modal-card`).
- Atributos automáticos `role="dialog" aria-modal="true"`.
- Fechamento global ao pressionar tecla **Esc** ou clicar fora do card.
- Corpo rolável com limite de `max-height: 85vh`.

### 4.7 Central de IA & Slide-Over (`figoo-chat.js`)
- Gaveta lateral direita em **100vh** com transição suave (`transform: translateX(0)`).
- Acionamento exclusivo via topo/botão explícito (sem sobreposição flutuante sobre conteúdo da tela).

### 4.8 Estado Vazio Padronizado (`.figoo-empty-card`)
- Card centralizado com ícone ilustrativo, título convidativo, mensagem de ajuda e botão de ação primária (+ Novo registro).

---

## 5. 🛡️ Regras de Ouro e Diretrizes de UI/UX (Anti-Patterns)

1. **Sem Botões Flutuantes:** Proibido `position: fixed` sobrepondo áreas de conteúdo ou botões de ação da tela.
2. **Topbar Obrigatória:** Toda tela deve conter o cabeçalho universal com menu, badge do usuário e atalhos de ferramentas.
3. **Escala de Breakpoints Fixa:** Uso exclusivo de **600 / 900 / 1400 / 1600px**.
4. **Alvo de Toque no Mobile:** Utilizar `.figoo-tap-min` em ícones pequenos e botões de ação rápida.
5. **Combobox para Relacionamentos:** Sempre usar `attachAutocomplete` em vez de `<select>` nativo para listas dinâmicas.
6. **Invalidação de Cache:** Manter sufixo `?v=...` atualizado em todas as importações de scripts e estilos globais.

---

## 6. 🚀 Pilares "Modern Utility 2025"

A evolução estética e ergonômica do ciclo 2025 integra os seguintes conceitos nas novas telas e atualizações:

- **Bento 2.0:** Grades com bordas ultrafinas de `0.5px`, sub-grids internos para isolar metadados de ações e hierarquia visual dinâmica.
- **Organic Tech & Tactilidade Digital:** Texturas orgânicas com fundos terrosos (`--bg`), efeito *Frosted Glass* denso na Topbar (`backdrop-filter: blur(12px) saturate(160%)`) e sombras com profundidade física sutil.
- **Insight-First:** Inclusão de micro-gráficos/sparklines em cards e tabelas para leitura imediata de contexto sem cliques profundos.
- **Ergonomia Cognitiva:** Redução de carga visual e fadiga com paletas terrosas e espaçamentos simétricos confortáveis.

