// ============================================================
// Dashboard.gs — BI completo sobre dados do Chamados Betha
// Adicione ao mesmo projeto do Code.gs existente.
//
// Layout da aba de dados:
//   Linha 1  → informações do filtro
//   Linha 2  → cabeçalhos (gerados pelo MAPA_DE_CAMPOS)
//   Linha 3+ → dados dos chamados
// ============================================================

// ── Nomes das abas de painel ─────────────────────────────────
const DB_GERAL        = '📊 Geral';
const DB_ANALISTA     = '👤 Analistas';
const DB_FINANCEIRO   = '💰 Financeiro';
const DB_ENTIDADE     = '🏛️ Entidades';
const DB_SISTEMA      = '🖥️ Sistemas';
const DB_OPERACIONAL  = '⏱️ Operacional';
const DB_VERTICAL     = '📐 Vertical';
const DB_ENRIQUECIDOS = '_DADOS_ENRIQUECIDOS';
const DB_CONFIG       = '_DB_CONFIG';

// ── Cabeçalhos esperados (conforme MAPA_DE_CAMPOS) ──────────
const HDR = {
  CHAMADO         : 'Chamado',
  ANALISTA        : 'Responsável',
  RESP_SUP        : 'Responsavel(SUP)',
  STATUS          : 'Status',
  TIPO            : 'Tipo do chamado',
  ENTIDADE        : 'Entidade',
  MUNICIPIO       : 'Municipio',
  SISTEMA         : 'Sistema',
  FUNCIONALIDADE  : 'Funcionalidade',
  EQUIPE_RESP     : 'Equipe Responsavel',
  VERTICAL        : 'Vertical',
  PORTFOLIO       : 'Portfolio',
  COMPLEXIDADE    : 'Complexidade',
  CANAL_ORIGEM    : 'Origem da solicitaçao',
  NOME_SOLICITANTE: 'Nome do solicitante',
  DATA_CRIACAO    : 'Data Criação',
  DATA_RESOLUCAO  : 'Data Resolução',
  TRIAGEM         : 'Data da triagem',
  ENCERR_TRIAGEM  : 'Encerramento da triagem',
  ENCAMIN_FILIAL  : 'Encaminhamento Filial',
  ANO_MES_CRIACAO : 'Ano/Mes Criação',
  ANO_MES_RESOLUCAO:'Ano/Mes Resolução',
  RES_STATUS      : 'Status da Resolução',
  FATURADO        : 'FATURADO?',
  HORAS_APS       : 'Horas APS',
  TEMPO_GASTO     : 'Tempo Gasto (h)',
  ESTIMATIVA_H    : 'Estimativa (h)',
  HORA_TEC_VALOR  : 'Hora Técnica Valor',
  VALOR_FATURA    : 'Valor Fatura',
  VALOR_DESCONTO  : 'Valor Desconto',
  FATURA_LIQUIDO  : 'Fatura Líquido',
  INFO_NEGOCIACAO : 'Informacao para negociacao',
  PROJ_IMPLANTACAO: 'Projeto Implantação',
};

// ── Colunas calculadas adicionadas pelo enriquecimento ───────
const CALC = {
  DIAS_TOTAL    : '_Dias_Total',
  DIAS_TRIAGEM  : '_Dias_Triagem',
  DIAS_ENC_TRI  : '_Dias_Enc_Tri',
  DIAS_ENCAMP   : '_Dias_Encamp',
  FATURA_N      : '_Fatura_N',
  LIQUIDO_N     : '_Liquido_N',
  DESCONTO_N    : '_Desconto_N',
  HORAS_APS_N   : '_HorasAPS_N',
  TEMPO_GASTO_N : '_TempoGasto_N',
  ESTIMATIVA_N  : '_EstimH_N',
  EFICIENCIA    : '_Eficiencia',
  MARGEM_DESC   : '_MargemDesc',
};

// ── Status considerados concluídos/fechados ──────────────────
const STATUS_FECHADOS = [
  'Concluída','Concluído','Concluída (FL)','Concluída (SUP)',
  'Concluido (FL)','Concluido (SUP)',
  'Resolvido','Resolvida','Fechado','Fechada',
  'Fechado (FL)','Fechado (SUP)',
  'Não atende','Cancelado','Done'
];

// ── Paleta de cores ──────────────────────────────────────────
const COR = {
  GERAL      : { f:'#1a73e8', c:'#e8f0fe', t:'#ffffff' },
  ANALISTA   : { f:'#0f9d58', c:'#e6f4ea', t:'#ffffff' },
  FINANCEIRO : { f:'#b5800c', c:'#fef9c3', t:'#ffffff' },
  ENTIDADE   : { f:'#e37400', c:'#fff3e0', t:'#ffffff' },
  SISTEMA    : { f:'#9334e6', c:'#f3e8fd', t:'#ffffff' },
  OPERACIONAL: { f:'#d93025', c:'#fce8e6', t:'#ffffff' },
  VERTICAL   : { f:'#1e8bc3', c:'#e3f2fd', t:'#ffffff' },
};


// ============================================================
// MENU — integra ao onOpen() existente no Code.gs
// ============================================================
// No Code.gs, adicione na função onOpen():
//   .addSeparator()
//   .addSubMenu(getDashboardSubMenu())

function getDashboardSubMenu() {
  return SpreadsheetApp.getUi()
    .createMenu('📊 Painéis BI')
    .addItem('⚙️  Configurar aba de dados',       'configurarFonteDados')
    .addItem('🔢  Enriquecer dados (calcular)',    'enriquecerDados')
    .addItem('🔄  Criar / Atualizar painéis',      'criarTodosPaineis')
    .addItem('🚀  Tudo (enriquecer + painéis)',    'enriquecerECriar')
    .addSeparator()
    .addItem('📊  Painel Geral',                   'criarPainelGeral')
    .addItem('👤  Painel Analistas',               'criarPainelAnalista')
    .addItem('💰  Painel Financeiro',              'criarPainelFinanceiro')
    .addItem('🏛️  Painel Entidades',               'criarPainelEntidade')
    .addItem('🖥️  Painel Sistemas',                'criarPainelSistema')
    .addItem('⏱️  Painel Operacional',             'criarPainelOperacional')
    .addItem('📐  Painel Vertical / Portfolio',    'criarPainelVertical')
    .addSeparator()
    .addItem('🔍  Criar aba Detalhes (drill-down)', 'criarPainelDetalhes')
    .addItem('🔍  Filtrar detalhes',               'filtrarDetalhes')
    .addItem('🎯  Ver detalhes do selecionado',    'verDetalhesDoSelecionado')
    .addItem('🔄  Atualizar dropdowns',            'atualizarDropdownsDetalhes')
    .addItem('🗑️  Limpar filtros',                 'limparFiltrosDetalhes');
}


// ============================================================
// CONFIGURAÇÃO DA FONTE DE DADOS
// ============================================================

function configurarFonteDados() {
  const ui  = SpreadsheetApp.getUi();
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const atual = lerConfigDB('FONTE_DADOS') || ss.getActiveSheet().getName();
  const resp  = ui.prompt('Aba de dados', 'Nome da aba com os chamados (atual: "' + atual + '"):', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const nome = resp.getResponseText().trim();
  if (!nome || !ss.getSheetByName(nome)) { ui.alert('Aba "' + nome + '" não encontrada.'); return; }
  gravarConfigDB('FONTE_DADOS', nome);
  ui.alert('✅ Configurado: "' + nome + '"');
}

function getSheetDados() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const nome = lerConfigDB('FONTE_DADOS') || ss.getActiveSheet().getName();
  const sh   = ss.getSheetByName(nome);
  if (!sh) throw new Error('Aba "' + nome + '" não encontrada. Configure via ⚙️ Configurar aba de dados.');
  return sh;
}


// ============================================================
// MAPA DINÂMICO DE COLUNAS
// ============================================================

function buildColMap(sheet) {
  const last = sheet.getLastColumn();
  if (!last) return {};
  const hdrs = sheet.getRange(2, 1, 1, last).getValues()[0];
  const m = {};
  hdrs.forEach((h, i) => { if (h !== '' && h != null) m[String(h).trim()] = colLetter(i + 1); });
  return m;
}

function buildColIndexMap(sheet) {
  const last = sheet.getLastColumn();
  if (!last) return {};
  const hdrs = sheet.getRange(2, 1, 1, last).getValues()[0];
  const m = {};
  hdrs.forEach((h, i) => { if (h !== '' && h != null) m[String(h).trim()] = i + 1; });
  return m;
}

function colLetter(n) {
  let s = '';
  while (n > 0) { const r = (n-1)%26; s = String.fromCharCode(65+r)+s; n = Math.floor((n-1)/26); }
  return s;
}


// ============================================================
// ENRIQUECIMENTO DOS DADOS (cria _DADOS_ENRIQUECIDOS com valores)
// ============================================================

function enriquecerDados() {
  const ui      = SpreadsheetApp.getUi();
  const shDados = getSheetDados();
  const colIdx  = buildColIndexMap(shDados);
  const lastRow = shDados.getLastRow();
  const lastCol = shDados.getLastColumn();

  if (lastRow < 3) { ui.alert('Nenhum dado encontrado (linhas < 3). Importe os chamados primeiro.'); return; }

  SpreadsheetApp.getActiveSpreadsheet().toast('Enriquecendo dados...', '🔢', 60);

  // Lê todos os dados de uma vez
  const srcHeaders = shDados.getRange(2, 1, 1, lastCol).getValues()[0];
  const srcData    = shDados.getRange(3, 1, lastRow - 2, lastCol).getValues();

  // Índices das colunas de interesse (0-based)
  const idx = {};
  Object.keys(HDR).forEach(k => {
    const col = colIdx[HDR[k]];
    if (col) idx[k] = col - 1;
  });

  // Helpers de parse
  function pDate(v) {
    if (!v || v === 'N/A' || v === '') return null;
    const s = String(v).split('T')[0];
    const p = s.split('-');
    if (p.length < 3) return null;
    const d = new Date(+p[0], +p[1]-1, +p[2]);
    return isNaN(d) ? null : d;
  }
  function pNum(v) {
    if (v === null || v === undefined || v === '' || v === 'N/A') return 0;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
  function diffDays(a, b) {
    if (!a || !b) return '';
    const d = Math.round((b - a) / 86400000);
    return d >= 0 ? d : '';
  }

  // Calcula linhas enriquecidas
  const calcHeaders = [
    CALC.DIAS_TOTAL, CALC.DIAS_TRIAGEM, CALC.DIAS_ENC_TRI, CALC.DIAS_ENCAMP,
    CALC.FATURA_N, CALC.LIQUIDO_N, CALC.DESCONTO_N,
    CALC.HORAS_APS_N, CALC.TEMPO_GASTO_N, CALC.ESTIMATIVA_N,
    CALC.EFICIENCIA, CALC.MARGEM_DESC
  ];

  const enrichedData = srcData.map(row => {
    const dCriacao  = pDate(idx.DATA_CRIACAO   != null ? row[idx.DATA_CRIACAO]   : null);
    const dResolucao= pDate(idx.DATA_RESOLUCAO  != null ? row[idx.DATA_RESOLUCAO] : null);
    const dTriagem  = pDate(idx.TRIAGEM         != null ? row[idx.TRIAGEM]        : null);
    const dEncTriag = pDate(idx.ENCERR_TRIAGEM  != null ? row[idx.ENCERR_TRIAGEM] : null);
    const dEncamp   = pDate(idx.ENCAMIN_FILIAL  != null ? row[idx.ENCAMIN_FILIAL] : null);

    const fatura  = pNum(idx.VALOR_FATURA  != null ? row[idx.VALOR_FATURA]  : 0);
    const liquido = pNum(idx.FATURA_LIQUIDO!= null ? row[idx.FATURA_LIQUIDO]: 0);
    const desconto= pNum(idx.VALOR_DESCONTO!= null ? row[idx.VALOR_DESCONTO]: 0);
    const horasAps= pNum(idx.HORAS_APS     != null ? row[idx.HORAS_APS]    : 0);
    const tGasto  = pNum(idx.TEMPO_GASTO   != null ? row[idx.TEMPO_GASTO]  : 0);
    // estimativa vem em segundos
    const estimSec= pNum(idx.ESTIMATIVA_H  != null ? row[idx.ESTIMATIVA_H] : 0);
    const estimH  = estimSec > 3600 ? estimSec / 3600 : estimSec; // se já vier em horas, mantém

    const efic    = (horasAps > 0 && tGasto > 0) ? parseFloat((horasAps / tGasto).toFixed(4)) : '';
    const mDesc   = (fatura > 0) ? parseFloat((desconto / fatura).toFixed(4)) : '';

    return [
      diffDays(dCriacao, dResolucao),
      diffDays(dCriacao, dTriagem),
      diffDays(dTriagem, dEncTriag),
      diffDays(dEncTriag, dEncamp),
      fatura, liquido, desconto,
      horasAps, tGasto, estimH,
      efic, mDesc
    ];
  });

  // Monta ou recria a aba _DADOS_ENRIQUECIDOS
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let shE  = ss.getSheetByName(DB_ENRIQUECIDOS);
  if (!shE) { shE = ss.insertSheet(DB_ENRIQUECIDOS); shE.hideSheet(); }
  shE.clearContents();

  // Cabeçalho: originais + calculados
  const allHeaders = srcHeaders.concat(calcHeaders);
  shE.getRange(1, 1, 1, allHeaders.length).setValues([allHeaders]).setFontWeight('bold');

  // Dados: originais + calculados em blocos
  const totalRows = enrichedData.length;
  if (totalRows === 0) return;

  // Escreve em lotes de 1000 para evitar timeout
  const LOTE = 1000;
  for (let i = 0; i < totalRows; i += LOTE) {
    const slice = srcData.slice(i, i + LOTE).map((row, j) => row.concat(enrichedData[i + j]));
    shE.getRange(i + 2, 1, slice.length, allHeaders.length).setValues(slice);
  }

  gravarConfigDB('ENRIQUECIDOS_ATUALIZADO', new Date().toLocaleString('pt-BR'));
  gravarConfigDB('ENRIQUECIDOS_LINHAS', totalRows);
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ ' + totalRows + ' linhas enriquecidas.', 'Enriquecimento', 5);
}

function enriquecerECriar() {
  enriquecerDados();
  criarTodosPaineis();
}


// ============================================================
// ORQUESTRADOR PRINCIPAL
// ============================================================

function criarTodosPaineis() {
  const ui = SpreadsheetApp.getUi();
  try {
    const shDados = getSheetDados();
    const shEnr   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_ENRIQUECIDOS);
    const colMapSrc = buildColMap(shDados);
    const colMapEnr = shEnr ? buildColMap(shEnr) : colMapSrc;

    if (!Object.keys(colMapSrc).length) {
      ui.alert('Aba de dados vazia. Importe os chamados e execute "Enriquecer dados" primeiro.');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('Criando painéis...', '📊', 120);
    _criarGeral(shDados, colMapSrc, colMapEnr, shEnr);
    _criarAnalista(shDados, colMapSrc, colMapEnr, shEnr);
    _criarFinanceiro(shDados, colMapSrc, colMapEnr, shEnr);
    _criarEntidade(shDados, colMapSrc, colMapEnr, shEnr);
    _criarSistema(shDados, colMapSrc, colMapEnr, shEnr);
    _criarOperacional(shDados, colMapSrc, colMapEnr, shEnr);
    _criarVertical(shDados, colMapSrc, colMapEnr, shEnr);
    ui.alert('✅ 7 painéis criados/atualizados!');
  } catch(e) {
    ui.alert('Erro: ' + e.message);
    Logger.log(e.stack);
  }
}

// wrappers para o menu individual
function criarPainelGeral()       { _runSingle(_criarGeral);       }
function criarPainelAnalista()    { _runSingle(_criarAnalista);    }
function criarPainelFinanceiro()  { _runSingle(_criarFinanceiro);  }
function criarPainelEntidade()    { _runSingle(_criarEntidade);    }
function criarPainelSistema()     { _runSingle(_criarSistema);     }
function criarPainelOperacional() { _runSingle(_criarOperacional); }
function criarPainelVertical()    { _runSingle(_criarVertical);    }

function _runSingle(fn) {
  try {
    const shDados = getSheetDados();
    const shEnr   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_ENRIQUECIDOS);
    fn(shDados, buildColMap(shDados), shEnr ? buildColMap(shEnr) : buildColMap(shDados), shEnr);
  } catch(e) {
    SpreadsheetApp.getUi().alert('Erro: ' + e.message);
    Logger.log(e.stack);
  }
}


// ============================================================
// HELPERS DE LAYOUT
// ============================================================

function getOrCreate(nome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(nome) || ss.insertSheet(nome, ss.getSheets().length);
}

function limpar(sh) {
  sh.clearContents(); sh.clearFormats(); sh.clearNotes();
  sh.clearConditionalFormatRules();
}

function titulo(sh, range, texto, cor) {
  range.merge().setValue(texto)
    .setFontSize(14).setFontWeight('bold')
    .setBackground(cor.f).setFontColor(cor.t)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(range.getRow(), 34);
}

function subtitulo(sh, range, texto) {
  range.merge().setValue(texto)
    .setFontSize(9).setFontStyle('italic').setFontColor('#666666')
    .setHorizontalAlignment('center').setBackground('#f8f9fa');
}

function cabHdr(sh, lin, col, textos, cor) {
  sh.getRange(lin, col, 1, textos.length)
    .setValues([textos]).setFontWeight('bold')
    .setBackground(cor.f).setFontColor(cor.t)
    .setHorizontalAlignment('center').setWrap(true);
}

function kpiSet(sh, linLbl, linVal, startCol, itens) {
  // itens: [{label, formula, formato, cor}]
  itens.forEach((it, i) => {
    const c = startCol + i;
    sh.getRange(linLbl, c).setValue(it.label)
      .setFontWeight('bold').setFontSize(9).setBackground(it.cor || '#e8f0fe')
      .setHorizontalAlignment('center').setWrap(true);
    const cell = sh.getRange(linVal, c);
    cell.setFormula(it.formula)
      .setFontSize(18).setFontWeight('bold').setBackground(it.cor || '#e8f0fe')
      .setHorizontalAlignment('center');
    if (it.formato) cell.setNumberFormat(it.formato);
  });
}

function secBloco(sh, lin, col, ncols, texto, cor) {
  sh.getRange(lin, col, 1, ncols).merge()
    .setValue(texto).setFontWeight('bold').setFontSize(10)
    .setBackground(cor.c).setFontColor(cor.f).setBorder(false,false,true,false,false,false, cor.f, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function rodape(sh, nomeFonte) {
  const r = sh.getLastRow() + 2;
  sh.getRange(r, 1).setValue('Fonte: "' + nomeFonte + '" | Atualizado: ' + new Date().toLocaleString('pt-BR'))
    .setFontSize(8).setFontStyle('italic').setFontColor('#aaaaaa');
}

// Fórmula de soma por grupo com conversão numérica
function fSoma(src, cGrupo, ancora, cVal) {
  return `=IFERROR(SUMPRODUCT((${src}!${cGrupo}3:${cGrupo}=${ancora})*(IFERROR(VALUE(${src}!${cVal}3:${cVal}),0))),0)`;
}

// Fórmula de média por grupo excluindo zeros
function fMedia(src, cGrupo, ancora, cVal) {
  return `=IFERROR(SUMPRODUCT((${src}!${cGrupo}3:${cGrupo}=${ancora})*(IFERROR(VALUE(${src}!${cVal}3:${cVal}),0)))/SUMPRODUCT((${src}!${cGrupo}3:${cGrupo}=${ancora})*(IFERROR(VALUE(${src}!${cVal}3:${cVal}),0)>0)),"")`;
}

// Fórmula SUMIF simples (para colunas já numéricas no enriquecido)
function fSumif(src, cGrupo, ancora, cVal) {
  return `=IFERROR(SUMIF(${src}!${cGrupo}:${cGrupo},${ancora},${src}!${cVal}:${cVal}),0)`;
}

// Fórmula AVERAGEIF simples (excluindo vazios/zeros)
function fAvgif(src, cGrupo, ancora, cVal) {
  return `=IFERROR(AVERAGEIF(${src}!${cVal}:${cVal},">"&0,IF(${src}!${cGrupo}:${cGrupo}=${ancora},${src}!${cVal}:${cVal})),"")`;
}

function statusFechadosArr() {
  return '{"' + STATUS_FECHADOS.join('","') + '"}';
}

// MMULT para somar vários COUNTIFS de status fechados
function fConcluidos(src, cGrupo, ancora, cStatus) {
  const sf = statusFechadosArr();
  const n  = STATUS_FECHADOS.length;
  return `=IFERROR(MMULT(IFERROR(COUNTIFS(${src}!${cGrupo}3:${cGrupo},${ancora},${src}!${cStatus}3:${cStatus},TRANSPOSE(${sf})),0),SEQUENCE(${n},1,1,0)),0)`;
}

// Wrapper ARRAYFORMULA com MAP+LAMBDA para colunas calculadas por linha
function fMapSoma(src, cGrupo, linAnc, cVal) {
  return `=ARRAYFORMULA(IF(A${linAnc}:A="","",IFERROR(SUMIF(${src}!${cGrupo}:${cGrupo},A${linAnc}:A,${src}!${cVal}:${cVal}),0)))`;
}

function fMapAvg(src, cGrupo, linAnc, cVal) {
  return `=ARRAYFORMULA(IF(A${linAnc}:A="","",IFERROR(AVERAGEIF(${src}!${cVal}:${cVal},">"&0,IF(${src}!${cGrupo}:${cGrupo}=A${linAnc}:A,${src}!${cVal}:${cVal})),"")))`;
}

function fMapConc(src, cGrupo, linAnc, cStatus) {
  const sf = statusFechadosArr();
  const n  = STATUS_FECHADOS.length;
  return `=ARRAYFORMULA(IF(A${linAnc}:A="","",MMULT(IFERROR(COUNTIFS(${src}!${cGrupo}3:${cGrupo},A${linAnc}:A,${src}!${cStatus}3:${cStatus},TRANSPOSE(${sf})),0),SEQUENCE(${n},1,1,0))))`;
}

function fMapCount(src, cGrupo, linAnc) {
  return `=ARRAYFORMULA(IF(A${linAnc}:A="","",COUNTIF(${src}!${cGrupo}3:${cGrupo},A${linAnc}:A)))`;
}

function fMapModa(src, cGrupo, linAnc, cVal) {
  return `=ARRAYFORMULA(IF(A${linAnc}:A="","",MAP(A${linAnc}:A,LAMBDA(g,IFERROR(INDEX(QUERY(FILTER(${src}!${cVal}3:${cVal},${src}!${cGrupo}3:${cGrupo}=g,${src}!${cVal}3:${cVal}<>""),"SELECT Col1, COUNT(Col1) GROUP BY Col1 ORDER BY COUNT(Col1) DESC",0),2,1),"")))))`
}

// Referência da aba enriquecida, com fallback para a aba de dados
function srcRef(shEnr, shDados) {
  return "'" + (shEnr ? shEnr.getName() : shDados.getName()) + "'";
}


// ============================================================
// PAINEL GERAL
// ============================================================

function _criarGeral(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_GERAL);
  limpar(sh);
  const SRC  = srcRef(shEnr, shDados);
  const SRAW = "'" + shDados.getName() + "'";
  const cm   = shEnr ? colMapEnr : colMapSrc;
  const cor  = COR.GERAL;

  const cKey   = cm[HDR.CHAMADO];
  const cSt    = cm[HDR.STATUS];
  const cTipo  = cm[HDR.TIPO];
  const cEq    = cm[HDR.EQUIPE_RESP];
  const cCanal = cm[HDR.CANAL_ORIGEM];
  const cVert  = cm[HDR.VERTICAL];
  const cPort  = cm[HDR.PORTFOLIO];
  const cAnoM  = cm[HDR.ANO_MES_CRIACAO];
  const cFat   = cm[CALC.FATURA_N]   || cm[HDR.FATURA_LIQUIDO];
  const cLiq   = cm[CALC.LIQUIDO_N]  || cm[HDR.FATURA_LIQUIDO];
  const cFatur = cm[HDR.FATURADO];
  const cHoras = cm[CALC.HORAS_APS_N]|| cm[HDR.HORAS_APS];
  const sfArr  = statusFechadosArr();
  const sfN    = STATUS_FECHADOS.length;

  titulo(sh, sh.getRange('A1:L1'), '📊 PAINEL GERAL — Chamados Betha', cor);
  subtitulo(sh, sh.getRange('A2:L2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  // KPIs
  const kpis = [
    { label:'Total Chamados',   formula: cKey   ? `=COUNTA(${SRC}!${cKey}2:${cKey})-1` : '=""', cor: cor.c },
    { label:'Em Aberto',        formula: cSt    ? `=COUNTA(${SRC}!${cSt}2:${cSt})-1-MMULT(IFERROR(COUNTIF(${SRC}!${cSt}2:${cSt},TRANSPOSE(${sfArr})),0),SEQUENCE(${sfN},1,1,0))` : '=""', cor:'#fce8e6' },
    { label:'Concluídos',       formula: cSt    ? `=MMULT(IFERROR(COUNTIF(${SRC}!${cSt}2:${cSt},TRANSPOSE(${sfArr})),0),SEQUENCE(${sfN},1,1,0))` : '=""', cor:'#e6f4ea' },
    { label:'% Concluídos',     formula: `=IFERROR(TEXT(D5/A5,"0.0%"),"")`, cor:'#e6f4ea', formato:'@' },
    { label:'Faturado (R$)',    formula: cLiq   ? `=IFERROR(SUMIF(${SRC}!${cLiq}:${cLiq},">"&0),0)` : '=0', cor:'#fff8e1', formato:'R$ #,##0.00' },
    { label:'% Faturados',      formula: cFatur && cKey ? `=IFERROR(TEXT(COUNTIF(${SRC}!${cFatur}2:${cFatur},"Sim")/D5,"0.0%"),"")` : '=""', cor:'#fff8e1', formato:'@' },
    { label:'Total Horas APS',  formula: cHoras ? `=IFERROR(SUMIF(${SRC}!${cHoras}:${cHoras},">"&0),0)` : '=0', cor:'#f3e8fd', formato:'#,##0.00" h"' },
    { label:'Ticket Médio (R$)',formula: cLiq   ? `=IFERROR(SUMIF(${SRC}!${cLiq}:${cLiq},">"&0)/COUNTIF(${SRC}!${cLiq}:${cLiq},">"&0),0)` : '=0', cor:'#fff8e1', formato:'R$ #,##0.00' },
  ];
  kpiSet(sh, 4, 5, 1, kpis);
  sh.setRowHeights(4, 2, 36);
  for (let i = 1; i <= 8; i++) sh.setColumnWidth(i, 125);

  // Por Status
  let r = 7;
  if (cSt) {
    secBloco(sh, r, 1, 3, 'Por Status', cor); r++;
    cabHdr(sh, r, 1, ['Status','Qtd','%'], cor); r++;
    sh.getRange(r, 1).setFormula(
      `=IFERROR(QUERY(${SRC}!${cSt}2:${cSt},"SELECT ${cSt}, COUNT(${cSt}) WHERE ${cSt} <> '' GROUP BY ${cSt} ORDER BY COUNT(${cSt}) DESC LABEL ${cSt} 'Status', COUNT(${cSt}) 'Qtd'",0),{"",""})`
    );
    sh.getRange(r, 3).setFormula(
      `=ARRAYFORMULA(IF(B${r}:B="","",TEXT(B${r}:B/A5,"0.0%")))`
    );
    sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 70); sh.setColumnWidth(3, 70);
  }

  // Por Tipo
  let r2 = 7;
  if (cTipo) {
    secBloco(sh, r2, 5, 3, 'Por Tipo de Chamado', cor); r2++;
    cabHdr(sh, r2, 5, ['Tipo','Qtd','%'], cor); r2++;
    sh.getRange(r2, 5).setFormula(
      `=IFERROR(QUERY(${SRC}!${cTipo}2:${cTipo},"SELECT ${cTipo}, COUNT(${cTipo}) WHERE ${cTipo} <> '' GROUP BY ${cTipo} ORDER BY COUNT(${cTipo}) DESC LABEL ${cTipo} 'Tipo', COUNT(${cTipo}) 'Qtd'",0),{"",""})`
    );
    sh.getRange(r2, 7).setFormula(
      `=ARRAYFORMULA(IF(F${r2}:F="","",TEXT(F${r2}:F/A5,"0.0%")))`
    );
    sh.setColumnWidth(5, 200); sh.setColumnWidth(6, 70); sh.setColumnWidth(7, 70);
  }

  // Por Equipe e Canal
  const col3Start = 9;
  let r3 = 7;
  if (cEq) {
    secBloco(sh, r3, col3Start, 2, 'Por Equipe Responsável', cor); r3++;
    cabHdr(sh, r3, col3Start, ['Equipe','Qtd'], cor); r3++;
    sh.getRange(r3, col3Start).setFormula(
      `=IFERROR(QUERY(${SRC}!${cEq}2:${cEq},"SELECT ${cEq}, COUNT(${cEq}) WHERE ${cEq} <> '' GROUP BY ${cEq} ORDER BY COUNT(${cEq}) DESC LABEL ${cEq} 'Equipe', COUNT(${cEq}) 'Qtd'",0),{"",""})`
    );
    sh.setColumnWidth(col3Start, 160); sh.setColumnWidth(col3Start+1, 70);
  }

  // Evolução mensal
  const col4Start = 12;
  if (cAnoM) {
    sh.getRange(7, col4Start, 1, 3).merge().setValue('Evolução Mensal').setFontWeight('bold').setFontSize(10).setBackground(cor.c).setFontColor(cor.f);
    cabHdr(sh, 8, col4Start, ['Ano/Mês','Chamados', cLiq ? 'Faturado (R$)':''], cor);
    sh.getRange(9, col4Start).setFormula(
      `=IFERROR(QUERY(${SRC}!${cAnoM}2:${cAnoM},"SELECT ${cAnoM}, COUNT(${cAnoM}) WHERE ${cAnoM} IS NOT NULL GROUP BY ${cAnoM} ORDER BY ${cAnoM} ASC LABEL ${cAnoM} 'Mes', COUNT(${cAnoM}) 'Qtd'",0),{"",""})`
    );
    sh.getRange(9, col4Start).setNumberFormat('yyyy-MM');
    if (cLiq) {
      sh.getRange(9, col4Start+2).setFormula(
        `=ARRAYFORMULA(IF(${colLetter(col4Start)}9:${colLetter(col4Start)}="","",IFERROR(SUMIF(${SRC}!${cAnoM}:${cAnoM},${colLetter(col4Start)}9:${colLetter(col4Start)},${SRC}!${cLiq}:${cLiq}),0)))`
      );
      sh.getRange(9, col4Start+2, 100, 1).setNumberFormat('R$ #,##0.00');
    }
    sh.setColumnWidth(col4Start, 90); sh.setColumnWidth(col4Start+1, 80); sh.setColumnWidth(col4Start+2, 120);
  }

  // Por Vertical
  const col5 = 16;
  if (cVert) {
    sh.getRange(7, col5, 1, 2).merge().setValue('Por Vertical').setFontWeight('bold').setFontSize(10).setBackground(cor.c).setFontColor(cor.f);
    cabHdr(sh, 8, col5, ['Vertical','Qtd'], cor);
    sh.getRange(9, col5).setFormula(
      `=IFERROR(QUERY(${SRC}!${cVert}2:${cVert},"SELECT ${cVert}, COUNT(${cVert}) WHERE ${cVert} <> '' GROUP BY ${cVert} ORDER BY COUNT(${cVert}) DESC LABEL ${cVert} 'Vertical', COUNT(${cVert}) 'Qtd'",0),{"",""})`
    );
    sh.setColumnWidth(col5, 160); sh.setColumnWidth(col5+1, 70);
  }

  // Por Canal de Origem
  const col6 = 19;
  if (cCanal) {
    sh.getRange(7, col6, 1, 2).merge().setValue('Por Canal de Origem').setFontWeight('bold').setFontSize(10).setBackground(cor.c).setFontColor(cor.f);
    cabHdr(sh, 8, col6, ['Canal','Qtd'], cor);
    sh.getRange(9, col6).setFormula(
      `=IFERROR(QUERY(${SRC}!${cCanal}2:${cCanal},"SELECT ${cCanal}, COUNT(${cCanal}) WHERE ${cCanal} <> '' GROUP BY ${cCanal} ORDER BY COUNT(${cCanal}) DESC LABEL ${cCanal} 'Canal', COUNT(${cCanal}) 'Qtd'",0),{"",""})`
    );
    sh.setColumnWidth(col6, 160); sh.setColumnWidth(col6+1, 70);
  }

  sh.setFrozenRows(3);
  rodape(sh, shDados.getName());
}


// ============================================================
// PAINEL ANALISTA
// ============================================================

function _criarAnalista(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_ANALISTA);
  limpar(sh);
  const SRC  = srcRef(shEnr, shDados);
  const SRAW = "'" + shDados.getName() + "'";
  const cm   = shEnr ? colMapEnr : colMapSrc;
  const cor  = COR.ANALISTA;

  const cKey   = cm[HDR.CHAMADO];
  const cAn    = cm[HDR.ANALISTA];
  const cSup   = cm[HDR.RESP_SUP];
  const cSt    = cm[HDR.STATUS];
  const cTipo  = cm[HDR.TIPO];
  const cSis   = cm[HDR.SISTEMA];
  const cEnt   = cm[HDR.ENTIDADE];
  const cMun   = cm[HDR.MUNICIPIO];
  const cEq    = cm[HDR.EQUIPE_RESP];
  const cComp  = cm[HDR.COMPLEXIDADE];
  const cAnoM  = cm[HDR.ANO_MES_CRIACAO];
  const cFatur = cm[HDR.FATURADO];
  const cLiq   = cm[CALC.LIQUIDO_N]   || cm[HDR.FATURA_LIQUIDO];
  const cFat   = cm[CALC.FATURA_N]    || cm[HDR.VALOR_FATURA];
  const cDesc  = cm[CALC.DESCONTO_N]  || cm[HDR.VALOR_DESCONTO];
  const cHoras = cm[CALC.HORAS_APS_N] || cm[HDR.HORAS_APS];
  const cTG    = cm[CALC.TEMPO_GASTO_N]|| cm[HDR.TEMPO_GASTO];
  const cEst   = cm[CALC.ESTIMATIVA_N] || cm[HDR.ESTIMATIVA_H];
  const cEfic  = cm[CALC.EFICIENCIA];
  const cDiasT = cm[CALC.DIAS_TOTAL];

  titulo(sh, sh.getRange('A1:P1'), '👤 PAINEL POR ANALISTA', cor);
  subtitulo(sh, sh.getRange('A2:P2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  if (!cAn) {
    sh.getRange('A4').setValue('⚠️ Campo "' + HDR.ANALISTA + '" não encontrado na aba de dados.');
    return;
  }

  // KPIs globais de analista
  const kpis = [
    { label:'Analistas Únicos',        formula:`=IFERROR(SUMPRODUCT(1/COUNTIF(FILTER(${SRC}!${cAn}3:${cAn},${SRC}!${cAn}3:${cAn}<>""),FILTER(${SRC}!${cAn}3:${cAn},${SRC}!${cAn}3:${cAn}<>""))),0)`, cor: cor.c },
    { label:'Analistas com Aberto',    formula: cSt ? `=SUMPRODUCT((COUNTIFS(${SRC}!${cAn}3:${cAn},UNIQUE(FILTER(${SRC}!${cAn}3:${cAn},${SRC}!${cAn}3:${cAn}<>"")),${SRC}!${cSt}3:${cSt},"<>"&"")>0)*1)` : '=""', cor:'#fce8e6' },
    { label:'Total Faturado (R$)',     formula: cLiq ? `=IFERROR(SUMIF(${SRC}!${cLiq}:${cLiq},">"&0),0)` : '=0', cor:'#fff8e1', formato:'R$ #,##0.00' },
    { label:'Total Horas APS',         formula: cHoras ? `=IFERROR(SUMIF(${SRC}!${cHoras}:${cHoras},">"&0),0)` : '=0', cor:'#fff8e1', formato:'#,##0.00" h"' },
    { label:'Tempo Médio Resolução',   formula: cDiasT ? `=IFERROR(AVERAGEIF(${SRC}!${cDiasT}:${cDiasT},">"&0),"")` : '=""', cor: cor.c, formato:'0.0" dias"' },
  ];
  kpiSet(sh, 4, 5, 1, kpis);
  sh.setRowHeights(4, 2, 36);
  for (let i = 1; i <= 5; i++) sh.setColumnWidth(i, 145);

  // Tabela detalhada
  const LIN = 8;
  sh.getRange(LIN - 1, 1, 1, 16).merge().setValue('Detalhamento por Analista')
    .setFontWeight('bold').setFontSize(10).setBackground(cor.c).setFontColor(cor.f);

  const cols = ['Analista','Total','Em Aberto','Concluídos','% Conclusão'];
  if (cHoras)  cols.push('Horas APS');
  if (cTG)     cols.push('Tempo Gasto (h)');
  if (cEfic)   cols.push('Efic. APS/Gasto');
  if (cDiasT)  cols.push('Dias Méd. Resolução');
  if (cLiq)    cols.push('Fatura Líq. (R$)');
  if (cFat)    cols.push('Fatura Bruta (R$)');
  if (cDesc)   cols.push('Desconto (R$)');
  if (cFatur)  cols.push('Qt Faturados');
  if (cComp)   cols.push('Complexidade +');
  if (cSis)    cols.push('Sistema +');
  if (cMun||cEnt) cols.push('Cliente +');

  cabHdr(sh, LIN, 1, cols, cor);

  // Col A: lista de analistas (por volume decrescente via QUERY)
  sh.getRange(LIN+1, 1).setFormula(
    `=IFERROR(QUERY(${SRC}!${cAn}3:${cAn},"SELECT ${cAn}, COUNT(${cAn}) WHERE ${cAn} <> '' GROUP BY ${cAn} ORDER BY COUNT(${cAn}) DESC LABEL ${cAn} '', COUNT(${cAn}) ''",0),{""})`
  );
  // Mas queremos só a col A da lista → usamos INDEX
  sh.getRange(LIN+1, 1).setFormula(
    `=IFERROR(INDEX(QUERY(${SRC}!${cAn}3:${cAn},"SELECT ${cAn}, COUNT(${cAn}) WHERE ${cAn} <> '' GROUP BY ${cAn} ORDER BY COUNT(${cAn}) DESC LABEL ${cAn} '', COUNT(${cAn}) ''",0),,1),{""})`
  );

  let nc = 2;

  // Total
  sh.getRange(LIN+1, nc).setFormula(fMapCount(SRC, cAn, LIN+1)); nc++;

  // Em aberto
  if (cSt) {
    const sfArr = statusFechadosArr();
    const sfN   = STATUS_FECHADOS.length;
    sh.getRange(LIN+1, nc).setFormula(
      `=ARRAYFORMULA(IF(A${LIN+1}:A="","",COUNTIFS(${SRC}!${cAn}3:${cAn},A${LIN+1}:A,${SRC}!${cSt}3:${cSt},"<>"&"")-MMULT(IFERROR(COUNTIFS(${SRC}!${cAn}3:${cAn},A${LIN+1}:A,${SRC}!${cSt}3:${cSt},TRANSPOSE(${sfArr})),0),SEQUENCE(${sfN},1,1,0))))`
    );
    nc++;
    // Concluídos
    sh.getRange(LIN+1, nc).setFormula(fMapConc(SRC, cAn, LIN+1, cSt)); nc++;
    // % Conclusão
    sh.getRange(LIN+1, nc).setFormula(
      `=ARRAYFORMULA(IF(A${LIN+1}:A="","",IFERROR(TEXT(${colLetter(nc-1)}${LIN+1}:${colLetter(nc-1)}/B${LIN+1}:B,"0.0%"),"0.0%")))`
    );
    sh.getRange(LIN+1, nc, 300).setHorizontalAlignment('center'); nc++;
  } else { nc += 3; }

  if (cHoras)  { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cAn,LIN+1,cHoras)); sh.getRange(LIN+1,nc,300).setNumberFormat('#,##0.00'); nc++; }
  if (cTG)     { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cAn,LIN+1,cTG));    sh.getRange(LIN+1,nc,300).setNumberFormat('#,##0.00'); nc++; }
  if (cEfic)   { sh.getRange(LIN+1,nc).setFormula(fMapAvg(SRC,cAn,LIN+1,cEfic));   sh.getRange(LIN+1,nc,300).setNumberFormat('0.00%');    nc++; }
  if (cDiasT)  { sh.getRange(LIN+1,nc).setFormula(fMapAvg(SRC,cAn,LIN+1,cDiasT));  sh.getRange(LIN+1,nc,300).setNumberFormat('0.0');      nc++; }
  if (cLiq)    { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cAn,LIN+1,cLiq));   sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cFat)    { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cAn,LIN+1,cFat));   sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cDesc)   { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cAn,LIN+1,cDesc));  sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cFatur)  { sh.getRange(LIN+1,nc).setFormula(`=ARRAYFORMULA(IF(A${LIN+1}:A="","",COUNTIFS(${SRC}!${cAn}3:${cAn},A${LIN+1}:A,${SRC}!${cFatur}3:${cFatur},"Sim")))`); nc++; }
  if (cComp)   { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cAn,LIN+1,cComp)); nc++; }
  if (cSis)    { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cAn,LIN+1,cSis));  nc++; }
  if (cMun||cEnt) { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cAn,LIN+1,cMun||cEnt)); nc++; }

  // Barra de carga
  cabHdr(sh, LIN, nc, ['Carga Visual'], cor);
  sh.getRange(LIN+1, nc).setFormula(
    `=ARRAYFORMULA(IF(A${LIN+1}:A="","",IF(MAX(C${LIN+1}:C+D${LIN+1}:D)=0,"",REPT("█",ROUND((C${LIN+1}:C+D${LIN+1}:D)/MAX(C${LIN+1}:C+D${LIN+1}:D)*15,0)))))`
  );
  sh.getRange(LIN+1, nc, 300).setFontColor('#0f9d58').setFontSize(8);

  // Larguras
  sh.setFrozenRows(LIN);
  sh.setColumnWidth(1, 210);
  for (let i = 2; i <= nc; i++) sh.setColumnWidth(i, 110);
  sh.getRange(LIN+1, 2, 300, nc-1).setHorizontalAlignment('center');

  // Formatação condicional zebra
  const rng = sh.getRange(LIN+1, 1, 400, nc);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=AND($A${LIN+1}<>"",MOD(ROW()-${LIN},2)=0)`)
      .setBackground('#f1f8f4').setRanges([rng]).build()
  ]);

  rodape(sh, shDados.getName());
}


// ============================================================
// PAINEL FINANCEIRO
// ============================================================

function _criarFinanceiro(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_FINANCEIRO);
  limpar(sh);
  const SRC = srcRef(shEnr, shDados);
  const cm  = shEnr ? colMapEnr : colMapSrc;
  const cor = COR.FINANCEIRO;

  const cKey   = cm[HDR.CHAMADO];
  const cAn    = cm[HDR.ANALISTA];
  const cSis   = cm[HDR.SISTEMA];
  const cEnt   = cm[HDR.ENTIDADE];
  const cMun   = cm[HDR.MUNICIPIO];
  const cVert  = cm[HDR.VERTICAL];
  const cPort  = cm[HDR.PORTFOLIO];
  const cEq    = cm[HDR.EQUIPE_RESP];
  const cAnoM  = cm[HDR.ANO_MES_CRIACAO];
  const cFatur = cm[HDR.FATURADO];
  const cFat   = cm[CALC.FATURA_N]    || cm[HDR.VALOR_FATURA];
  const cLiq   = cm[CALC.LIQUIDO_N]   || cm[HDR.FATURA_LIQUIDO];
  const cDesc  = cm[CALC.DESCONTO_N]  || cm[HDR.VALOR_DESCONTO];
  const cHoras = cm[CALC.HORAS_APS_N] || cm[HDR.HORAS_APS];
  const cTG    = cm[CALC.TEMPO_GASTO_N]|| cm[HDR.TEMPO_GASTO];
  const cEst   = cm[CALC.ESTIMATIVA_N] || cm[HDR.ESTIMATIVA_H];
  const cHTV   = cm[HDR.HORA_TEC_VALOR];

  titulo(sh, sh.getRange('A1:M1'), '💰 PAINEL FINANCEIRO', cor);
  subtitulo(sh, sh.getRange('A2:M2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  // ── KPIs linha 4-5 ──
  const kpis = [
    { label:'Fatura Bruta (R$)',   formula: cFat  ? `=IFERROR(SUMIF(${SRC}!${cFat}:${cFat},">"&0),0)`  : '=0', formato:'R$ #,##0.00', cor:'#fff8e1' },
    { label:'Total Desconto (R$)', formula: cDesc ? `=IFERROR(SUMIF(${SRC}!${cDesc}:${cDesc},">"&0),0)`: '=0', formato:'R$ #,##0.00', cor:'#fce8e6' },
    { label:'Fatura Líquida (R$)', formula: cLiq  ? `=IFERROR(SUMIF(${SRC}!${cLiq}:${cLiq},">"&0),0)`  : '=0', formato:'R$ #,##0.00', cor:'#e6f4ea' },
    { label:'% Desconto Médio',    formula: (cFat&&cDesc) ? `=IFERROR(TEXT(B5/A5,"0.0%"),"")` : '=""', cor:'#fce8e6', formato:'@' },
    { label:'Ticket Médio (R$)',   formula: cLiq  ? `=IFERROR(C5/COUNTIF(${SRC}!${cLiq}:${cLiq},">"&0),0)` : '=0', formato:'R$ #,##0.00', cor:'#fff8e1' },
    { label:'Qtd Faturados',       formula: cFatur? `=COUNTIF(${SRC}!${cFatur}3:${cFatur},"Sim")` : '=0', cor:'#fff8e1' },
    { label:'% Chamados Faturados',formula: (cFatur&&cKey) ? `=IFERROR(TEXT(F5/COUNTA(${SRC}!${cKey}3:${cKey}),"0.0%"),"")` : '=""', cor:'#fff8e1', formato:'@' },
    { label:'Total Horas APS',     formula: cHoras? `=IFERROR(SUMIF(${SRC}!${cHoras}:${cHoras},">"&0),0)` : '=0', formato:'#,##0.0" h"', cor:'#f3e8fd' },
    { label:'R$/hora APS',         formula: (cLiq&&cHoras) ? `=IFERROR(C5/SUMIF(${SRC}!${cHoras}:${cHoras},">"&0),0)` : '=0', formato:'R$ #,##0.00', cor:'#f3e8fd' },
  ];
  kpiSet(sh, 4, 5, 1, kpis);
  sh.setRowHeights(4, 2, 36);
  for (let i = 1; i <= 9; i++) sh.setColumnWidth(i, 125);

  // ── Evolução Financeira Mensal ──
  let baseCol = 1;
  let baseRow = 7;
  if (cAnoM && cLiq) {
    secBloco(sh, baseRow, baseCol, 3, 'Evolução Financeira Mensal', cor);
    cabHdr(sh, baseRow+1, baseCol, ['Ano/Mês','Qtd Faturados','Líquido (R$)'], cor);
    sh.getRange(baseRow+2, baseCol).setFormula(
      `=IFERROR(QUERY(${SRC}!${cAnoM}2:${cAnoM},"SELECT ${cAnoM}, COUNT(${cAnoM}) WHERE ${cAnoM} IS NOT NULL GROUP BY ${cAnoM} ORDER BY ${cAnoM} ASC",0),{"",""})`
    );
    sh.getRange(baseRow+2, baseCol).setNumberFormat('yyyy-MM');
    sh.getRange(baseRow+2, baseCol+2).setFormula(
      `=ARRAYFORMULA(IF(${colLetter(baseCol)}${baseRow+2}:${colLetter(baseCol)}="","",IFERROR(SUMIF(${SRC}!${cAnoM}:${cAnoM},${colLetter(baseCol)}${baseRow+2}:${colLetter(baseCol)},${SRC}!${cLiq}:${cLiq}),0)))`
    );
    sh.getRange(baseRow+2, baseCol+2, 60).setNumberFormat('R$ #,##0.00');
    sh.setColumnWidth(baseCol, 90); sh.setColumnWidth(baseCol+1, 100); sh.setColumnWidth(baseCol+2, 130);
  }

  // ── Financeiro por Analista ──
  const c2 = 5;
  if (cAn && cLiq) {
    secBloco(sh, baseRow, c2, 5, 'Financeiro por Analista', cor);
    cabHdr(sh, baseRow+1, c2, ['Analista','Fatura Bruta','Desconto','Líquido','Ticket Médio'], cor);
    sh.getRange(baseRow+2, c2).setFormula(
      `=IFERROR(INDEX(QUERY(${SRC}!${cAn}3:${cAn},"SELECT ${cAn}, COUNT(${cAn}) WHERE ${cAn} <> '' GROUP BY ${cAn} ORDER BY COUNT(${cAn}) DESC LABEL ${cAn} '', COUNT(${cAn}) ''",0),,1),{""})`
    );
    const aR = `${colLetter(c2)}${baseRow+2}:${colLetter(c2)}`;
    if (cFat)  { sh.getRange(baseRow+2,c2+1).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(SUMIF(${SRC}!${cAn}:${cAn},${aR},${SRC}!${cFat}:${cFat}),0)))`);  sh.getRange(baseRow+2,c2+1,60).setNumberFormat('R$ #,##0.00'); }
    if (cDesc) { sh.getRange(baseRow+2,c2+2).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(SUMIF(${SRC}!${cAn}:${cAn},${aR},${SRC}!${cDesc}:${cDesc}),0)))`); sh.getRange(baseRow+2,c2+2,60).setNumberFormat('R$ #,##0.00'); }
    sh.getRange(baseRow+2,c2+3).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(SUMIF(${SRC}!${cAn}:${cAn},${aR},${SRC}!${cLiq}:${cLiq}),0)))`);
    sh.getRange(baseRow+2,c2+3,60).setNumberFormat('R$ #,##0.00');
    sh.getRange(baseRow+2,c2+4).setFormula(`=ARRAYFORMULA(IF(${colLetter(c2+3)}${baseRow+2}:${colLetter(c2+3)}="","",IFERROR(${colLetter(c2+3)}${baseRow+2}:${colLetter(c2+3)}/COUNTIF(${SRC}!${cAn}:${cAn},${aR}),0)))`);
    sh.getRange(baseRow+2,c2+4,60).setNumberFormat('R$ #,##0.00');
    sh.setColumnWidth(c2, 200);
    for (let i=1;i<=4;i++) sh.setColumnWidth(c2+i, 115);
  }

  // ── Financeiro por Sistema ──
  const c3 = 11;
  if (cSis && cLiq) {
    secBloco(sh, baseRow, c3, 3, 'Por Sistema', cor);
    cabHdr(sh, baseRow+1, c3, ['Sistema','Qtd Faturados','Líquido (R$)'], cor);
    sh.getRange(baseRow+2, c3).setFormula(
      `=IFERROR(INDEX(QUERY(${SRC}!${cSis}3:${cSis},"SELECT ${cSis}, COUNT(${cSis}) WHERE ${cSis} <> '' GROUP BY ${cSis} ORDER BY COUNT(${cSis}) DESC LABEL ${cSis} '', COUNT(${cSis}) ''",0),,1),{""})`
    );
    const sR = `${colLetter(c3)}${baseRow+2}:${colLetter(c3)}`;
    sh.getRange(baseRow+2,c3+1).setFormula(`=ARRAYFORMULA(IF(${sR}="","",IFERROR(COUNTIFS(${SRC}!${cSis}:${cSis},${sR},${SRC}!${cFatur}:${cFatur},"Sim"),0)))`);
    sh.getRange(baseRow+2,c3+2).setFormula(`=ARRAYFORMULA(IF(${sR}="","",IFERROR(SUMIF(${SRC}!${cSis}:${cSis},${sR},${SRC}!${cLiq}:${cLiq}),0)))`);
    sh.getRange(baseRow+2,c3+2,60).setNumberFormat('R$ #,##0.00');
    sh.setColumnWidth(c3, 220); sh.setColumnWidth(c3+1, 100); sh.setColumnWidth(c3+2, 130);
  }

  // ── Eficiência: Estimativa vs Gasto vs APS ──
  const c4 = 15;
  if (cAn && (cEst || cTG || cHoras)) {
    secBloco(sh, baseRow, c4, 4, 'Eficiência Horas por Analista', cor);
    const ehCols = ['Analista'];
    if (cEst)  ehCols.push('Estimativa (h)');
    if (cTG)   ehCols.push('Gasto (h)');
    if (cHoras)ehCols.push('APS (h)');
    if (cEst&&cTG) ehCols.push('Est/Gasto %');
    cabHdr(sh, baseRow+1, c4, ehCols, cor);
    sh.getRange(baseRow+2, c4).setFormula(
      `=IFERROR(INDEX(QUERY(${SRC}!${cAn}3:${cAn},"SELECT ${cAn}, COUNT(${cAn}) WHERE ${cAn} <> '' GROUP BY ${cAn} ORDER BY COUNT(${cAn}) DESC LABEL ${cAn} '', COUNT(${cAn}) ''",0),,1),{""})`
    );
    const eR = `${colLetter(c4)}${baseRow+2}:${colLetter(c4)}`;
    let ec = c4+1;
    if (cEst)  { sh.getRange(baseRow+2,ec).setFormula(`=ARRAYFORMULA(IF(${eR}="","",IFERROR(SUMIF(${SRC}!${cAn}:${cAn},${eR},${SRC}!${cEst}:${cEst}),0)))`); sh.getRange(baseRow+2,ec,60).setNumberFormat('#,##0.0'); ec++; }
    if (cTG)   { sh.getRange(baseRow+2,ec).setFormula(`=ARRAYFORMULA(IF(${eR}="","",IFERROR(SUMIF(${SRC}!${cAn}:${cAn},${eR},${SRC}!${cTG}:${cTG}),0)))`);  sh.getRange(baseRow+2,ec,60).setNumberFormat('#,##0.0'); ec++; }
    if (cHoras){ sh.getRange(baseRow+2,ec).setFormula(`=ARRAYFORMULA(IF(${eR}="","",IFERROR(SUMIF(${SRC}!${cAn}:${cAn},${eR},${SRC}!${cHoras}:${cHoras}),0)))`); sh.getRange(baseRow+2,ec,60).setNumberFormat('#,##0.0'); ec++; }
    if (cEst&&cTG) {
      sh.getRange(baseRow+2,ec).setFormula(
        `=ARRAYFORMULA(IF(${eR}="","",IFERROR(TEXT(${colLetter(c4+2)}${baseRow+2}:${colLetter(c4+2)}/${colLetter(c4+1)}${baseRow+2}:${colLetter(c4+1)},"0.0%"),"")))`
      );
    }
    sh.setColumnWidth(c4, 200);
    for (let i=1;i<=4;i++) sh.setColumnWidth(c4+i, 100);
  }

  sh.setFrozenRows(3);
  rodape(sh, shDados.getName());
}


// ============================================================
// PAINEL ENTIDADE
// ============================================================

function _criarEntidade(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_ENTIDADE);
  limpar(sh);
  const SRC = srcRef(shEnr, shDados);
  const cm  = shEnr ? colMapEnr : colMapSrc;
  const cor = COR.ENTIDADE;

  const cKey   = cm[HDR.CHAMADO];
  const cEnt   = cm[HDR.ENTIDADE];
  const cMun   = cm[HDR.MUNICIPIO];
  const cSt    = cm[HDR.STATUS];
  const cSis   = cm[HDR.SISTEMA];
  const cAn    = cm[HDR.ANALISTA];
  const cFatur = cm[HDR.FATURADO];
  const cLiq   = cm[CALC.LIQUIDO_N]  || cm[HDR.FATURA_LIQUIDO];
  const cFat   = cm[CALC.FATURA_N]   || cm[HDR.VALOR_FATURA];
  const cDesc  = cm[CALC.DESCONTO_N] || cm[HDR.VALOR_DESCONTO];
  const cHoras = cm[CALC.HORAS_APS_N]|| cm[HDR.HORAS_APS];
  const cDiasT = cm[CALC.DIAS_TOTAL];
  const cTipo  = cm[HDR.TIPO];

  titulo(sh, sh.getRange('A1:J1'), '🏛️ PAINEL POR ENTIDADE / CLIENTE', cor);
  subtitulo(sh, sh.getRange('A2:J2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  const cBase = cEnt || cMun;
  if (!cBase) {
    sh.getRange('A4').setValue('⚠️ Campos "' + HDR.ENTIDADE + '" e "' + HDR.MUNICIPIO + '" não encontrados.');
    return;
  }

  const kpis = [
    { label:'Total Entidades',     formula:`=IFERROR(SUMPRODUCT(1/COUNTIF(FILTER(${SRC}!${cBase}3:${cBase},${SRC}!${cBase}3:${cBase}<>""),FILTER(${SRC}!${cBase}3:${cBase},${SRC}!${cBase}3:${cBase}<>""))),0)`, cor: cor.c },
    { label:'Total Chamados',      formula: cKey ? `=COUNTA(${SRC}!${cKey}3:${cKey})` : '=0', cor: cor.c },
    { label:'Fatura Total (R$)',   formula: cLiq ? `=IFERROR(SUMIF(${SRC}!${cLiq}:${cLiq},">"&0),0)` : '=0', formato:'R$ #,##0.00', cor:'#fff8e1' },
    { label:'Ticket Médio (R$)',   formula: cLiq ? `=IFERROR(C5/COUNTIF(${SRC}!${cLiq}:${cLiq},">"&0),0)` : '=0', formato:'R$ #,##0.00', cor:'#fff8e1' },
  ];
  kpiSet(sh, 4, 5, 1, kpis);
  sh.setRowHeights(4, 2, 36);
  for (let i=1;i<=4;i++) sh.setColumnWidth(i, 150);

  const LIN = 7;
  const hdrEnt = ['Entidade','Total'];
  if (cSt)    hdrEnt.push('Em Aberto','Concluídos','% Conclusão');
  if (cLiq)   hdrEnt.push('Líquido (R$)');
  if (cFat)   hdrEnt.push('Bruto (R$)');
  if (cDesc)  hdrEnt.push('Desconto (R$)');
  if (cHoras) hdrEnt.push('Horas APS');
  if (cDiasT) hdrEnt.push('Dias Méd. Res.');
  if (cSis)   hdrEnt.push('Sistema +');
  if (cAn)    hdrEnt.push('Analista +');

  secBloco(sh, LIN-1, 1, hdrEnt.length, 'Por Entidade / Cliente', cor);
  cabHdr(sh, LIN, 1, hdrEnt, cor);

  sh.getRange(LIN+1, 1).setFormula(
    `=IFERROR(INDEX(QUERY(${SRC}!${cBase}3:${cBase},"SELECT ${cBase}, COUNT(${cBase}) WHERE ${cBase} <> '' GROUP BY ${cBase} ORDER BY COUNT(${cBase}) DESC LABEL ${cBase} '', COUNT(${cBase}) ''",0),,1),{""})`
  );

  let nc = 2;
  sh.getRange(LIN+1, nc).setFormula(fMapCount(SRC, cBase, LIN+1)); nc++;

  if (cSt) {
    const sfArr = statusFechadosArr(); const sfN = STATUS_FECHADOS.length;
    sh.getRange(LIN+1,nc).setFormula(
      `=ARRAYFORMULA(IF(A${LIN+1}:A="","",COUNTIFS(${SRC}!${cBase}3:${cBase},A${LIN+1}:A,${SRC}!${cSt}3:${cSt},"<>"&"")-MMULT(IFERROR(COUNTIFS(${SRC}!${cBase}3:${cBase},A${LIN+1}:A,${SRC}!${cSt}3:${cSt},TRANSPOSE(${sfArr})),0),SEQUENCE(${sfN},1,1,0))))`
    ); nc++;
    sh.getRange(LIN+1,nc).setFormula(fMapConc(SRC, cBase, LIN+1, cSt)); nc++;
    sh.getRange(LIN+1,nc).setFormula(
      `=ARRAYFORMULA(IF(A${LIN+1}:A="","",IFERROR(TEXT(${colLetter(nc-1)}${LIN+1}:${colLetter(nc-1)}/B${LIN+1}:B,"0.0%"),"")))`
    ); sh.getRange(LIN+1,nc,300).setHorizontalAlignment('center'); nc++;
  }
  if (cLiq)   { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cBase,LIN+1,cLiq));  sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cFat)   { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cBase,LIN+1,cFat));  sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cDesc)  { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cBase,LIN+1,cDesc)); sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cHoras) { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cBase,LIN+1,cHoras));sh.getRange(LIN+1,nc,300).setNumberFormat('#,##0.0'); nc++; }
  if (cDiasT) { sh.getRange(LIN+1,nc).setFormula(fMapAvg(SRC,cBase,LIN+1,cDiasT)); sh.getRange(LIN+1,nc,300).setNumberFormat('0.0'); nc++; }
  if (cSis)   { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cBase,LIN+1,cSis));  nc++; }
  if (cAn)    { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cBase,LIN+1,cAn));   nc++; }

  sh.setFrozenRows(LIN);
  sh.setColumnWidth(1, 310);
  for (let i=2;i<=nc;i++) sh.setColumnWidth(i, 105);

  // Tabela complementar: por município
  if (cMun && cMun !== cBase) {
    const c2 = nc + 2;
    secBloco(sh, LIN-1, c2, 3, 'Por Município', cor);
    cabHdr(sh, LIN, c2, ['Município','Total', cLiq ? 'Líquido (R$)' : ''], cor);
    sh.getRange(LIN+1, c2).setFormula(
      `=IFERROR(QUERY(${SRC}!${cMun}3:${cMun},"SELECT ${cMun}, COUNT(${cMun}) WHERE ${cMun} <> '' GROUP BY ${cMun} ORDER BY COUNT(${cMun}) DESC LABEL ${cMun} 'Município', COUNT(${cMun}) 'Total'",0),{"",""})`
    );
    if (cLiq) {
      const mR = `${colLetter(c2)}${LIN+1}:${colLetter(c2)}`;
      sh.getRange(LIN+1, c2+2).setFormula(
        `=ARRAYFORMULA(IF(${mR}="","",IFERROR(SUMIF(${SRC}!${cMun}:${cMun},${mR},${SRC}!${cLiq}:${cLiq}),0)))`
      );
      sh.getRange(LIN+1, c2+2, 300).setNumberFormat('R$ #,##0.00');
    }
    sh.setColumnWidth(c2, 200); sh.setColumnWidth(c2+1, 70); sh.setColumnWidth(c2+2, 130);
  }

  rodape(sh, shDados.getName());
}


// ============================================================
// PAINEL SISTEMA
// ============================================================

function _criarSistema(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_SISTEMA);
  limpar(sh);
  const SRC = srcRef(shEnr, shDados);
  const cm  = shEnr ? colMapEnr : colMapSrc;
  const cor = COR.SISTEMA;

  const cKey   = cm[HDR.CHAMADO];
  const cSis   = cm[HDR.SISTEMA];
  const cFunc  = cm[HDR.FUNCIONALIDADE];
  const cSt    = cm[HDR.STATUS];
  const cTipo  = cm[HDR.TIPO];
  const cComp  = cm[HDR.COMPLEXIDADE];
  const cVert  = cm[HDR.VERTICAL];
  const cAnoM  = cm[HDR.ANO_MES_CRIACAO];
  const cFatur = cm[HDR.FATURADO];
  const cLiq   = cm[CALC.LIQUIDO_N]   || cm[HDR.FATURA_LIQUIDO];
  const cHoras = cm[CALC.HORAS_APS_N] || cm[HDR.HORAS_APS];
  const cDiasT = cm[CALC.DIAS_TOTAL];

  titulo(sh, sh.getRange('A1:K1'), '🖥️ PAINEL POR SISTEMA / PRODUTO', cor);
  subtitulo(sh, sh.getRange('A2:K2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  if (!cSis) { sh.getRange('A4').setValue('⚠️ Campo "' + HDR.SISTEMA + '" não encontrado.'); return; }

  const LIN = 4;
  const hdrSis = ['Sistema','Total'];
  if (cSt)    hdrSis.push('Em Aberto','Concluídos','% Conclusão');
  if (cHoras) hdrSis.push('Horas APS');
  if (cLiq)   hdrSis.push('Líquido (R$)');
  if (cDiasT) hdrSis.push('Dias Méd. Res.');
  if (cComp)  hdrSis.push('Complexidade +');
  if (cFunc)  hdrSis.push('Funcionalidade +');

  cabHdr(sh, LIN, 1, hdrSis, cor);
  sh.getRange(LIN+1, 1).setFormula(
    `=IFERROR(INDEX(QUERY(${SRC}!${cSis}3:${cSis},"SELECT ${cSis}, COUNT(${cSis}) WHERE ${cSis} <> '' GROUP BY ${cSis} ORDER BY COUNT(${cSis}) DESC LABEL ${cSis} '', COUNT(${cSis}) ''",0),,1),{""})`
  );

  let nc = 2;
  sh.getRange(LIN+1,nc).setFormula(fMapCount(SRC,cSis,LIN+1)); nc++;

  if (cSt) {
    const sfArr = statusFechadosArr(); const sfN = STATUS_FECHADOS.length;
    sh.getRange(LIN+1,nc).setFormula(
      `=ARRAYFORMULA(IF(A${LIN+1}:A="","",COUNTIFS(${SRC}!${cSis}3:${cSis},A${LIN+1}:A,${SRC}!${cSt}3:${cSt},"<>"&"")-MMULT(IFERROR(COUNTIFS(${SRC}!${cSis}3:${cSis},A${LIN+1}:A,${SRC}!${cSt}3:${cSt},TRANSPOSE(${sfArr})),0),SEQUENCE(${sfN},1,1,0))))`
    ); nc++;
    sh.getRange(LIN+1,nc).setFormula(fMapConc(SRC,cSis,LIN+1,cSt)); nc++;
    sh.getRange(LIN+1,nc).setFormula(
      `=ARRAYFORMULA(IF(A${LIN+1}:A="","",IFERROR(TEXT(${colLetter(nc-1)}${LIN+1}:${colLetter(nc-1)}/B${LIN+1}:B,"0.0%"),"")))`
    ); sh.getRange(LIN+1,nc,300).setHorizontalAlignment('center'); nc++;
  }
  if (cHoras) { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cSis,LIN+1,cHoras)); sh.getRange(LIN+1,nc,300).setNumberFormat('#,##0.0'); nc++; }
  if (cLiq)   { sh.getRange(LIN+1,nc).setFormula(fMapSoma(SRC,cSis,LIN+1,cLiq));   sh.getRange(LIN+1,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
  if (cDiasT) { sh.getRange(LIN+1,nc).setFormula(fMapAvg(SRC,cSis,LIN+1,cDiasT)); sh.getRange(LIN+1,nc,300).setNumberFormat('0.0'); nc++; }
  if (cComp)  { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cSis,LIN+1,cComp)); nc++; }
  if (cFunc)  { sh.getRange(LIN+1,nc).setFormula(fMapModa(SRC,cSis,LIN+1,cFunc)); nc++; }

  sh.setFrozenRows(LIN);
  sh.setColumnWidth(1, 240);
  for (let i=2;i<=nc;i++) sh.setColumnWidth(i, 105);

  // Tipos por sistema
  const c2 = nc + 2;
  if (cTipo) {
    sh.getRange(LIN-1, c2, 1, 3).merge().setValue('Tipo de Chamado por Sistema').setFontWeight('bold').setFontSize(10).setBackground(cor.c).setFontColor(cor.f);
    cabHdr(sh, LIN, c2, ['Sistema','Tipo','Qtd'], cor);
    sh.getRange(LIN+1, c2).setFormula(
      `=IFERROR(QUERY(${SRC}!${cSis}3:${cTipo},"SELECT ${cSis}, ${cTipo}, COUNT(${cKey||cSis}) WHERE ${cSis} <> '' AND ${cTipo} <> '' GROUP BY ${cSis}, ${cTipo} ORDER BY COUNT(${cKey||cSis}) DESC LABEL ${cSis} 'Sistema', ${cTipo} 'Tipo', COUNT(${cKey||cSis}) 'Qtd'",0),{"","",""})`
    );
    sh.setColumnWidth(c2, 240); sh.setColumnWidth(c2+1, 180); sh.setColumnWidth(c2+2, 70);
  }

  // Evolução mensal por sistema (top 5)
  const c3 = c2 + 5;
  if (cAnoM && cSis) {
    sh.getRange(LIN-1, c3, 1, 3).merge().setValue('Volume Mensal por Sistema').setFontWeight('bold').setFontSize(10).setBackground(cor.c).setFontColor(cor.f);
    cabHdr(sh, LIN, c3, ['Ano/Mês','Sistema','Qtd'], cor);
    sh.getRange(LIN+1, c3).setFormula(
      `=IFERROR(QUERY(${SRC}!${cAnoM}3:${cSis},"SELECT ${cAnoM}, ${cSis}, COUNT(${cAnoM}) WHERE ${cAnoM} IS NOT NULL AND ${cSis} <> '' GROUP BY ${cAnoM}, ${cSis} ORDER BY ${cAnoM} ASC LABEL ${cAnoM} 'Mês', ${cSis} 'Sistema', COUNT(${cAnoM}) 'Qtd'",0),{"","",""})`
    );
    sh.getRange(LIN+1, c3).setNumberFormat('yyyy-MM');
    sh.setColumnWidth(c3, 90); sh.setColumnWidth(c3+1, 220); sh.setColumnWidth(c3+2, 70);
  }

  rodape(sh, shDados.getName());
}


// ============================================================
// PAINEL OPERACIONAL / TEMPO / SLA
// ============================================================

function _criarOperacional(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_OPERACIONAL);
  limpar(sh);
  const SRC = srcRef(shEnr, shDados);
  const cm  = shEnr ? colMapEnr : colMapSrc;
  const cor = COR.OPERACIONAL;

  const cKey   = cm[HDR.CHAMADO];
  const cAn    = cm[HDR.ANALISTA];
  const cSis   = cm[HDR.SISTEMA];
  const cEq    = cm[HDR.EQUIPE_RESP];
  const cTipo  = cm[HDR.TIPO];
  const cSt    = cm[HDR.STATUS];
  const cAnoM  = cm[HDR.ANO_MES_CRIACAO];
  const cDiasT = cm[CALC.DIAS_TOTAL];
  const cDiasTriag= cm[CALC.DIAS_TRIAGEM];
  const cDiasEnc  = cm[CALC.DIAS_ENC_TRI];
  const cDiasEnc2 = cm[CALC.DIAS_ENCAMP];

  titulo(sh, sh.getRange('A1:J1'), '⏱️ PAINEL OPERACIONAL — Tempos & SLA', cor);
  subtitulo(sh, sh.getRange('A2:J2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  const tempoDisp = cDiasT || cDiasTriag;
  if (!tempoDisp) {
    sh.getRange('A4').setValue(
      '⚠️ Execute "Enriquecer dados" primeiro (campos de tempo precisam ser calculados).\n' +
      'Os campos necessários na aba de dados: "' + HDR.DATA_CRIACAO + '" e "' + HDR.DATA_RESOLUCAO + '".'
    ).setWrap(true);
    sh.setRowHeight(4, 60);
    return;
  }

  // KPIs
  const kpis = [
    { label:'Dias Méd. Abertura→Resolução', formula: cDiasT    ? `=IFERROR(AVERAGEIF(${SRC}!${cDiasT}:${cDiasT},">"&0),"")` : '=""', formato:'0.0" dias"', cor: cor.c },
    { label:'Dias Méd. Abertura→Triagem',   formula: cDiasTriag? `=IFERROR(AVERAGEIF(${SRC}!${cDiasTriag}:${cDiasTriag},">"&0),"")` : '=""', formato:'0.0" dias"', cor: cor.c },
    { label:'Dias Méd. Triagem→Encerr.',    formula: cDiasEnc  ? `=IFERROR(AVERAGEIF(${SRC}!${cDiasEnc}:${cDiasEnc},">"&0),"")` : '=""', formato:'0.0" dias"', cor: cor.c },
    { label:'Resolvidos ≤ 7 dias',          formula: cDiasT    ? `=COUNTIFS(${SRC}!${cDiasT}:${cDiasT},">"&0,${SRC}!${cDiasT}:${cDiasT},"<="&7)` : '=0', cor:'#e6f4ea' },
    { label:'Resolvidos > 30 dias',         formula: cDiasT    ? `=COUNTIF(${SRC}!${cDiasT}:${cDiasT},">"&30)` : '=0', cor:'#fce8e6' },
    { label:'Sem data de resolução',        formula: cSt       ? `=SUMPRODUCT(--(ISERROR(MATCH(${SRC}!${cSt}3:${cSt},{"${STATUS_FECHADOS.join('","')}"},0)))*(${SRC}!${cSt}3:${cSt}<>""))` : '=0', cor:'#fce8e6' },
  ];
  kpiSet(sh, 4, 5, 1, kpis);
  sh.setRowHeights(4, 2, 36);
  for (let i=1;i<=6;i++) sh.setColumnWidth(i, 140);

  // Distribuição de tempo de resolução
  const LIN = 7;
  if (cDiasT) {
    secBloco(sh, LIN, 1, 3, 'Distribuição por Faixa de Tempo (Resolução)', cor);
    cabHdr(sh, LIN+1, 1, ['Faixa','Qtd','%'], cor);
    const faixas = [
      ['Mesmo dia (0)',          `=COUNTIF(${SRC}!${cDiasT}:${cDiasT},0)`],
      ['1 a 3 dias',             `=COUNTIFS(${SRC}!${cDiasT}:${cDiasT},">="&1,${SRC}!${cDiasT}:${cDiasT},"<="&3)`],
      ['4 a 7 dias',             `=COUNTIFS(${SRC}!${cDiasT}:${cDiasT},">="&4,${SRC}!${cDiasT}:${cDiasT},"<="&7)`],
      ['8 a 15 dias',            `=COUNTIFS(${SRC}!${cDiasT}:${cDiasT},">="&8,${SRC}!${cDiasT}:${cDiasT},"<="&15)`],
      ['16 a 30 dias',           `=COUNTIFS(${SRC}!${cDiasT}:${cDiasT},">="&16,${SRC}!${cDiasT}:${cDiasT},"<="&30)`],
      ['Mais de 30 dias',        `=COUNTIF(${SRC}!${cDiasT}:${cDiasT},">"&30)`],
      ['Ainda abertos / s/ data',`=COUNTBLANK(${SRC}!${cDiasT}2:${cDiasT})-1`],
    ];
    faixas.forEach(([label, f], i) => {
      sh.getRange(LIN+2+i, 1).setValue(label);
      sh.getRange(LIN+2+i, 2).setFormula(f);
    });
    const totalResolvidos = `=IFERROR(SUM(B${LIN+2}:B${LIN+2+faixas.length-1}),0)`;
    sh.getRange(LIN+2, 3).setFormula(
      `=ARRAYFORMULA(IF(B${LIN+2}:B${LIN+2+faixas.length-1}="","",TEXT(B${LIN+2}:B${LIN+2+faixas.length-1}/A5,"0.0%")))`
    );
    sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 70); sh.setColumnWidth(3, 70);
  }

  // Tempo médio por analista
  const c2 = 5;
  if (cAn && (cDiasT || cDiasTriag)) {
    secBloco(sh, LIN, c2, 4, 'Tempo Médio por Analista', cor);
    const hTA = ['Analista', cDiasT ? 'Méd. Total (dias)' : '', cDiasTriag ? 'Méd. Triagem (dias)' : '', 'Qtd Concluídos'].filter(Boolean);
    cabHdr(sh, LIN+1, c2, hTA, cor);
    sh.getRange(LIN+2, c2).setFormula(
      `=IFERROR(INDEX(QUERY(${SRC}!${cAn}3:${cAn},"SELECT ${cAn}, COUNT(${cAn}) WHERE ${cAn} <> '' GROUP BY ${cAn} ORDER BY COUNT(${cAn}) DESC LABEL ${cAn} '', COUNT(${cAn}) ''",0),,1),{""})`
    );
    const aR = `${colLetter(c2)}${LIN+2}:${colLetter(c2)}`;
    let tc = c2+1;
    if (cDiasT)    { sh.getRange(LIN+2,tc).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(AVERAGEIF(${SRC}!${cAn}:${cAn},${aR},${SRC}!${cDiasT}:${cDiasT}),0)))`); sh.getRange(LIN+2,tc,300).setNumberFormat('0.0'); tc++; }
    if (cDiasTriag){ sh.getRange(LIN+2,tc).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(AVERAGEIF(${SRC}!${cAn}:${cAn},${aR},${SRC}!${cDiasTriag}:${cDiasTriag}),0)))`); sh.getRange(LIN+2,tc,300).setNumberFormat('0.0'); tc++; }
    sh.getRange(LIN+2,tc).setFormula(fMapConc(SRC,cAn,LIN+2,cSt));
    sh.setColumnWidth(c2, 200);
    for (let i=1;i<4;i++) sh.setColumnWidth(c2+i, 115);
  }

  // Tempo médio por sistema
  const c3 = 10;
  if (cSis && cDiasT) {
    secBloco(sh, LIN, c3, 3, 'Tempo Médio por Sistema', cor);
    cabHdr(sh, LIN+1, c3, ['Sistema','Méd. Dias Res.','Qtd'], cor);
    sh.getRange(LIN+2, c3).setFormula(
      `=IFERROR(INDEX(QUERY(${SRC}!${cSis}3:${cSis},"SELECT ${cSis}, COUNT(${cSis}) WHERE ${cSis} <> '' GROUP BY ${cSis} ORDER BY COUNT(${cSis}) DESC LABEL ${cSis} '', COUNT(${cSis}) ''",0),,1),{""})`
    );
    const sR = `${colLetter(c3)}${LIN+2}:${colLetter(c3)}`;
    sh.getRange(LIN+2,c3+1).setFormula(`=ARRAYFORMULA(IF(${sR}="","",IFERROR(AVERAGEIF(${SRC}!${cSis}:${cSis},${sR},${SRC}!${cDiasT}:${cDiasT}),0)))`);
    sh.getRange(LIN+2,c3+1,300).setNumberFormat('0.0');
    sh.getRange(LIN+2,c3+2).setFormula(fMapCount(SRC,cSis,LIN+2));
    sh.setColumnWidth(c3, 230); sh.setColumnWidth(c3+1, 115); sh.setColumnWidth(c3+2, 70);
  }

  // Funil de estágios (médias em sequência)
  if (cDiasTriag || cDiasEnc || cDiasT) {
    const funnelRow = LIN + 12;
    secBloco(sh, funnelRow, 1, 4, 'Funil de Tempo Médio por Estágio', cor);
    const estagios = [];
    if (cDiasTriag) estagios.push(['Abertura → Triagem', `=IFERROR(AVERAGEIF(${SRC}!${cDiasTriag}:${cDiasTriag},">"&0),"")`]);
    if (cDiasEnc)   estagios.push(['Triagem → Encerr. Triagem', `=IFERROR(AVERAGEIF(${SRC}!${cDiasEnc}:${cDiasEnc},">"&0),"")`]);
    if (cDiasEnc2)  estagios.push(['Encerr. Triagem → Encaminhamento', `=IFERROR(AVERAGEIF(${SRC}!${cDiasEnc2}:${cDiasEnc2},">"&0),"")`]);
    if (cDiasT)     estagios.push(['Abertura → Resolução (total)', `=IFERROR(AVERAGEIF(${SRC}!${cDiasT}:${cDiasT},">"&0),"")`]);
    cabHdr(sh, funnelRow+1, 1, ['Estágio','Média (dias)','Barra'], cor);
    estagios.forEach(([label, f], i) => {
      sh.getRange(funnelRow+2+i, 1).setValue(label);
      sh.getRange(funnelRow+2+i, 2).setFormula(f).setNumberFormat('0.0');
    });
    // Barra visual proporcional
    const funnelDataRange = `B${funnelRow+2}:B${funnelRow+2+estagios.length-1}`;
    sh.getRange(funnelRow+2, 3).setFormula(
      `=ARRAYFORMULA(IF(${funnelDataRange}="","",REPT("█",ROUND(${funnelDataRange}/MAX(${funnelDataRange})*20,0))))`
    );
    sh.getRange(funnelRow+2, 3, estagios.length).setFontColor('#d93025').setFontSize(8);
  }

  sh.setFrozenRows(3);
  rodape(sh, shDados.getName());
}


// ============================================================
// PAINEL VERTICAL / PORTFOLIO / CANAL
// ============================================================

function _criarVertical(shDados, colMapSrc, colMapEnr, shEnr) {
  const sh  = getOrCreate(DB_VERTICAL);
  limpar(sh);
  const SRC = srcRef(shEnr, shDados);
  const cm  = shEnr ? colMapEnr : colMapSrc;
  const cor = COR.VERTICAL;

  const cKey   = cm[HDR.CHAMADO];
  const cVert  = cm[HDR.VERTICAL];
  const cPort  = cm[HDR.PORTFOLIO];
  const cCanal = cm[HDR.CANAL_ORIGEM];
  const cFunc  = cm[HDR.FUNCIONALIDADE];
  const cSis   = cm[HDR.SISTEMA];
  const cSt    = cm[HDR.STATUS];
  const cTipo  = cm[HDR.TIPO];
  const cComp  = cm[HDR.COMPLEXIDADE];
  const cFatur = cm[HDR.FATURADO];
  const cLiq   = cm[CALC.LIQUIDO_N]   || cm[HDR.FATURA_LIQUIDO];
  const cHoras = cm[CALC.HORAS_APS_N] || cm[HDR.HORAS_APS];
  const cDiasT = cm[CALC.DIAS_TOTAL];

  titulo(sh, sh.getRange('A1:L1'), '📐 PAINEL VERTICAL / PORTFOLIO / CANAL', cor);
  subtitulo(sh, sh.getRange('A2:L2'),
    '=IFERROR("Fonte: "+VLOOKUP("FONTE_DADOS",_DB_CONFIG!A:B,2,0),"")&"  |  Atualizado: "&TEXT(NOW(),"dd/mm/yyyy hh:mm")');

  // Bloco helper para tabelas de dimensão
  function blocoTabela(sh, cor, linInicio, colInicio, campo, nomeCampo, ncExtra) {
    if (!campo) return;
    const hdr = [nomeCampo,'Total'];
    if (cSt)    hdr.push('Concluídos','% Conclusão');
    if (cLiq)   hdr.push('Líquido (R$)');
    if (cHoras) hdr.push('Horas APS');
    if (ncExtra) ncExtra.forEach(h => hdr.push(h));

    secBloco(sh, linInicio, colInicio, hdr.length, 'Por ' + nomeCampo, cor);
    cabHdr(sh, linInicio+1, colInicio, hdr, cor);

    const ancCol = colLetter(colInicio);
    sh.getRange(linInicio+2, colInicio).setFormula(
      `=IFERROR(INDEX(QUERY(${SRC}!${campo}3:${campo},"SELECT ${campo}, COUNT(${campo}) WHERE ${campo} <> '' GROUP BY ${campo} ORDER BY COUNT(${campo}) DESC LABEL ${campo} '', COUNT(${campo}) ''",0),,1),{""})`
    );
    const aR = `${ancCol}${linInicio+2}:${ancCol}`;
    let nc = colInicio+1;
    sh.getRange(linInicio+2,nc).setFormula(fMapCount(SRC,campo,linInicio+2)); nc++;
    if (cSt) {
      sh.getRange(linInicio+2,nc).setFormula(fMapConc(SRC,campo,linInicio+2,cSt)); nc++;
      sh.getRange(linInicio+2,nc).setFormula(`=ARRAYFORMULA(IF(${ancCol}${linInicio+2}:${ancCol}="","",IFERROR(TEXT(${colLetter(nc-1)}${linInicio+2}:${colLetter(nc-1)}/${colLetter(nc-2)}${linInicio+2}:${colLetter(nc-2)},"0.0%"),"")))`); nc++;
    }
    if (cLiq)   { sh.getRange(linInicio+2,nc).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(SUMIF(${SRC}!${campo}:${campo},${aR},${SRC}!${cLiq}:${cLiq}),0)))`); sh.getRange(linInicio+2,nc,300).setNumberFormat('R$ #,##0.00'); nc++; }
    if (cHoras) { sh.getRange(linInicio+2,nc).setFormula(`=ARRAYFORMULA(IF(${aR}="","",IFERROR(SUMIF(${SRC}!${campo}:${campo},${aR},${SRC}!${cHoras}:${cHoras}),0)))`); sh.getRange(linInicio+2,nc,300).setNumberFormat('#,##0.0'); nc++; }
    sh.setColumnWidth(colInicio, 200);
    for (let i=1; i<hdr.length; i++) sh.setColumnWidth(colInicio+i, 100);
    return nc;
  }

  const LIN = 4;
  let nc1 = blocoTabela(sh, cor, LIN, 1, cVert,  'Vertical',   null) || 5;
  let nc2 = blocoTabela(sh, cor, LIN, nc1+2, cPort, 'Portfolio', null) || (nc1+7);
  blocoTabela(sh, cor, LIN, nc2+2, cCanal, 'Canal de Origem', null);

  // Por Funcionalidade (top 30)
  const col4 = 1;
  const LIN2 = LIN + 16;
  if (cFunc) {
    secBloco(sh, LIN2, col4, 4, 'Top Funcionalidades com Mais Chamados', cor);
    cabHdr(sh, LIN2+1, col4, ['Funcionalidade','Sistema','Total', cLiq ? 'Líquido (R$)' : ''], cor);
    sh.getRange(LIN2+2, col4).setFormula(
      `=IFERROR(QUERY(${SRC}!${cFunc}3:${cSis || cFunc},"SELECT ${cFunc}, ${cSis || cFunc}, COUNT(${cFunc}) WHERE ${cFunc} <> '' GROUP BY ${cFunc}, ${cSis || cFunc} ORDER BY COUNT(${cFunc}) DESC LABEL ${cFunc} 'Funcionalidade', ${cSis || cFunc} 'Sistema', COUNT(${cFunc}) 'Total'",0),{"","",""})`
    );
    if (cLiq) {
      const fR = `${colLetter(col4)}${LIN2+2}:${colLetter(col4)}`;
      sh.getRange(LIN2+2, col4+3).setFormula(
        `=ARRAYFORMULA(IF(${fR}="","",IFERROR(SUMIF(${SRC}!${cFunc}:${cFunc},${fR},${SRC}!${cLiq}:${cLiq}),0)))`
      );
      sh.getRange(LIN2+2, col4+3, 300).setNumberFormat('R$ #,##0.00');
    }
    sh.setColumnWidth(col4, 250); sh.setColumnWidth(col4+1, 220); sh.setColumnWidth(col4+2, 70); sh.setColumnWidth(col4+3, 130);
  }

  // Complexidade por Vertical e Sistema cruzados
  const col5 = 8;
  if (cComp && (cVert || cSis)) {
    const campo = cVert || cSis;
    const nome  = cVert ? 'Vertical' : 'Sistema';
    secBloco(sh, LIN2, col5, 3, 'Complexidade × ' + nome, cor);
    cabHdr(sh, LIN2+1, col5, [nome,'Complexidade','Qtd'], cor);
    sh.getRange(LIN2+2, col5).setFormula(
      `=IFERROR(QUERY(${SRC}!${campo}3:${cComp},"SELECT ${campo}, ${cComp}, COUNT(${campo}) WHERE ${campo} <> '' AND ${cComp} <> '' GROUP BY ${campo}, ${cComp} ORDER BY COUNT(${campo}) DESC LABEL ${campo} '${nome}', ${cComp} 'Complexidade', COUNT(${campo}) 'Qtd'",0),{"","",""})`
    );
    sh.setColumnWidth(col5, 200); sh.setColumnWidth(col5+1, 140); sh.setColumnWidth(col5+2, 70);
  }

  sh.setFrozenRows(3);
  rodape(sh, shDados.getName());
}


// ============================================================
// PERSISTÊNCIA (_DB_CONFIG, aba oculta)
// ============================================================

function gravarConfigDB(chave, valor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh   = ss.getSheetByName(DB_CONFIG);
  if (!sh) { sh = ss.insertSheet(DB_CONFIG); sh.hideSheet(); }
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === chave) { sh.getRange(i+1, 2).setValue(valor); return; }
  }
  sh.appendRow([chave, valor]);
}

function lerConfigDB(chave) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(DB_CONFIG);
  if (!sh) return null;
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) { if (data[i][0] === chave) return data[i][1]; }
  return null;
}
