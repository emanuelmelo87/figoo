// ============================================================
// Code.gs — Importador JIRA → Google Sheets (Chamados Betha)
// Autenticação via cookie  |  Layout: Linha 1 = info, Linha 2 = cabeçalhos, Linha 3+ = dados
// ============================================================

const JIRA_URL   = 'https://atendimento.betha.com.br';
const ABA_DADOS  = 'DADOS';
const ABA_CONFIG = 'CONFIG';

// ── Campos a buscar na API JIRA ──────────────────────────────
const JIRA_FIELDS = [
  'key', 'summary', 'status', 'issuetype', 'assignee', 'priority',
  'created', 'updated', 'resolutiondate', 'reporter', 'timetracking',
  'customfield_10202',  // Entidade
  'customfield_10132',  // Sistema
  'customfield_21500',  // Equipe responsável
  'customfield_25501',  // Responsável (SUP)
  'customfield_31300',  // Analista residente
  'customfield_30000',  // Porte do cliente
  'customfield_10300',  // Vertical
  'customfield_32400',  // Portfólio de Atendimento
  'customfield_26300',  // Funcionalidade
  'customfield_27703',  // Complexidade
  'customfield_10126',  // Origem da solicitação
  'customfield_10111',  // Faturado (Sim/Não)
  'customfield_10138',  // V. Hora Técnica (qtd horas APS)
  'customfield_27202',  // Valor Hora Técnica (R$/h)
  'customfield_10139',  // Valor do Desconto (R$)
  'customfield_16000',  // Informações para negociação
  'customfield_24822',  // Realização da triagem (Data)
  'customfield_25300',  // Encerramento triagem (Data)
  'customfield_24900',  // Encaminhamento filial (Data)
  'customfield_20604',  // Filial
  'customfield_26401',  // Projeto Implantação
  'customfield_10331',  // Município
];

// ── Cabeçalhos da aba DADOS (linha 2) ───────────────────────
// IMPORTANTE: devem coincidir com os valores do HDR em Dashboard.gs
const CABECALHOS = [
  'Chamado',
  'Projeto',
  'Filial',
  'Entidade',
  'Municipio',
  'Sistema',
  'Tipo do chamado',
  'Status',
  'Categoria',
  'Prioridade',
  'Responsável',
  'Equipe Responsavel',
  'Responsavel(SUP)',
  'Analista residente',
  'Vertical',
  'Portfolio',
  'Funcionalidade',
  'Complexidade',
  'Origem da solicitaçao',
  'Porte do cliente',
  'FATURADO?',
  'Data Criação',
  'Data Resolução',
  'Data Atualização',
  'Data da triagem',
  'Encerramento da triagem',
  'Encaminhamento Filial',
  'Ano/Mes Criação',
  'Ano/Mes Resolução',
  'Status da Resolução',
  'Dias p/ resolução',
  'Tempo Gasto (h)',
  'Estimativa (h)',
  'Horas APS',
  'Hora Técnica Valor',
  'Valor Fatura',
  'Valor Desconto',
  'Fatura Líquido',
  'Informacao para negociacao',
  'Projeto Implantação',
  'Nome do solicitante',
  'Resumo',
];


// ============================================================
// MENU
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Chamados Betha')
    .addItem('⚙️  Configurar credenciais',          'configurarCredenciais')
    .addItem('🔌  Testar conexão',                   'testarConexao')
    .addSeparator()
    .addItem('📥  Importar COMPLETO (do zero)',       'importarChamados')
    .addItem('🔄  Sincronizar alterações (rápido)',   'sincronizarChamados')
    .addSeparator()
    .addItem('📋  Ver histórico do chamado selecionado', 'verHistoricoChamado')
    .addItem('📄  Ver log de sincronizações',         'verLogSync')
    .addSeparator()
    .addItem('⏰  Ativar atualização diária (06h)',   'criarTriggerDiario')
    .addItem('⏹️  Desativar atualização automática',  'removerTriggerDiario')
    .addItem('❓  Status da atualização automática',  'statusTriggerDiario')
    .addSeparator()
    .addSubMenu(getDashboardSubMenu())
    .addToUi();
}


// ============================================================
// CONFIGURAÇÃO (aba CONFIG)
// ============================================================

function configurarCredenciais() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh   = ss.getSheetByName(ABA_CONFIG);
  if (!sh) {
    sh = ss.insertSheet(ABA_CONFIG);
    _criarAbaConfig(sh);
    SpreadsheetApp.getUi().alert(
      '✅ Aba CONFIG criada!\n\nPreencha USUARIO e SENHA antes de importar.'
    );
  } else {
    SpreadsheetApp.getUi().alert('Aba CONFIG já existe. Edite diretamente os valores.');
  }
  ss.setActiveSheet(sh);
}

function _criarAbaConfig(sh) {
  sh.clearContents();
  var dados = [
    ['Parâmetro',    'Valor',                                       'Descrição'],
    ['USUARIO',      '',                                            'Seu e-mail no JIRA (ex: nome@betha.com.br)'],
    ['SENHA',        '',                                            'Sua senha do JIRA'],
    ['JQL',          'project = BTHSC ORDER BY created DESC',       'Filtro JQL — ajuste o projeto conforme necessário'],
    ['PAGINA_SIZE',  '100',                                         'Issues por requisição (máximo 100)'],
    ['MAX_ISSUES',   '50000',                                       'Limite de segurança (0 = sem limite)'],
  ];
  sh.getRange(1, 1, dados.length, 3).setValues(dados);
  sh.getRange(1, 1, 1, 3).setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold');
  sh.getRange(2, 1, 2, 1).setBackground('#fff3e0');
  sh.getRange(2, 2, 2, 1).setBackground('#ffe0b2').setFontWeight('bold');
  sh.setColumnWidth(1, 140);
  sh.setColumnWidth(2, 340);
  sh.setColumnWidth(3, 380);
}

function _lerConfig() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var sh  = ss.getSheetByName(ABA_CONFIG);
  if (!sh) throw new Error('Aba CONFIG não encontrada. Execute "⚙️ Configurar credenciais" primeiro.');

  var dados = sh.getDataRange().getValues();
  var cfg   = {};
  dados.slice(1).forEach(function(r) { if (r[0]) cfg[String(r[0]).trim()] = r[1]; });

  if (!cfg.USUARIO) throw new Error('USUARIO não preenchido na aba CONFIG.');
  if (!cfg.SENHA)   throw new Error('SENHA não preenchida na aba CONFIG.');
  if (!cfg.JQL)     throw new Error('JQL não preenchido na aba CONFIG.');

  return {
    usuario  : String(cfg.USUARIO).trim(),
    senha    : String(cfg.SENHA).trim(),
    jql      : String(cfg.JQL).trim(),
    pageSize : parseInt(cfg.PAGINA_SIZE) || 100,
    maxIssues: parseInt(cfg.MAX_ISSUES)  || 0,
  };
}


// ============================================================
// AUTENTICAÇÃO (cookie)
// ============================================================

function _autenticar(usuario, senha) {
  var resp = UrlFetchApp.fetch(JIRA_URL + '/rest/auth/1/session', {
    method            : 'post',
    contentType       : 'application/json',
    payload           : JSON.stringify({ username: usuario, password: senha }),
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('Falha ao autenticar (HTTP ' + resp.getResponseCode() + '). Verifique usuário e senha na CONFIG.');
  }

  var json = JSON.parse(resp.getContentText());
  return json.session.name + '=' + json.session.value;
}

function testarConexao() {
  var ui = SpreadsheetApp.getUi();
  try {
    var cfg    = _lerConfig();
    var cookie = _autenticar(cfg.usuario, cfg.senha);
    var resp   = UrlFetchApp.fetch(JIRA_URL + '/rest/api/2/myself', {
      headers           : { 'Cookie': cookie },
      muteHttpExceptions: true,
    });
    var user = JSON.parse(resp.getContentText());
    ui.alert('✅ Conectado como: ' + (user.displayName || user.name));
  } catch(e) {
    ui.alert('❌ Erro: ' + e.message);
  }
}


// ============================================================
// IMPORTAÇÃO PRINCIPAL
// ============================================================

function importarChamados() {
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

  // Prepara aba DADOS
  var sh = ss.getSheetByName(ABA_DADOS);
  if (!sh) sh = ss.insertSheet(ABA_DADOS);
  else sh.clearContents();

  var nCols = CABECALHOS.length;

  // Linha 1: metadados da importação
  sh.getRange(1, 1, 1, nCols).merge()
    .setValue('Importado em: ' + new Date().toLocaleString('pt-BR') + '  |  JQL: ' + cfg.jql)
    .setBackground('#e8f0fe').setFontColor('#1a73e8').setFontSize(9);

  // Linha 2: cabeçalhos
  sh.getRange(2, 1, 1, nCols).setValues([CABECALHOS])
    .setBackground('#1a73e8').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(10);
  sh.setFrozenRows(2);

  ss.toast('Conectado. Buscando chamados...', '📥', 60);

  var startAt   = 0;
  var total     = Infinity;
  var rowNum    = 3;
  var totalLido = 0;
  var buffer    = [];

  while (startAt < total) {
    if (cfg.maxIssues > 0 && totalLido >= cfg.maxIssues) break;

    var data = _buscarIssues(cookie, cfg.jql, startAt, cfg.pageSize);
    if (!data || !data.issues || data.issues.length === 0) break;

    total = data.total;
    data.issues.forEach(function(issue) {
      buffer.push(_formatarLinha(issue));
    });

    totalLido += data.issues.length;
    startAt   += data.issues.length;

    // Escreve em lotes de 500
    if (buffer.length >= 500) {
      sh.getRange(rowNum, 1, buffer.length, nCols).setValues(buffer);
      rowNum += buffer.length;
      buffer  = [];
    }

    ss.toast(totalLido + ' / ' + Math.min(total, cfg.maxIssues || total) + ' chamados...', '📥', 30);
  }

  if (buffer.length > 0) {
    sh.getRange(rowNum, 1, buffer.length, nCols).setValues(buffer);
  }

  // Larguras principais
  sh.setColumnWidth(1, 130);
  sh.setColumnWidth(4, 220);
  sh.setColumnWidth(6, 150);
  sh.setColumnWidth(11, 160);

  ss.toast('✅ ' + totalLido + ' chamados importados!', '📥', 10);
  ui.alert('✅ Importação concluída!\n' + totalLido + ' chamados na aba ' + ABA_DADOS + '.');
}


// ============================================================
// BUSCA NA API JIRA
// ============================================================

function _buscarIssues(cookie, jql, startAt, maxResults) {
  var resp = UrlFetchApp.fetch(JIRA_URL + '/rest/api/2/search', {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { 'Cookie': cookie },
    payload           : JSON.stringify({ jql: jql, startAt: startAt, maxResults: maxResults, fields: JIRA_FIELDS }),
    muteHttpExceptions: true,
  });

  var code = resp.getResponseCode();
  if (code !== 200) throw new Error('Erro na API JIRA (HTTP ' + code + '): ' + resp.getContentText().substring(0, 300));

  return JSON.parse(resp.getContentText());
}


// ============================================================
// FORMATA UMA ISSUE EM LINHA DE PLANILHA
// ============================================================

function _formatarLinha(issue) {
  var f = issue.fields || {};

  // Datas
  var dataCriacao    = _data(f.created);
  var dataResolucao  = _data(f.resolutiondate);
  var dataAtualizacao = _data(f.updated);
  var dataTriagem    = _data(f.customfield_24822);
  var dataEncTriag   = _data(f.customfield_25300);
  var dataEncFil     = _data(f.customfield_24900);

  var anoMesCriacao   = dataCriacao   ? dataCriacao.substring(0, 7)   : '';
  var anoMesResolucao = dataResolucao ? dataResolucao.substring(0, 7) : '';

  var dias = (dataCriacao && dataResolucao)
    ? Math.round((new Date(dataResolucao) - new Date(dataCriacao)) / 86400000)
    : '';

  // Tempo
  var tt          = f.timetracking || {};
  var tempoGasto  = tt.timeSpentSeconds        ? +(tt.timeSpentSeconds / 3600).toFixed(2)        : '';
  var estimativa  = tt.originalEstimateSeconds ? +(tt.originalEstimateSeconds / 3600).toFixed(2) : '';

  // Financeiro
  var horasAPS      = _num(f.customfield_10138);
  var valorHoraTec  = _num(f.customfield_27202);
  var valorDesconto = _num(f.customfield_10139);
  var valorFatura   = (horasAPS !== '' && valorHoraTec !== '') ? +(horasAPS * valorHoraTec).toFixed(2) : '';
  var faturaLiquido = (valorFatura !== '' && valorDesconto !== '')
                      ? +(valorFatura - valorDesconto).toFixed(2)
                      : valorFatura;

  return [
    issue.key,                                                   // Chamado
    issue.key ? issue.key.split('-')[0] : '',                   // Projeto
    _opt(f.customfield_20604),                                   // Filial
    f.customfield_10202 || '',                                   // Entidade
    f.customfield_10331 || '',                                   // Municipio
    _opt(f.customfield_10132),                                   // Sistema
    _nested(f.issuetype, 'name'),                                // Tipo do chamado
    _nested(f.status, 'name'),                                   // Status
    _nested(f.status && f.status.statusCategory, 'name'),       // Categoria
    _nested(f.priority, 'name'),                                 // Prioridade
    _nested(f.assignee, 'displayName'),                          // Responsável
    _opt(f.customfield_21500),                                   // Equipe Responsavel
    _nested(f.customfield_25501, 'displayName'),                 // Responsavel(SUP)
    _anyVal(f.customfield_31300),                                // Analista residente
    _opt(f.customfield_10300),                                   // Vertical
    _opt(f.customfield_32400),                                   // Portfolio
    _anyVal(f.customfield_26300),                                // Funcionalidade
    _opt(f.customfield_27703),                                   // Complexidade
    _opt(f.customfield_10126),                                   // Origem da solicitaçao
    _opt(f.customfield_30000),                                   // Porte do cliente
    _opt(f.customfield_10111),                                   // FATURADO?
    dataCriacao,                                                 // Data Criação
    dataResolucao,                                               // Data Resolução
    dataAtualizacao,                                             // Data Atualização
    dataTriagem,                                                 // Data da triagem
    dataEncTriag,                                                // Encerramento da triagem
    dataEncFil,                                                  // Encaminhamento Filial
    anoMesCriacao,                                               // Ano/Mes Criação
    anoMesResolucao,                                             // Ano/Mes Resolução
    _nested(f.status && f.status.statusCategory, 'name'),       // Status da Resolução
    dias,                                                        // Dias p/ resolução
    tempoGasto,                                                  // Tempo Gasto (h)
    estimativa,                                                  // Estimativa (h)
    horasAPS,                                                    // Horas APS
    valorHoraTec,                                                // Hora Técnica Valor
    valorFatura,                                                 // Valor Fatura
    valorDesconto,                                               // Valor Desconto
    faturaLiquido,                                               // Fatura Líquido
    f.customfield_16000 || '',                                   // Informacao para negociacao
    _anyVal(f.customfield_26401),                                // Projeto Implantação
    _nested(f.reporter, 'displayName'),                          // Nome do solicitante
    f.summary || '',                                             // Resumo
  ];
}


// ============================================================
// HELPERS
// ============================================================

function _opt(field) {
  if (!field) return '';
  if (typeof field === 'object' && field.value !== undefined) return field.value;
  return String(field);
}

function _nested(obj, prop) {
  if (!obj) return '';
  return obj[prop] !== undefined ? String(obj[prop]) : '';
}

function _anyVal(field) {
  if (field === null || field === undefined) return '';
  if (typeof field === 'string')  return field;
  if (typeof field === 'number')  return field;
  if (typeof field === 'boolean') return field ? 'Sim' : 'Não';
  if (typeof field === 'object') {
    if (field.value       !== undefined) return field.value;
    if (field.displayName !== undefined) return field.displayName;
    if (field.name        !== undefined) return field.name;
  }
  return String(field);
}

function _num(field) {
  if (field === null || field === undefined || field === '') return '';
  var n = parseFloat(field);
  return isNaN(n) ? '' : n;
}

function _data(val) {
  if (!val) return '';
  return String(val).substring(0, 10);
}
