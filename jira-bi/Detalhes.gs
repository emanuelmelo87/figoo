// ============================================================
// Detalhes.gs — Drill-down com link direto para o JIRA
// Requer: Dashboard.gs no mesmo projeto Apps Script
// ============================================================

const DET_SHEET     = '🔍 Detalhes';
const JIRA_BROWSE   = 'https://atendimento.betha.com.br/browse/';
const DET_LABEL_COL = 1;   // col A: label do filtro
const DET_INPUT_COL = 2;   // col B: valor do filtro
const DET_HDR_ROW   = 14;  // linha do cabeçalho dos resultados
const DET_DATA_ROW  = 15;  // primeira linha de dados
const DET_MAX_ROWS  = 2000;

// Filtros disponíveis
// contains:true → busca parcial (LIKE); false → match exato
const DET_FILTROS = [
  { row: 4,  key: 'ANALISTA',        label: '👤 Analista',     contains: false },
  { row: 5,  key: 'SISTEMA',         label: '🖥️ Sistema',      contains: false },
  { row: 6,  key: 'STATUS',          label: '🔵 Status',        contains: false },
  { row: 7,  key: 'EQUIPE_RESP',     label: '👥 Equipe',        contains: false },
  { row: 8,  key: 'TIPO',            label: '🏷️ Tipo',          contains: false },
  { row: 9,  key: 'ANO_MES_CRIACAO', label: '📅 Mês Criação',  contains: false },
  { row: 10, key: 'ENTIDADE',        label: '🏛️ Entidade',     contains: true  },
  { row: 11, key: 'COMPLEXIDADE',    label: '⚙️ Complexidade', contains: false },
  { row: 12, key: 'MUNICIPIO',       label: '📍 Município',     contains: true  },
];

// Retorna a definição das colunas de resultado
// (função para garantir que HDR/CALC já foram inicializados)
function _getDETResultCols() {
  return [
    { hdr: HDR.CHAMADO,          label: 'Chamado',       width: 140, isLink: true },
    { hdr: HDR.ANALISTA,         label: 'Analista',      width: 165 },
    { hdr: HDR.RESP_SUP,         label: 'Resp. SUP',     width: 155 },
    { hdr: HDR.STATUS,           label: 'Status',        width: 130 },
    { hdr: HDR.TIPO,             label: 'Tipo',          width: 130 },
    { hdr: HDR.SISTEMA,          label: 'Sistema',       width: 160 },
    { hdr: HDR.ENTIDADE,         label: 'Entidade',      width: 200 },
    { hdr: HDR.MUNICIPIO,        label: 'Município',     width: 140 },
    { hdr: HDR.EQUIPE_RESP,      label: 'Equipe',        width: 130 },
    { hdr: HDR.VERTICAL,         label: 'Vertical',      width: 130 },
    { hdr: HDR.PORTFOLIO,        label: 'Portfolio',     width: 130 },
    { hdr: HDR.COMPLEXIDADE,     label: 'Complexidade',  width: 110 },
    { hdr: HDR.ANO_MES_CRIACAO,  label: 'Mês Criação',  width: 100 },
    { hdr: HDR.DATA_CRIACAO,     label: 'Criação',       width: 100 },
    { hdr: HDR.DATA_RESOLUCAO,   label: 'Resolução',     width: 100 },
    { hdr: CALC.DIAS_TOTAL,      label: 'Dias',          width:  55 },
    { hdr: HDR.FATURA_LIQUIDO,   label: 'Fat. Líquido',  width: 110 },
    { hdr: HDR.HORAS_APS,        label: 'Horas APS',     width:  90 },
    { hdr: HDR.TEMPO_GASTO,      label: 'Tempo Gasto',   width: 100 },
    { hdr: HDR.CANAL_ORIGEM,     label: 'Origem',        width: 120 },
  ];
}

// Mapeamento: painel ativo → filtro padrão ao usar "Ver detalhes do selecionado"
function _getPainelFiltroMap() {
  return {
    [DB_ANALISTA]   : 'ANALISTA',
    [DB_SISTEMA]    : 'SISTEMA',
    [DB_ENTIDADE]   : 'ENTIDADE',
    [DB_OPERACIONAL]: 'ANALISTA',
  };
}


// ============================================================
// CRIAR PAINEL DETALHES
// ============================================================

function criarPainelDetalhes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh   = ss.getSheetByName(DET_SHEET);
  if (!sh) sh = ss.insertSheet(DET_SHEET);
  else { sh.clearContents(); sh.clearFormats(); }

  const COLS = _getDETResultCols();
  const N    = COLS.length;
  const C    = { f: '#1a237e', m: '#3949ab', c: '#e8eaf6', t: '#ffffff' };

  // Título
  sh.getRange(1, 1, 1, N).merge()
    .setValue('🔍 Drill-down — Detalhes dos Chamados')
    .setBackground(C.f).setFontColor(C.t)
    .setFontSize(14).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(1, 38);

  // Instrução
  sh.getRange(2, 1, 1, N).merge()
    .setValue('Defina os filtros → Menu: Chamados Betha → 📊 Painéis BI → 🔍 Filtrar detalhes   |   Clique no número do chamado para abrir no JIRA')
    .setBackground(C.c).setFontColor(C.f)
    .setFontSize(10).setHorizontalAlignment('center');
  sh.setRowHeight(2, 22);

  // Cabeçalho filtros
  sh.getRange(3, 1, 1, 2).merge()
    .setValue('⚙️  FILTROS  —  deixe vazio para não filtrar por esse campo')
    .setBackground(C.m).setFontColor(C.t)
    .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
  sh.setRowHeight(3, 22);

  // Linhas de filtro
  DET_FILTROS.forEach(f => {
    sh.getRange(f.row, DET_LABEL_COL)
      .setValue(f.label)
      .setBackground('#ede7f6').setFontColor('#37474f')
      .setFontWeight('bold').setFontSize(10)
      .setHorizontalAlignment('right').setVerticalAlignment('middle');
    sh.getRange(f.row, DET_INPUT_COL)
      .setBackground('#ffffff')
      .setBorder(true, true, true, true, false, false, '#9fa8da', SpreadsheetApp.BorderStyle.SOLID);
    sh.setRowHeight(f.row, 24);
  });

  // Barra de status (atualizada pelo filtro)
  sh.getRange(13, 1, 1, N).merge()
    .setValue('▶  Nenhuma busca realizada. Execute "🔍 Filtrar detalhes" no menu.')
    .setBackground('#f5f5f5').setFontColor('#78909c')
    .setFontStyle('italic').setFontSize(10).setHorizontalAlignment('center');
  sh.setRowHeight(13, 22);

  // Cabeçalho colunas resultado
  sh.getRange(DET_HDR_ROW, 1, 1, N).setValues([COLS.map(c => c.label)])
    .setBackground(C.f).setFontColor(C.t)
    .setFontWeight('bold').setFontSize(10);
  sh.setRowHeight(DET_HDR_ROW, 22);

  // Larguras (col A e B compartilhadas com área de filtros)
  COLS.forEach((c, i) => sh.setColumnWidth(i + 1, c.width || 100));
  // Garante col B larga o suficiente para dropdowns
  if ((COLS[1] ? COLS[1].width : 0) < 200) sh.setColumnWidth(2, 200);

  sh.setFrozenRows(DET_HDR_ROW);

  _popularDropdownsDetalhes(sh);

  ss.toast('Aba 🔍 Detalhes criada. Configure os filtros e execute "Filtrar detalhes".', DET_SHEET, 6);
}


// ============================================================
// FILTRAR DETALHES
// ============================================================

function filtrarDetalhes() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sh    = ss.getSheetByName(DET_SHEET);
  if (!sh) { criarPainelDetalhes(); sh = ss.getSheetByName(DET_SHEET); }

  const shEnr   = ss.getSheetByName(DB_ENRIQUECIDOS);
  const shDados = getSheetDados();
  const src     = shEnr || shDados;
  const colIdx  = buildColIndexMap(src);
  const lastRow = src.getLastRow();

  if (lastRow < 3) {
    SpreadsheetApp.getUi().alert('Nenhum dado. Importe os chamados primeiro.');
    return;
  }

  ss.toast('Filtrando dados...', '🔍', 45);

  // Lê filtros ativos do painel
  const filtrosAtivos = DET_FILTROS.map(f => {
    const raw = String(sh.getRange(f.row, DET_INPUT_COL).getValue()).trim();
    const val = (raw === '' || raw === '(Todos)') ? null : raw;
    const ci  = colIdx[HDR[f.key]];
    return { ...f, valor: val, srcIdx: ci ? ci - 1 : -1 };
  }).filter(f => f.valor !== null && f.srcIdx >= 0);

  // Mapeia colunas de resultado para índices na fonte
  const COLS  = _getDETResultCols();
  const N     = COLS.length;
  const resMap = COLS.map(c => ({
    ...c,
    srcIdx: colIdx[c.hdr] !== undefined ? colIdx[c.hdr] - 1 : -1,
  }));

  // Lê todos os dados
  const lastCol = src.getLastColumn();
  const allData = src.getRange(3, 1, lastRow - 2, lastCol).getValues();

  // Aplica filtros
  const filtered = [];
  for (let i = 0; i < allData.length && filtered.length < DET_MAX_ROWS; i++) {
    const row  = allData[i];
    let   pass = true;
    for (const f of filtrosAtivos) {
      const cell = String(row[f.srcIdx] || '').trim();
      if (f.contains) {
        if (!cell.toLowerCase().includes(f.valor.toLowerCase())) { pass = false; break; }
      } else {
        if (cell.toLowerCase() !== f.valor.toLowerCase()) { pass = false; break; }
      }
    }
    if (pass) filtered.push(row);
  }

  const C   = { f: '#1a237e', c: '#e8eaf6', t: '#ffffff' };

  // Limpa resultados anteriores
  const lastShRow = sh.getLastRow();
  if (lastShRow >= DET_DATA_ROW) {
    sh.getRange(DET_DATA_ROW, 1, lastShRow - DET_DATA_ROW + 1, N).clearContent().clearFormat();
  }
  // Remove bandings anteriores
  try { sh.getBandings().forEach(b => b.remove()); } catch(e) {}

  // Atualiza barra de status
  const limited   = filtered.length >= DET_MAX_ROWS;
  const statusTxt = filtered.length === 0
    ? '⚠️  Nenhum resultado para os filtros selecionados.'
    : `✅  ${filtered.length}${limited ? '+' : ''} chamados encontrados${limited ? ' — refine os filtros' : ''}  |  ${new Date().toLocaleString('pt-BR')}`;
  sh.getRange(13, 1, 1, N).merge()
    .setValue(statusTxt)
    .setBackground(filtered.length ? '#e8f5e9' : '#fff3e0')
    .setFontColor(filtered.length ? '#1b5e20' : '#e65100')
    .setFontStyle('normal').setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center');

  if (filtered.length === 0) {
    ss.toast('Nenhum resultado.', '🔍', 5);
    sh.activate();
    return;
  }

  // Índice da coluna de link (Chamado)
  const linkColOffset = resMap.findIndex(c => c.isLink);

  // Escreve em lotes de 500 linhas
  const BATCH = 500;
  for (let start = 0; start < filtered.length; start += BATCH) {
    const batch  = filtered.slice(start, start + BATCH);
    const rowNum = DET_DATA_ROW + start;
    const values = batch.map(r => resMap.map(c => c.srcIdx >= 0 ? r[c.srcIdx] : ''));

    sh.getRange(rowNum, 1, batch.length, N).setValues(values);

    // Aplica RichText com hyperlink na coluna Chamado
    if (linkColOffset >= 0) {
      const rtValues = batch.map((_, ri) => {
        const key = String(values[ri][linkColOffset] || '').trim();
        if (!key) return [SpreadsheetApp.newRichTextValue().setText('').build()];
        return [
          SpreadsheetApp.newRichTextValue()
            .setText(key)
            .setLinkUrl(0, key.length, JIRA_BROWSE + key)
            .build()
        ];
      });
      sh.getRange(rowNum, linkColOffset + 1, batch.length, 1).setRichTextValues(rtValues);
    }
  }

  // Aplica banding para leitura fácil
  try {
    sh.getRange(DET_HDR_ROW, 1, filtered.length + 1, N)
      .applyRowBanding(SpreadsheetApp.BandingTheme.INDIGO)
      .setHeaderRowColor(C.f)
      .setFirstRowColor('#f5f5ff')
      .setSecondRowColor('#ffffff');
  } catch(e) {}

  sh.getRange(DET_DATA_ROW, 1, filtered.length, N).setFontSize(10).setVerticalAlignment('middle');

  // Formatação especial para status concluído/fechado
  _colorirStatusDetalhes(sh, resMap, filtered.length);

  ss.toast(`✅ ${filtered.length} chamados encontrados.`, '🔍', 5);
  sh.activate();
}

// Destaca linhas por status (verde = fechado, azul = em andamento)
function _colorirStatusDetalhes(sh, resMap, nRows) {
  const statusOffset = resMap.findIndex(c => c.hdr === HDR.STATUS);
  if (statusOffset < 0 || nRows === 0) return;

  const statusCol = statusOffset + 1;
  const N         = resMap.length;

  try {
    const statusVals = sh.getRange(DET_DATA_ROW, statusCol, nRows, 1).getValues();
    for (let i = 0; i < nRows; i++) {
      const st = String(statusVals[i][0] || '').trim();
      if (STATUS_FECHADOS.includes(st)) {
        sh.getRange(DET_DATA_ROW + i, statusCol).setBackground('#c8e6c9').setFontColor('#1b5e20');
      } else if (st && st !== '') {
        sh.getRange(DET_DATA_ROW + i, statusCol).setBackground('#e3f2fd').setFontColor('#0d47a1');
      }
    }
  } catch(e) {}
}


// ============================================================
// VER DETALHES DO SELECIONADO (atalho direto dos painéis)
// ============================================================

function verDetalhesDoSelecionado() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const shAt = ss.getActiveSheet();
  const cell = shAt.getActiveCell();
  const value = String(cell.getValue() || '').trim();

  if (!value) {
    SpreadsheetApp.getUi().alert('Selecione uma célula com valor (analista, sistema, entidade, etc.) em um painel.');
    return;
  }

  let sh = ss.getSheetByName(DET_SHEET);
  if (!sh) { criarPainelDetalhes(); sh = ss.getSheetByName(DET_SHEET); }

  // Detecta filtro: 1) pelo painel ativo, 2) pelo cabeçalho da coluna
  const painelMap = _getPainelFiltroMap();
  let filterKey   = painelMap[shAt.getName()] || null;

  const hdrRowNum = shAt.getFrozenRows() || 3;
  const colHdr    = String(shAt.getRange(hdrRowNum, cell.getColumn()).getValue() || '').trim();
  const hdrToKey  = {
    'Analista': 'ANALISTA', 'Responsável': 'ANALISTA',
    'Sistema': 'SISTEMA',
    'Status': 'STATUS',
    'Equipe': 'EQUIPE_RESP', 'Equipe Responsavel': 'EQUIPE_RESP',
    'Tipo': 'TIPO', 'Tipo do chamado': 'TIPO',
    'Mês': 'ANO_MES_CRIACAO', 'Mês Criação': 'ANO_MES_CRIACAO',
    'Entidade': 'ENTIDADE',
    'Complexidade': 'COMPLEXIDADE',
    'Município': 'MUNICIPIO', 'Municipio': 'MUNICIPIO',
  };
  if (colHdr && hdrToKey[colHdr]) filterKey = hdrToKey[colHdr];

  // Limpa todos os filtros primeiro
  DET_FILTROS.forEach(f => sh.getRange(f.row, DET_INPUT_COL).clearContent());

  if (filterKey) {
    const fDef = DET_FILTROS.find(f => f.key === filterKey);
    if (fDef) sh.getRange(fDef.row, DET_INPUT_COL).setValue(value);
    filtrarDetalhes();
    return;
  }

  // Não conseguiu inferir — pede ao usuário
  const ui   = SpreadsheetApp.getUi();
  const opts = DET_FILTROS.map((f, i) => `${i + 1}. ${f.label}`).join('\n');
  const resp = ui.prompt(
    '🎯 Filtrar por qual dimensão?',
    `Valor selecionado: "${value}"\n\nEscolha o número:\n${opts}`,
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const num = parseInt(resp.getResponseText().trim()) - 1;
  if (num >= 0 && num < DET_FILTROS.length) {
    sh.getRange(DET_FILTROS[num].row, DET_INPUT_COL).setValue(value);
    filtrarDetalhes();
  }
}


// ============================================================
// DROPDOWNS
// ============================================================

function atualizarDropdownsDetalhes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(DET_SHEET);
  if (!sh) { criarPainelDetalhes(); return; }
  _popularDropdownsDetalhes(sh);
  ss.toast('Dropdowns atualizados.', DET_SHEET, 3);
}

function _popularDropdownsDetalhes(sh) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shEnr = ss.getSheetByName(DB_ENRIQUECIDOS);
  let src;
  try { src = shEnr || getSheetDados(); } catch(e) { return; }

  const colIdx  = buildColIndexMap(src);
  const lastRow = src.getLastRow();
  if (lastRow < 3) return;

  const lastCol = src.getLastColumn();
  const allData = src.getRange(3, 1, lastRow - 2, lastCol).getValues();

  DET_FILTROS.forEach(f => {
    if (f.contains) return; // texto livre: sem dropdown

    const hdrName = HDR[f.key];
    if (!hdrName) return;
    const ci = colIdx[hdrName];
    if (!ci) return;
    const ciIdx = ci - 1;

    const uniq = new Set();
    allData.forEach(r => {
      const v = String(r[ciIdx] || '').trim();
      if (v) uniq.add(v);
    });

    const sorted = Array.from(uniq).sort();
    if (!sorted.length) return;
    sorted.unshift('(Todos)');

    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(sorted.slice(0, 500), true)
      .setAllowInvalid(true)
      .build();
    sh.getRange(f.row, DET_INPUT_COL).setDataValidation(rule);
  });
}


// ============================================================
// LIMPAR FILTROS
// ============================================================

function limparFiltrosDetalhes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(DET_SHEET);
  if (!sh) return;

  DET_FILTROS.forEach(f => sh.getRange(f.row, DET_INPUT_COL).clearContent());

  const last = sh.getLastRow();
  const N    = _getDETResultCols().length;
  if (last >= DET_DATA_ROW) {
    sh.getRange(DET_DATA_ROW, 1, last - DET_DATA_ROW + 1, N).clearContent().clearFormat();
  }
  try { sh.getBandings().forEach(b => b.remove()); } catch(e) {}

  sh.getRange(13, 1, 1, N).merge()
    .setValue('▶  Filtros limpos. Execute "🔍 Filtrar detalhes" para buscar.')
    .setBackground('#f5f5f5').setFontColor('#78909c')
    .setFontStyle('italic').setFontSize(10).setHorizontalAlignment('center');

  ss.toast('Filtros limpos.', DET_SHEET, 3);
}
