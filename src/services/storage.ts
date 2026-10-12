import { AppState, Paciente, Medico, Agendamento, ProntuarioRegistro, GoogleSheetsConfig } from '../types';

const STORAGE_KEY = 'zane_pilates_studio_state_v3';

// URL pré-configurada fornecida pelo usuário ou configurável
export const DEFAULT_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxTyvKMK0hGnEgZUQxV78OEdAfWGXYLE-0y7ZaftOQFeYbkHmRVd2PYtKRObCNFbQPyRA/exec';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ==============================================================
 * SCRIPT DE INTEGRAÇÃO GOOGLE SHEETS - ZANE PILATES STUDIO
 * ==============================================================
 * Instruções:
 * 1. Abra uma planilha vazia no Google Sheets (planilha.google.com)
 * 2. Clique no menu superior: "Extensões" > "Apps Script"
 * 3. Apague qualquer código existente e COLE TODO ESTE CONTEÚDO
 * 4. Clique em "Implantar" (Deploy) > "Nova Implantação"
 * 5. Tipo: "App da Web" (Web App)
 * 6. Configurar:
 *    - Executar como: "Eu" (seu e-mail)
 *    - Quem pode acessar: "Qualquer pessoa" (Anyone)
 * 7. Clique em "Implantar" e copie a URL gerada (termina com /exec)
 * 8. Cole a URL no painel "Google Sheets" da aplicação ZANE!
 * ==============================================================
 */

function setupSheets(ss) {
  var sheets = {
    'Agendamentos': ['ID', 'Código', 'Data', 'Hora', 'Paciente', 'CPF', 'Telefone', 'Médico', 'Especialidade', 'Sala', 'Status', 'Check-in Em', 'Tipo', 'Valor (R$)', 'Criado Em'],
    'Pacientes': ['ID', 'Nome', 'CPF', 'Telefone', 'E-mail', 'Nascimento', 'Gênero', 'Convênio', 'Alergias', 'Queixa Principal', 'Cadastrado Em'],
    'Médicos': ['ID', 'Nome', 'CRM', 'Especialidade', 'Sala', 'E-mail', 'Telefone', 'Dias', 'Início', 'Fim', 'Valor (R$)'],
    'Prontuários_PEP': ['ID', 'Agendamento ID', 'Data', 'Hora', 'Paciente', 'Médico', 'CRM', 'Especialidade', 'Queixa', 'PA', 'FC', 'Temp', 'IMC', 'CID-10 Código', 'CID-10 Descrição', 'Conduta', 'Prescrições', 'Exames', 'Atestado (Dias)', 'Criado Em']
  };

  for (var name in sheets) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(sheets[name]);
      sh.getRange(1, 1, 1, sheets[name].length).setBackground('#16362C').setFontColor('#FAF8F5').setFontWeight('bold');
    }
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets(ss);

  var result = {
    pacientes: sheetToObjects(ss.getSheetByName('Pacientes')),
    medicos: sheetToObjects(ss.getSheetByName('Médicos')),
    agend: sheetToObjects(ss.getSheetByName('Agendamentos')),
    prontuarios: sheetToObjects(ss.getSheetByName('Prontuários_PEP'))
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheets(ss);

    var data = JSON.parse(e.postData.contents);
    var sheetName = data.sheet || 'Agendamentos';
    var op = data.op || 'add'; // 'add', 'update', 'delete', 'sync_all'
    var rowData = data.row || {};

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (op === 'sync_all' && data.allRows) {
      // Sincroniza tabela inteira preservando cabeçalho
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      sheet.clearContents();
      sheet.appendRow(headers);
      data.allRows.forEach(function(item) {
        sheet.appendRow(objectToRow(headers, item));
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Sincronização completa realizada' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Operação simples
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    if (op === 'add') {
      sheet.appendRow(objectToRow(headers, rowData));
    } else if (op === 'update') {
      var idColIndex = headers.indexOf('ID') + 1 || 1;
      var values = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][idColIndex - 1]) === String(rowData.id || rowData.ID)) {
          var updatedRow = objectToRow(headers, rowData);
          sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow(objectToRow(headers, rowData));
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function objectToRow(headers, obj) {
  var map = {
    'ID': obj.id || '',
    'Código': obj.codigo || '',
    'Data': obj.data || '',
    'Hora': obj.hora || '',
    'Paciente': obj.pacienteNome || obj.nome || '',
    'Nome': obj.nome || '',
    'CPF': obj.cpf || obj.pacienteCpf || '',
    'Telefone': obj.telefone || obj.pacienteTelefone || '',
    'E-mail': obj.email || '',
    'Nascimento': obj.dataNascimento || '',
    'Gênero': obj.genero || '',
    'Convênio': obj.convenio || '',
    'Alergias': obj.alergias || '',
    'Queixa Principal': obj.queixaPrincipal || '',
    'Cadastrado Em': obj.cadastradoEm || '',
    'CRM': obj.crm || '',
    'Especialidade': obj.especialidade || '',
    'Sala': obj.sala || '',
    'Dias': obj.diasAtendimento || '',
    'Início': obj.horarioInicio || '',
    'Fim': obj.horarioFim || '',
    'Valor (R$)': obj.valor || obj.valorConsulta || '',
    'Status': obj.status || '',
    'Check-in Em': obj.checkinEm || '',
    'Tipo': obj.tipoConsulta || '',
    'Médico': obj.medicoNome || obj.nome || '',
    'Agendamento ID': obj.agendamentoId || '',
    'PA': (obj.sinaisVitais && obj.sinaisVitais.pressaoArterial) || '',
    'FC': (obj.sinaisVitais && obj.sinaisVitais.freqCardiaca) || '',
    'Temp': (obj.sinaisVitais && obj.sinaisVitais.temperatura) || '',
    'IMC': (obj.sinaisVitais && obj.sinaisVitais.imc) || '',
    'CID-10 Código': obj.cid10Codigo || '',
    'CID-10 Descrição': obj.cid10Descricao || '',
    'Conduta': obj.condutaClinica || '',
    'Prescrições': JSON.stringify(obj.prescricoes || []),
    'Exames': (obj.examesSolicitados || []).join('; '),
    'Atestado (Dias)': obj.atestadoDias || 0,
    'Criado Em': obj.criadoEm || ''
  };

  return headers.map(function(h) {
    return map[h] !== undefined ? map[h] : (obj[h] || '');
  });
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = data[i][j];
    }
    rows.push(item);
  }
  return rows;
}
`;

export const getHojeIso = (): string => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const getHoraAtual = (): string => {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Dados sementes iniciais de fisioterapeutas e médicos
const INITIAL_MEDICOS: Medico[] = [
  {
    id: 'med-1',
    nome: 'Dra. Mariana Silveira Costa',
    tipo: 'Fisioterapeuta',
    crm: 'CREFITO-3/195.402-F',
    especialidade: 'Pilates Clínico & Postura',
    foto: 'https://images.unsplash.com/photo-1594824813583-98285511e6d4?auto=format&fit=crop&w=400&q=80',
    sala: 'Estúdio 1 - Reformer & Cadillac',
    email: 'mariana.costa@zanepilates.com.br',
    telefone: '(11) 97120-4491',
    diasAtendimento: 'Seg, Ter, Qua, Qui, Sex',
    horarioInicio: '08:00',
    horarioFim: '18:00',
    biografia: 'Fisioterapeuta pós-graduada em Pilates Clínico e Biomecânica da Postura. Mais de 10 anos de experiência em reabilitação de coluna e patologias articulares.',
  },
  {
    id: 'med-2',
    nome: 'Dr. Lucas Silveira',
    tipo: 'Médico',
    crm: 'CRM/SP 148.920',
    especialidade: 'Ortopedia & Medicina do Exercício',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    sala: 'Consultório Médico 101',
    email: 'lucas.silveira@zanepilates.com.br',
    telefone: '(11) 98452-3310',
    diasAtendimento: 'Seg, Ter, Qui, Sex',
    horarioInicio: '08:30',
    horarioFim: '17:30',
    biografia: 'Médico ortopedista especialista em coluna e lesões esportivas pelo HCFMUSP. Atua integrado ao estúdio na avaliação diagnóstica e prescrição terapêutica.',
  },
  {
    id: 'med-3',
    nome: 'Ft. Camila Albuquerque',
    tipo: 'Fisioterapeuta',
    crm: 'CREFITO-3/208.115-F',
    especialidade: 'RPG & Cadeias Musculares',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    sala: 'Estúdio 2 - Mat Pilates & Chair',
    email: 'camila.albuquerque@zanepilates.com.br',
    telefone: '(11) 98834-9011',
    diasAtendimento: 'Ter, Qua, Sex',
    horarioInicio: '09:00',
    horarioFim: '19:00',
    biografia: 'Especialista em Reeducação Postural Global (RPG) e método Pilates aplicado a gestantes e idosos. Formação internacional em aparelhos de Pilates.',
  },
  {
    id: 'med-4',
    nome: 'Ft. Roberto Vasconcelos',
    tipo: 'Fisioterapeuta',
    crm: 'CREFITO-3/162.774-F',
    especialidade: 'Reabilitação Traumato-Ortopédica',
    foto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    sala: 'Estúdio 3 - Barrel & Reabilitação',
    email: 'roberto.vasconcelos@zanepilates.com.br',
    telefone: '(11) 99120-7764',
    diasAtendimento: 'Seg, Qua, Qui',
    horarioInicio: '08:00',
    horarioFim: '17:00',
    biografia: 'Fisioterapeuta desportivo e instrutor de Pilates para condicionamento físico e pós-operatório ortopédico de joelho, quadril e ombro.',
  },
];

const INITIAL_PACIENTES: Paciente[] = [
  {
    id: 'pac-1',
    nome: 'Beatriz Mendes Siqueira',
    cpf: '241.890.348-12',
    telefone: '(11) 99234-8812',
    email: 'beatriz.mendes@gmail.com',
    dataNascimento: '1992-06-14',
    genero: 'Feminino',
    convenio: 'Bradesco Saúde Top',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    queixaPrincipal: 'Check-up anual de rotina e acompanhamento de fadiga leve',
    alergias: 'Penicilina, Dipirona',
    historico: 'Hipotireoidismo subclínico em tratamento com levotiroxina 50mcg.',
    cadastradoEm: '2026-03-01T10:00:00Z',
  },
  {
    id: 'pac-2',
    nome: 'Gabriel Antunes Moura',
    cpf: '382.441.908-44',
    telefone: '(11) 98711-4029',
    email: 'gabriel.antunes@outlook.com',
    dataNascimento: '1985-11-22',
    genero: 'Masculino',
    convenio: 'SulAmérica Especial',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    queixaPrincipal: 'Hipertensão arterial sistêmica - acompanhamento',
    alergias: 'Nenhuma alergia conhecida',
    historico: 'Histórico familiar de IAM paterno aos 55 anos. Praticante de corrida.',
    cadastradoEm: '2026-03-15T14:20:00Z',
  },
  {
    id: 'pac-3',
    nome: 'Helena Duarte Fontes',
    cpf: '450.119.822-09',
    telefone: '(11) 97412-9900',
    email: 'helena.fontes@gmail.com',
    dataNascimento: '1998-04-03',
    genero: 'Feminino',
    convenio: 'Particular',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    queixaPrincipal: 'Dermatite atópica em face e antebraços com descamação',
    alergias: 'Fragrâncias e AINEs',
    historico: 'Quadro alérgico sazonal.',
    cadastradoEm: '2026-04-01T09:10:00Z',
  },
  {
    id: 'pac-4',
    nome: 'Marcos Vinícius Prado',
    cpf: '129.773.048-81',
    telefone: '(11) 99881-2201',
    email: 'marcos.prado@empresa.com.br',
    dataNascimento: '1979-09-18',
    genero: 'Masculino',
    convenio: 'Unimed Seguros',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    queixaPrincipal: 'Dor lombar irradiada para membro inferior direito',
    alergias: 'Sulfa',
    historico: 'Hérnia discal L5-S1 identificada em RM anterior.',
    cadastradoEm: '2026-04-05T11:45:00Z',
  },
];

export const getInitialState = (): AppState => {
  const hoje = getHojeIso();

  const agendamentos: Agendamento[] = [
    {
      id: 'agd-1',
      codigo: 'ZNE-1092',
      pacienteId: 'pac-1',
      pacienteNome: 'Beatriz Mendes Siqueira',
      pacienteTelefone: '(11) 99234-8812',
      pacienteCpf: '241.890.348-12',
      medicoId: 'med-1',
      medicoNome: 'Dra. Mariana Silveira Costa',
      especialidade: 'Pilates Clínico & Postura',
      data: hoje,
      hora: '09:00',
      sala: 'Estúdio 1 - Reformer & Cadillac',
      status: 'Presente',
      checkinEm: '08:48',
      tipoConsulta: 'Pilates Clínico (Sessão)',
      valor: 0,
      observacoes: 'Aluno(a) chegou com antecedência, aguardando na recepção.',
      criadoEm: '2026-10-10T14:00:00Z',
    },
    {
      id: 'agd-2',
      codigo: 'ZNE-1093',
      pacienteId: 'pac-2',
      pacienteNome: 'Gabriel Antunes Moura',
      pacienteTelefone: '(11) 98711-4029',
      pacienteCpf: '382.441.908-44',
      medicoId: 'med-2',
      medicoNome: 'Dr. Lucas Silveira',
      especialidade: 'Ortopedia & Medicina do Exercício',
      data: hoje,
      hora: '10:00',
      sala: 'Consultório Médico 101',
      status: 'Em atendimento',
      checkinEm: '09:55',
      tipoConsulta: 'Avaliação Ortopédica',
      valor: 0,
      observacoes: 'Trazer exames de imagem da coluna lombar.',
      criadoEm: '2026-10-09T18:30:00Z',
    },
    {
      id: 'agd-3',
      codigo: 'ZNE-1094',
      pacienteId: 'pac-3',
      pacienteNome: 'Helena Duarte Fontes',
      pacienteTelefone: '(11) 97412-9900',
      pacienteCpf: '450.119.822-09',
      medicoId: 'med-3',
      medicoNome: 'Ft. Camila Albuquerque',
      especialidade: 'RPG & Cadeias Musculares',
      data: hoje,
      hora: '11:00',
      sala: 'Estúdio 2 - Mat Pilates & Chair',
      status: 'Agendado',
      tipoConsulta: 'Sessão de Postura & RPG',
      valor: 0,
      observacoes: 'Avaliação postural global e queixa de cervicalgia.',
      criadoEm: '2026-10-11T08:15:00Z',
    },
    {
      id: 'agd-4',
      codigo: 'ZNE-1095',
      pacienteId: 'pac-4',
      pacienteNome: 'Marcos Vinícius Prado',
      pacienteTelefone: '(11) 99881-2201',
      pacienteCpf: '129.773.048-81',
      medicoId: 'med-4',
      medicoNome: 'Ft. Roberto Vasconcelos',
      especialidade: 'Reabilitação Traumato-Ortopédica',
      data: hoje,
      hora: '14:00',
      sala: 'Estúdio 3 - Barrel & Reabilitação',
      status: 'Agendado',
      tipoConsulta: 'Reabilitação de Joelho',
      valor: 0,
      observacoes: 'Fortalecimento de quadríceps pós-lesão meniscal.',
      criadoEm: '2026-10-08T11:00:00Z',
    },
  ];

  const prontuarios: ProntuarioRegistro[] = [
    {
      id: 'prt-1',
      agendamentoId: 'agd-prev-1',
      pacienteId: 'pac-2',
      pacienteNome: 'Gabriel Antunes Moura',
      medicoId: 'med-1',
      medicoNome: 'Dr. Lucas Silveira',
      crm: 'CRM/SP 148.920',
      especialidade: 'Cardiologia',
      data: '2026-09-12',
      hora: '10:15',
      queixaPrincipal: 'Picos pressóricos ocasionais aos esforços (145/95 mmHg)',
      historiaDoencaAtual: 'Paciente relata episódios de cefaleia occipital após reuniões estressantes no trabalho. Sem dor precordial ou dispneia.',
      sinaisVitais: {
        pressaoArterial: '138/88 mmHg',
        freqCardiaca: '74 bpm',
        temperatura: '36.5 °C',
        saturacaoO2: '98%',
        peso: '82.5 kg',
        altura: '1.78 m',
        imc: '26.0',
        classificacaoImc: 'Sobrepeso leve',
      },
      exameFisico: 'Bom estado geral, acianótico, anictérico, eupneico. RCR 2T sem sopros audíveis. Murmúrio vesicular presente bilateralmente sem ruídos adventícios. Pulsos periféricos simétricos e cheios.',
      cid10Codigo: 'I10',
      cid10Descricao: 'Hipertensão essencial (primária)',
      condutaClinica: 'Solicitado MAPA 24h e Ecocardiograma transtorácico. Orientado controle do estresse, redução de sódio na dieta e manutenção das corridas moderadas.',
      prescricoes: [
        {
          medicamento: 'Losartana Potássica 50mg',
          dose: '1 comprimido',
          frequencia: '1x ao dia (pela manhã)',
          duracao: 'Uso contínuo (30 dias)',
          orientacoes: 'Tomar em jejum com água. Monitorar pressão arterial semanalmente.',
        },
      ],
      examesSolicitados: ['MAPA 24 Horas', 'Ecocardiograma Transtorácico com Doppler', 'Perfil Lipídico Completo', 'Creatinina Sérica'],
      atestadoDias: 0,
      observacoes: 'Retorno agendado para apresentação dos exames.',
      criadoEm: '2026-09-12T10:45:00Z',
    },
  ];

  const sheetsConfig: GoogleSheetsConfig = {
    webhookUrl: DEFAULT_SHEETS_WEBHOOK_URL,
    autoSyncEnabled: true,
    ultimaSincronizacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    statusSincronizacao: 'success',
    logs: [
      {
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        tipo: 'Inicialização',
        detalhe: 'Sincronizador Google Sheets conectado e pronto.',
        sucesso: true,
      },
    ],
  };

  return {
    pacientes: INITIAL_PACIENTES,
    medicos: INITIAL_MEDICOS,
    agendamentos,
    prontuarios,
    sheetsConfig,
  };
};

export const loadStoredState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveStoredState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...getInitialState(),
      ...parsed,
      sheetsConfig: {
        ...getInitialState().sheetsConfig,
        ...(parsed.sheetsConfig || {}),
      },
    };
  } catch (e) {
    console.error('Erro ao ler estado do localStorage:', e);
    return getInitialState();
  }
};

export const saveStoredState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Erro ao salvar estado no localStorage:', e);
  }
};

/**
 * Sincroniza dados com o Google Sheets via Apps Script Web App
 */
export async function syncToGoogleSheets(
  sheetName: 'Agendamentos' | 'Pacientes' | 'Médicos' | 'Prontuários_PEP',
  op: 'add' | 'update' | 'delete' | 'sync_all',
  rowOrRows: any,
  webhookUrl: string
): Promise<{ success: boolean; message?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL do Google Sheets não configurada ou inválida' };
  }

  try {
    const payload =
      op === 'sync_all'
        ? { sheet: sheetName, op, allRows: rowOrRows }
        : { sheet: sheetName, op, row: rowOrRows };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Servidor respondeu com status ${response.status}`);
    }

    const data = await response.json();
    return { success: data.success !== false, message: data.message || 'Sincronizado com sucesso' };
  } catch (err: any) {
    console.warn('Sincronização em segundo plano com Google Sheets:', err.message || err);
    // Retorna mensagem amigável sem quebrar o fluxo local
    return {
      success: false,
      message: `Erro de conexão com o script Google: ${err.message || 'Não foi possível contatar o webhook'}. Os dados foram preservados localmente!`,
    };
  }
}

/**
 * Exportador rápido de CSV para download direto
 */
export function exportTableToCsv(filename: string, headers: string[], rows: any[][]): void {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(';'), ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))].join(
      '\r\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', `${filename}_${getHojeIso()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
