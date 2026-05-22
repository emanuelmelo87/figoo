# Integração do Dashboard.gs ao projeto existente

## O que é o Dashboard.gs
Complementa o seu `Code.gs` existente. Lê os dados que já foram importados pela sidebar e cria 4 painéis de análise automaticamente. **Não substitui nem interfere no processo de importação.**

---

## Como adicionar

### Passo 1 — Copiar o arquivo no editor de script
1. Abra o editor: **Extensões → Apps Script**
2. Clique no **"+"** ao lado de "Arquivos" → **Novo script**
3. Nomeie como `Dashboard`
4. Apague o conteúdo padrão
5. Cole todo o conteúdo do `Dashboard.gs`
6. Salvar (Ctrl+S)

### Passo 2 — Conectar o menu ao `onOpen` existente

No seu `Code.gs`, localize a função `onOpen()` e adicione **uma linha**:

```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Chamados Betha')
    .addItem('Abrir Gestor', 'abrirBarraLateral')
    .addSeparator()
    .addItem('Testar Conexão com Jira', 'testarConexaoJira')
    .addSeparator()
    .addSubMenu(getDashboardSubMenu())   // ← ADICIONE ESTA LINHA
    .addToUi();
}
```

Salve e recarregue a planilha. O menu **Chamados Betha** ganha o submenu **📊 Painéis BI**.

---

## Como usar

### Fluxo normal
1. Importe os chamados normalmente pela sidebar (como você já faz)
2. Menu **Chamados Betha → 📊 Painéis BI → ⚙️ Configurar aba de dados**
   - Informe o nome exato da sua aba de dados (ex: `Plan1`, `Chamados`, `dados`)
   - Isso precisa ser feito uma vez só
3. Menu **📊 Painéis BI → 🔄 Criar / Atualizar painéis**
4. Os 4 painéis são criados/atualizados

### Atualizar depois de um novo import
Toda vez que reimportar os chamados pela sidebar, execute **Criar / Atualizar painéis** novamente. As fórmulas nos painéis são dinâmicas — releem os dados automaticamente quando recalculadas.

---

## Painéis criados

| Aba | Conteúdo |
|-----|----------|
| `📊 Geral` | KPIs, chamados por status/tipo/mês/equipe |
| `👤 Analistas` | ⭐ Carga por analista, % conclusão, horas APS, fatura, município mais frequente |
| `🏛️ Entidades` | Top entidades/municípios, faturamento por cliente |
| `🖥️ Sistemas` | Volume por sistema, tipo e complexidade predominantes |

---

## Campos necessários no import

Os painéis usam os campos que existirem — se um campo não foi importado, aparece aviso no rodapé do painel. Para o **Painel Analistas** (prioridade), importe ao menos:

| Campo na sidebar | Cabeçalho gerado |
|-----------------|------------------|
| `assignee` | Responsável |
| `status` | Status |
| `chamado_type` | Tipo do chamado |
| `sistema` | Sistema |
| `entidade` | Entidade |
| `municipio` | Municipio |
| `ano_mes_criacao_chamado` | Ano/Mes Criação |
| `aps_hours` | Horas APS |
| `fatura_liquido` | Fatura Líquido |
| `complexity` | Complexidade |
| `equipe_responsavel` | Equipe Responsavel |

---

## Notas técnicas

- **Linha de dados**: o script lê cabeçalhos na **linha 2** e dados a partir da **linha 3** — conforme seu formato atual
- **Colunas dinâmicas**: não dependem de posição fixa; o script encontra cada coluna pelo nome do cabeçalho
- **Status fechados** mapeados: `Concluída`, `Concluída (FL)`, `Concluída (SUP)`, `Resolvido`, `Fechado`, `Fechada`, `Fechado (FL)`, `Fechado (SUP)`, `Não atende`, `Cancelado`
- **Aba `_DB_CONFIG`**: criada automaticamente, oculta, guarda o nome da sua aba de dados entre sessões
