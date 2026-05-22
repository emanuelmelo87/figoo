# JIRA BI — Betha Atendimento — Google Sheets

## O que faz
Importa todos os chamados do JIRA Atendimento (https://atendimento.betha.com.br) e cria painéis automáticos no Google Sheets.

---

## Estrutura das abas

| Aba | Descrição |
|-----|-----------|
| **CONFIG** | Parâmetros de conexão (URL, usuário, senha, período) |
| **DADOS** | Base de dados bruta — 1 linha por chamado, ~26 colunas |
| **PAINEL_GERAL** | KPIs gerais: volume, status, evolução mensal, tipos |
| **PAINEL_ANALISTA** | ⭐ Prioridade: carga por analista, tempo médio, % resolução |
| **PAINEL_ENTIDADE** | Volume por município/entidade e por estado (UF) |
| **PAINEL_SISTEMA** | Volume por produto/sistema, tipo de chamado |
| **PAINEL_FILIAL** | Volume por filial Betha ou projeto |

---

## Campos importados do JIRA

| Coluna | Campo JIRA | Descrição |
|--------|------------|-----------|
| A | `key` | Número do chamado (ex: BTHSC-316949) |
| B | `project.key` | Chave do projeto (ex: BTHSC) |
| C | `project.key` → mapeado | Filial (ex: Palhoça/SC, Chapecó/SC) |
| D | `customfield_10202` | Entidade (Prefeitura/Câmara) |
| E | _derivado_ | Cidade |
| F | _derivado_ | UF |
| G | `customfield_10132` | Sistema/Produto (ex: Compras Cloud) |
| H | `issuetype.name` | Tipo (Dúvida, Erro, Melhoria...) |
| I | `status.name` | Status (Novo, Em Andamento, Concluída...) |
| J | `status.statusCategory.name` | Categoria: To Do / In Progress / Done |
| K | `priority.name` | Prioridade |
| L | `assignee.displayName` | Analista responsável |
| M | `customfield_21500` | Equipe responsável (Suporte, Residente) |
| N | `customfield_25501` | Responsável (SUP) |
| O | `customfield_31300` | Analista residente (Sim/Não) |
| P | `customfield_10404` | Categoria |
| Q | `customfield_30000` | Porte do cliente |
| R | `created` | Data de abertura |
| S | `resolutiondate` | Data de resolução |
| T | `updated` | Data de atualização |
| U | _calculado_ | Dias para resolução |
| V | _derivado_ | Mês de abertura |
| W | _derivado_ | Ano de abertura |
| X | _derivado_ | Semana do ano |
| Y | `reporter.displayName` | Quem abriu o chamado |
| Z | `summary` | Assunto/Resumo |

---

## Como instalar

### Passo 1 — Criar o Google Apps Script

1. Abra o **Google Sheets** (planilha nova ou existente)
2. Menu: **Extensões → Apps Script**
3. Apague o conteúdo padrão da função `myFunction`
4. Cole TODO o conteúdo do arquivo `Code.gs` deste projeto
5. Clique em **Salvar** (ícone de disquete ou Ctrl+S)
6. Feche o editor de script

### Passo 2 — Configurar credenciais

1. Recarregue a planilha — vai aparecer o menu **🔄 JIRA BI** na barra de menus
2. Clique em **🔄 JIRA BI → ⚙️ 1. Configurar planilha**
3. Isso cria a aba CONFIG com os campos:

| Parâmetro | O que preencher |
|-----------|-----------------|
| `JIRA_USER` | Seu e-mail do JIRA (ex: nome@betha.com.br) |
| `JIRA_TOKEN` | Sua senha do JIRA |
| `PERIODO_DIAS` | Quantos dias retroativos buscar (padrão: 90) |
| `JQL_EXTRA` | Filtro adicional opcional (ex: `project = BTHSC`) |

4. Preencha **JIRA_USER** e **JIRA_TOKEN** na aba CONFIG

> ⚠️ A primeira vez que executar, o Google vai pedir autorização para o script acessar URLs externas. Clique em **Autorizar → Avançado → Ir para o projeto (não seguro) → Permitir**.

### Passo 3 — Importar dados

1. Menu **🔄 JIRA BI → 📥 2. Importar dados JIRA**
2. Aguarde — para 90 dias com ~15.000 chamados leva ~5-10 minutos
3. Ao final aparece: "✅ X chamados importados"

### Passo 4 — Criar painéis

1. Menu **🔄 JIRA BI → 📊 3. Criar/atualizar painéis**
2. As 5 abas de painel são criadas/atualizadas automaticamente

### Ou em um clique:
- **🔄 JIRA BI → 🔁 Tudo (importar + painéis)** — faz tudo de uma vez

---

## Atualização automática (opcional)

Para atualizar os dados todos os dias às 6h:

1. Menu **Extensões → Apps Script**
2. Na barra lateral esquerda, clique em **Funções**
3. Execute a função `criarTriggerDiario`

Isso agenda a importação diária automática.

---

## Personalizar filtros

Para analisar apenas uma filial ou período específico, edite a aba CONFIG:

```
JQL_EXTRA = project = FPSC
JQL_EXTRA = project in (FPSC, FCSC) AND assignee is not EMPTY
PERIODO_DIAS = 30
```

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| `HTTP 401` | Usuário ou senha errados na CONFIG |
| `HTTP 403` | Usuário não tem permissão no JIRA |
| Script travado | Divida em períodos menores (`PERIODO_DIAS = 30`) |
| Fórmula `#ERROR!` | Aba DADOS vazia — rode a importação primeiro |
| Painel sem dados | `statusCategory` varia por projeto; ajuste os filtros COUNTIFS se necessário |
