// ============================================================
// Sincronizacao.gs — Atualização incremental diária + Histórico
//
// DADOS      = estado atual (1 linha por chamado, sempre atualizado)
// 📋 Histórico = log append-only: toda vez que um chamado muda,
//               a versão anterior é salva aqui antes de atualizar
// ============================================================

var ABA_HISTORICO = '📋 Histórico';
var ABA_SYNC_LOG  = '_SYNC_LOG';


// ============================================================
// SINCRONIZAÇÃO INCREMENTAL
// ============================================================

function sincronizarChamados() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cfg, cookie;
  try {
    cfg    = _lerConfig();
    cookie = _autenticar(cfg.usuario, cfg.senha);
  } catch(e) {
    ui.alert('❌ ' + e.message);
    return;
  }

  var shDados = ss.getSheetByName(ABA_DADOS);
  if (!shDados) {
    ui.alert('Aba DADOS não encontrada.\nExecute "📥 Importar chamados" primeiro.');
    return;
  }

  ss.toast('Buscando alterações...', '🔄', 60);

  var nCols   = CABECALHOS.length;
  var lastRow = shDados.getLastRow();

  // ── Carrega toda a aba DADOS em memória ─────────────────────
  // (uma única leitura = rápido mesmo com 50k linhas)
  var allExisting = [];
  var keyIndex    = {}; // key → índice 0-based em allExisting
  var updIndex    = {}; // key → Data Atualização atual (col 24, índice 23)

  if (lastRow >= 3) {
    allExisting = shDados.getRange(3, 1, lastRow - 2, nCols).getValues();
    allExisting.forEach(function(row, i) {
      var k = String(row[0] || '').trim();
      if (k) {
        keyIndex[k] = i;
        updIndex[k] = String(row[23] || ''); // Data Atualização
      }
    });
  }

  // ── Busca chamados atualizados recentemente ──────────────────
  var syncJql  = _buildSyncJQL(cfg.jql, 2); // últimos 2 dias (margem de segurança)
  var startAt  = 0;
  var total    = Infinity;
  var novas    = [];
  var histRows = [];
  var updRows  = {}; // key → {idx, novaLinha}

  var dataSnapshot = new Date().toLocaleString('pt-BR');

  while (startAt < total) {
    var data = _buscarIssues(cookie, syncJql, startAt, cfg.pageSize);
    if (!data || !data.issues || data.issues.length === 0) break;

    total = data.total;

    data.issues.forEach(function(issue) {
      var novaLinha = _formatarLinha(issue);
      var key       = String(novaLinha[0] || '').trim();
      if (!key) return;

      var novaUpd = String(novaLinha[23] || ''); // Data Atualização

      if (keyIndex.hasOwnProperty(key)) {
        // Chamado já existe — verificar se mudou
        if (novaUpd !== updIndex[key]) {
          var velhaLinha = allExisting[keyIndex[key]];
          // Salva snapshot da versão antiga no histórico
          histRows.push([dataSnapshot, _detectarMudanca(velhaLinha, novaLinha)].concat(velhaLinha));
          // Marca para atualizar
          updRows[key] = { idx: keyIndex[key], novaLinha: novaLinha };
          // Atualiza em memória
          allExisting[keyIndex[key]] = novaLinha;
          updIndex[key] = novaUpd;
        }
      } else {
        // Chamado novo — só adiciona em DADOS, sem histórico
        novas.push(novaLinha);
        keyIndex[key] = allExisting.length;
        updIndex[key] = novaUpd;
        allExisting.push(novaLinha);
      }
    });

    startAt += data.issues.length;
    ss.toast(startAt + '/' + total + ' chamados verificados...', '🔄', 30);
  }

  var nAtual = Object.keys(updRows).length;
  var nNovos = novas.length;

  // ── Salva histórico ──────────────────────────────────────────
  if (histRows.length > 0) {
    var shHist   = _getOrCreateHistorico(ss);
    var lastHist = shHist.getLastRow();
    shHist.getRange(lastHist + 1, 1, histRows.length, histRows[0].length).setValues(histRows);
  }

  // ── Atualiza linhas que mudaram em DADOS ──────────────────────
  // Agrupa atualizações contíguas para minimizar chamadas GAS
  var updList = [];
  for (var k in updRows) { updList.push(updRows[k]); }
  updList.sort(function(a, b) { return a.idx - b.idx; });

  for (var i = 0; i < updList.length; i++) {
    var sheetRow = updList[i].idx + 3; // +3 pois linha 1=info, 2=header
    shDados.getRange(sheetRow, 1, 1, nCols).setValues([updList[i].novaLinha]);
  }

  // ── Adiciona chamados novos ───────────────────────────────────
  if (nNovos > 0) {
    var appendAt = shDados.getLastRow() + 1;
    var BATCH    = 500;
    for (var j = 0; j < novas.length; j += BATCH) {
      var slice = novas.slice(j, j + BATCH);
      shDados.getRange(appendAt, 1, slice.length, nCols).setValues(slice);
      appendAt += slice.length;
    }
  }

  // ── Log e notificação ─────────────────────────────────────────
  _logSync(ss, nAtual, nNovos);
  var msg = '✅ Sync concluído: ' + nAtual + ' atualizados, ' + nNovos + ' novos.';
  ss.toast(msg, '🔄', 8);
  if (nAtual + nNovos > 0) {
    ui.alert(msg + '\n\nHistórico de alterações salvo na aba "' + ABA_HISTORICO + '".');
  } else {
    ui.alert('✅ Nenhuma alteração encontrada desde a última sincronização.');
  }
}

// Detecta qual campo mudou (para registrar no Motivo do histórico)
function _detectarMudanca(velha, nova) {
  var campos = [
    { idx: 7,  nome: 'Status'      },
    { idx: 10, nome: 'Responsável' },
    { idx: 11, nome: 'Equipe'      },
    { idx: 20, nome: 'Faturado'    },
    { idx: 31, nome: 'Tempo Gasto' },
    { idx: 37, nome: 'Fat. Líquido'},
  ];
  var mudancas = [];
  campos.forEach(function(c) {
    if (String(velha[c.idx] || '') !== String(nova[c.idx] || '')) {
      mudancas.push(c.nome);
    }
  });
  return mudancas.length > 0 ? mudancas.join(', ') : 'Atualização';
}

// Constrói JQL de sync: adiciona filtro de data ao JQL base
function _buildSyncJQL(baseJql, days) {
  var jql = baseJql.replace(/\s*ORDER\s+BY\s+.*/i, '').trim();
  if (!jql.match(/updated\s*[><=]/i)) {
    jql += ' AND updated >= "-' + days + 'd"';
  }
  return jql + ' ORDER BY updated DESC';
}


// ============================================================
// ABA HISTÓRICO
// ============================================================

function _getOrCreateHistorico(ss) {
  var sh = ss.getSheetByName(ABA_HISTORICO);
  if (sh) return sh;

  sh = ss.insertSheet(ABA_HISTORICO);
  var hdrs = ['Data Snapshot', 'Campos alterados'].concat(CABECALHOS);
  var N    = hdrs.length;

  sh.getRange(1, 1, 1, N).merge()
    .setValue('📋 Histórico de Alterações — versões anteriores dos chamados')
    .setBackground('#37474f').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
  sh.setRowHeight(1, 34);

  sh.getRange(2, 1, 1, N).setValues([hdrs])
    .setBackground('#546e7a').setFontColor('#ffffff').setFontWeight('bold');
  sh.setRowHeight(2, 22);
  sh.setFrozenRows(2);

  sh.setColumnWidth(1, 140); // Data Snapshot
  sh.setColumnWidth(2, 160); // Campos alterados
  sh.setColumnWidth(3, 130); // Chamado
  sh.setColumnWidth(4, 60);  // Projeto

  return sh;
}


// ============================================================
// HISTÓRICO NATIVO DO JIRA (changelog campo por campo)
// ============================================================

function verHistoricoChamado() {
  var ui  = SpreadsheetApp.getUi();
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var sh  = ss.getActiveSheet();
  var key = String(sh.getActiveCell().getValue() || '').trim();

  if (!key.match(/^[A-Z]+-\d+$/)) {
    ui.alert('Selecione uma célula com a chave do chamado (ex: BTHSC-12345).');
    return;
  }

  var cfg, cookie;
  try {
    cfg    = _lerConfig();
    cookie = _autenticar(cfg.usuario, cfg.senha);
  } catch(e) {
    ui.alert('❌ ' + e.message);
    return;
  }

  ss.toast('Buscando histórico de ' + key + '...', '📋', 30);

  var resp = UrlFetchApp.fetch(
    JIRA_URL + '/rest/api/2/issue/' + key + '?expand=changelog&fields=summary,status,assignee,created',
    { headers: { 'Cookie': cookie }, muteHttpExceptions: true }
  );

  if (resp.getResponseCode() !== 200) {
    ui.alert('Erro ao buscar histórico (HTTP ' + resp.getResponseCode() + ').');
    return;
  }

  var issue     = JSON.parse(resp.getContentText());
  var f         = issue.fields || {};
  var changelog = issue.changelog || {};

  // ── Monta aba do histórico ────────────────────────────────────
  var shName = '🕐 ' + key;
  var shHist = ss.getSheetByName(shName);
  if (!shHist) shHist = ss.insertSheet(shName);
  else shHist.clearContents();

  var C = { f: '#263238', c: '#eceff1', t: '#ffffff' };

  // Título
  var titulo = key + ' — ' + (f.summary || '');
  shHist.getRange(1, 1, 1, 6).merge()
    .setValue(titulo)
    .setBackground(C.f).setFontColor(C.t)
    .setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');
  shHist.setRowHeight(1, 34);

  // Cabeçalhos
  shHist.getRange(2, 1, 1, 6).setValues([['Data / Hora', 'Autor', 'Campo', 'De', 'Para', 'Tipo']])
    .setBackground(C.f).setFontColor(C.t).setFontWeight('bold');
  shHist.setRowHeight(2, 22);
  shHist.setFrozenRows(2);

  // Processa changelog (mais recente primeiro)
  var rows = [];
  var histories = (changelog.histories || []).slice().reverse(); // cronológico
  histories.forEach(function(history) {
    var autor = history.author ? history.author.displayName : '—';
    var data  = history.created
      ? history.created.substring(0, 16).replace('T', ' ')
      : '';
    (history.items || []).forEach(function(item) {
      rows.push([
        data,
        autor,
        item.field || '',
        item.fromString || '',
        item.toString  || '',
        item.fieldtype  || '',
      ]);
    });
  });

  // Inverte para mostrar mais recente no topo
  rows.reverse();

  if (rows.length > 0) {
    shHist.getRange(3, 1, rows.length, 6).setValues(rows).setFontSize(10);

    // Colorir linhas de status
    rows.forEach(function(r, i) {
      if (r[2] === 'status') {
        shHist.getRange(3 + i, 1, 1, 6).setBackground('#e3f2fd');
      } else if (r[2] === 'assignee') {
        shHist.getRange(3 + i, 1, 1, 6).setBackground('#f3e5f5');
      }
    });
  } else {
    shHist.getRange(3, 1).setValue('Nenhuma alteração registrada no JIRA.')
      .setFontStyle('italic').setFontColor('#78909c');
  }

  // Larguras
  shHist.setColumnWidth(1, 140);
  shHist.setColumnWidth(2, 180);
  shHist.setColumnWidth(3, 130);
  shHist.setColumnWidth(4, 220);
  shHist.setColumnWidth(5, 220);
  shHist.setColumnWidth(6, 80);

  ss.setActiveSheet(shHist);
  ss.toast('📋 ' + rows.length + ' eventos encontrados para ' + key, '📋', 6);
}


// ============================================================
// GATILHO DE ATUALIZAÇÃO DIÁRIA AUTOMÁTICA
// ============================================================

function criarTriggerDiario() {
  // Remove gatilhos existentes para esta função
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sincronizarChamados') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('sincronizarChamados')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert(
    '✅ Atualização automática ativada!\n\n' +
    'Os chamados serão sincronizados todos os dias às 06:00h.\n' +
    'As alterações ficam registradas na aba "' + ABA_HISTORICO + '".'
  );
}

function removerTriggerDiario() {
  var count = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sincronizarChamados') {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });
  SpreadsheetApp.getUi().alert(
    count > 0
      ? '✅ Atualização automática desativada.'
      : 'Nenhum gatilho encontrado.'
  );
}

function statusTriggerDiario() {
  var ativo = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'sincronizarChamados';
  });
  SpreadsheetApp.getUi().alert(
    ativo
      ? '✅ Atualização automática ATIVA (executa às 06:00h).'
      : '⚠️ Atualização automática INATIVA.'
  );
}


// ============================================================
// LOG DE SINCRONIZAÇÕES
// ============================================================

function _logSync(ss, atualizados, novos) {
  var sh = ss.getSheetByName(ABA_SYNC_LOG);
  if (!sh) {
    sh = ss.insertSheet(ABA_SYNC_LOG);
    sh.hideSheet();
    sh.getRange(1, 1, 1, 4).setValues([['Data/Hora', 'Atualizados', 'Novos', 'Total']]);
  }
  sh.appendRow([new Date().toLocaleString('pt-BR'), atualizados, novos, atualizados + novos]);
}

function verLogSync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ABA_SYNC_LOG);
  if (!sh) {
    SpreadsheetApp.getUi().alert('Nenhum log encontrado. Execute uma sincronização primeiro.');
    return;
  }
  sh.showSheet();
  ss.setActiveSheet(sh);
}
